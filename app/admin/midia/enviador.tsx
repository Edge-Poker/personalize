"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { registrarMidia } from "./acoes";

const PROPORCOES = [
  { rotulo: "livre", valor: 0 },
  { rotulo: "16:9", valor: 16 / 9 },
  { rotulo: "4:3", valor: 4 / 3 },
  { rotulo: "1:1", valor: 1 },
] as const;

/** Nenhuma tela precisa de mais que isto, e acima disso o arquivo pesa à toa. */
const LARGURA_MAXIMA = 2000;

type Estado =
  | { fase: "vazio" }
  | { fase: "recortando"; arquivo: File; url: string }
  | { fase: "enviando" }
  | { fase: "erro"; mensagem: string };

export function Enviador() {
  const [estado, setEstado] = useState<Estado>({ fase: "vazio" });
  const [proporcao, setProporcao] = useState<number>(0);
  const [zoom, setZoom] = useState(1);
  const [alt, setAlt] = useState("");
  const [sobrevoando, setSobrevoando] = useState(false);

  const imagem = useRef<HTMLImageElement>(null);
  const moldura = useRef<HTMLDivElement>(null);
  const deslocamento = useRef({ x: 0, y: 0 });
  const arrastando = useRef<{ x: number; y: number } | null>(null);

  // A URL do objeto segura memória até ser revogada. Sem isto, escolher dez
  // imagens seguidas deixa as dez na memória do navegador.
  useEffect(() => {
    if (estado.fase !== "recortando") return;
    const url = estado.url;
    return () => URL.revokeObjectURL(url);
  }, [estado]);

  const escolher = useCallback((arquivo: File | undefined) => {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setEstado({ fase: "erro", mensagem: "Isso não é uma imagem. Envie png, jpg ou webp." });
      return;
    }
    deslocamento.current = { x: 0, y: 0 };
    setZoom(1);
    setAlt("");
    setEstado({ fase: "recortando", arquivo, url: URL.createObjectURL(arquivo) });
  }, []);

  function aplicarTransformacao() {
    const no = imagem.current;
    if (!no) return;
    no.style.transform = `translate(${deslocamento.current.x}px, ${deslocamento.current.y}px) scale(${zoom})`;
  }

  useEffect(aplicarTransformacao, [zoom, estado]);

  async function enviar() {
    if (estado.fase !== "recortando") return;

    if (alt.trim().length === 0) {
      setEstado({ fase: "erro", mensagem: "Descreva a imagem antes de enviar." });
      return;
    }

    const no = imagem.current;
    const caixa = moldura.current;
    if (!no || !caixa) return;

    setEstado({ fase: "enviando" });

    try {
      const areaMoldura = caixa.getBoundingClientRect();
      const areaImagem = no.getBoundingClientRect();

      // Quanto de pixel original cabe em cada pixel de tela.
      const escala = no.naturalWidth / areaImagem.width;

      const recorteLargura = Math.round(areaMoldura.width * escala);
      const recorteAltura = Math.round(areaMoldura.height * escala);
      const recorteX = Math.round((areaMoldura.left - areaImagem.left) * escala);
      const recorteY = Math.round((areaMoldura.top - areaImagem.top) * escala);

      const reducao = Math.min(1, LARGURA_MAXIMA / recorteLargura);
      const larguraFinal = Math.max(1, Math.round(recorteLargura * reducao));
      const alturaFinal = Math.max(1, Math.round(recorteAltura * reducao));

      const tela = document.createElement("canvas");
      tela.width = larguraFinal;
      tela.height = alturaFinal;

      const contexto = tela.getContext("2d");
      if (!contexto) throw new Error("Este navegador não deixou desenhar a imagem.");

      contexto.imageSmoothingQuality = "high";
      contexto.drawImage(
        no,
        recorteX,
        recorteY,
        recorteLargura,
        recorteAltura,
        0,
        0,
        larguraFinal,
        alturaFinal,
      );

      /*
        WebP e nao AVIF: canvas.toBlob nao codifica AVIF em navegador nenhum
        hoje. A conversao para AVIF acontece depois, no next/image, que serve o
        formato que o navegador de quem visita aceita. Aqui o ganho ja e grande:
        um jpg de camera vira webp com uma fracao do peso, antes de subir.
      */
      const blob = await new Promise<Blob | null>((resolver) =>
        tela.toBlob(resolver, "image/webp", 0.85),
      );

      if (!blob) throw new Error("Não consegui converter a imagem.");

      const supabase = criarClienteNavegador();
      const caminho = `${new Date().getFullYear()}/${crypto.randomUUID()}.webp`;

      const { error: erroUpload } = await supabase.storage
        .from("midia")
        .upload(caminho, blob, { contentType: "image/webp", upsert: false });

      if (erroUpload) throw new Error(erroUpload.message);

      const resultado = await registrarMidia({
        path: caminho,
        alt: alt.trim(),
        largura: larguraFinal,
        altura: alturaFinal,
        bytes: blob.size,
      });

      if (!resultado.ok) throw new Error(resultado.erro ?? "Falha ao registrar.");

      setEstado({ fase: "vazio" });
      setAlt("");
    } catch (erro) {
      setEstado({
        fase: "erro",
        mensagem: erro instanceof Error ? erro.message : "Não consegui enviar a imagem.",
      });
    }
  }

  if (estado.fase === "recortando") {
    const alturaMoldura = proporcao === 0 ? 300 : Math.round(460 / proporcao);

    return (
      <div className="mt-[var(--e4)]">
        <div
          ref={moldura}
          className="relative mx-auto overflow-hidden border border-[var(--acento)]"
          style={{ width: 460, height: alturaMoldura }}
          onPointerDown={(evento) => {
            arrastando.current = {
              x: evento.clientX - deslocamento.current.x,
              y: evento.clientY - deslocamento.current.y,
            };
            evento.currentTarget.setPointerCapture(evento.pointerId);
          }}
          onPointerMove={(evento) => {
            if (!arrastando.current) return;
            deslocamento.current = {
              x: evento.clientX - arrastando.current.x,
              y: evento.clientY - arrastando.current.y,
            };
            aplicarTransformacao();
          }}
          onPointerUp={() => {
            arrastando.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imagem}
            src={estado.url}
            alt=""
            className="max-w-none cursor-grab select-none active:cursor-grabbing"
            style={{ transformOrigin: "top left" }}
            draggable={false}
          />
        </div>

        <div className="mt-[var(--e3)] flex flex-wrap items-center gap-[var(--e3)]">
          <span className="flex items-center gap-[var(--e2)]">
            <label htmlFor="zoom" className="nota">
              aproximar
            </label>
            <input
              id="zoom"
              type="range"
              min={0.2}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(evento) => setZoom(Number(evento.target.value))}
            />
          </span>

          <span className="flex items-center gap-[var(--e2)]">
            <label htmlFor="proporcao" className="nota">
              proporção
            </label>
            <select
              id="proporcao"
              value={proporcao}
              onChange={(evento) => setProporcao(Number(evento.target.value))}
              className="rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]"
            >
              {PROPORCOES.map((opcao) => (
                <option key={opcao.rotulo} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </span>
        </div>

        <div className="mt-[var(--e3)] max-w-[460px]">
          <label htmlFor="alt" className="corpo-p block">
            O que aparece na imagem
          </label>
          <p id="alt-ajuda" className="nota">
            Obrigatório. É o que alguém que não enxerga a imagem vai ler no lugar dela.
          </p>
          <input
            id="alt"
            value={alt}
            onChange={(evento) => setAlt(evento.target.value)}
            aria-describedby="alt-ajuda"
            required
            className="mt-[var(--e2)] w-full rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e3)] py-[var(--e2)] text-[15px]"
          />
        </div>

        <div className="mt-[var(--e3)] flex gap-[var(--e3)]">
          <button type="button" onClick={enviar} className="acao acao-forte">
            enviar
          </button>
          <button
            type="button"
            onClick={() => setEstado({ fase: "vazio" })}
            className="enlace corpo-p"
          >
            escolher outra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[var(--e4)]">
      <div
        onDragOver={(evento) => {
          evento.preventDefault();
          setSobrevoando(true);
        }}
        onDragLeave={() => setSobrevoando(false)}
        onDrop={(evento) => {
          evento.preventDefault();
          setSobrevoando(false);
          escolher(evento.dataTransfer.files[0]);
        }}
        className="rounded-[2px] border border-dashed p-[var(--e5)] text-center"
        style={{ borderColor: sobrevoando ? "var(--acento)" : "var(--linha)" }}
      >
        <p className="corpo">
          {estado.fase === "enviando"
            ? "Convertendo e enviando."
            : "Arraste uma imagem para cá."}
        </p>
        <p className="nota mt-[var(--e2)]">
          Ela é recortada, reduzida e convertida para WebP no seu navegador, antes de subir.
        </p>

        <label className="acao mt-[var(--e3)] cursor-pointer">
          escolher do computador
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(evento) => escolher(evento.target.files?.[0])}
          />
        </label>
      </div>

      {estado.fase === "erro" ? (
        <p role="alert" className="corpo-p mt-[var(--e3)] text-[var(--acento)]">
          {estado.mensagem}
        </p>
      ) : null}
    </div>
  );
}
