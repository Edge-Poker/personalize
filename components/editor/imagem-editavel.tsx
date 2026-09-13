"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { enviarImagem } from "@/lib/enviar-imagem";
import { urlDaMidia } from "@/lib/midia";
import type { PropsImagem } from "@/components/imagem";
import { MarcaGrafica } from "@/components/marca-grafica";
import { listarMidia, type ItemDeMidia } from "@/app/editar/acoes";
import { useEdicao } from "./provedor";

/**
 * Imagem que se troca clicando nela, no próprio site.
 *
 * Clicar abre os seus arquivos direto. A mediateca virou a opção secundária —
 * ela servia para reaproveitar imagem já enviada, mas tinha virado pedágio:
 * para usar uma foto nova era preciso ir ao painel, enviar, voltar à página e
 * escolher. Ninguém trabalha assim.
 *
 * Não salva sozinha: registra a alteração e deixa a barra flutuante gravar,
 * igual ao texto. É o que faz "descartar" e "desfazer" valerem para imagem.
 */
export function ImagemEditavel({
  tabela,
  registroId,
  caminho,
  caminhoAlt,
  path,
  alt,
  reserva,
  className = "",
}: PropsImagem) {
  const { registrar } = useEdicao();
  const [atual, setAtual] = useState<string | null>(path);
  const [descricao, setDescricao] = useState(alt);
  const [escolhido, setEscolhido] = useState<File | null>(null);
  const [altNovo, setAltNovo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mediateca, setMediateca] = useState(false);

  const seletor = useRef<HTMLInputElement>(null);
  const original = useRef<string | null>(path);
  const originalAlt = useRef(alt);

  function aplicar(item: { path: string; alt: string }) {
    const pathAnterior = original.current ?? "";
    const altAnterior = originalAlt.current;

    setAtual(item.path);
    setDescricao(item.alt);

    registrar({
      tabela,
      registroId,
      caminho,
      valor: item.path,
      anterior: pathAnterior,
      restaurar: (valor) => {
        setAtual(valor || null);
        original.current = valor || null;
      },
    });

    // A descrição vai junto. Trocar a foto e deixar o alt antigo faria o site
    // descrever a imagem errada para quem não enxerga.
    registrar({
      tabela,
      registroId,
      caminho: caminhoAlt,
      valor: item.alt,
      anterior: altAnterior,
      restaurar: (valor) => {
        setDescricao(valor);
        originalAlt.current = valor;
      },
    });

    original.current = item.path;
    originalAlt.current = item.alt;
  }

  async function enviar() {
    if (!escolhido) return;
    setEnviando(true);
    setErro(null);

    const resultado = await enviarImagem(escolhido, altNovo);

    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    aplicar(resultado.item);
    setEscolhido(null);
    setAltNovo("");
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => seletor.current?.click()}
        aria-label={atual ? "Trocar esta imagem" : "Escolher uma imagem"}
        className={`group relative block w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-offset-4 hover:outline hover:outline-1 hover:outline-dashed hover:outline-[var(--tinta-fraca)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--acento)] ${className}`}
      >
        {atual ? (
          <NextImage
            src={urlDaMidia(atual)}
            alt={descricao}
            width={1600}
            height={1000}
            className="w-full"
            sizes="(max-width: 760px) 100vw, 70vw"
          />
        ) : (
          <MarcaGrafica chave={reserva} className="w-full" />
        )}

        <span className="corpo-p pointer-events-none absolute bottom-[var(--e2)] left-[var(--e2)] hidden border border-[var(--acento)] bg-[var(--papel)] px-[var(--e2)] py-[2px] text-[var(--acento)] group-hover:block">
          {atual ? "trocar imagem" : "escolher imagem"}
        </span>
      </button>

      <input
        ref={seletor}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          if (!arquivo) return;
          setEscolhido(arquivo);
          setAltNovo("");
          setErro(null);
          // Limpa para escolher o mesmo arquivo duas vezes seguidas funcionar.
          evento.target.value = "";
        }}
      />

      {escolhido ? (
        <div className="mt-[var(--e3)] border border-[var(--acento)] p-[var(--e3)]">
          <p className="corpo-p">{escolhido.name}</p>
          <label htmlFor={`alt-${registroId}-${caminho}`} className="corpo-p mt-[var(--e2)] block">
            O que aparece na imagem
          </label>
          <p id={`ajuda-${registroId}-${caminho}`} className="nota">
            Obrigatório. É o que alguém que não enxerga a imagem vai ler no lugar dela.
          </p>
          <input
            id={`alt-${registroId}-${caminho}`}
            value={altNovo}
            onChange={(evento) => setAltNovo(evento.target.value)}
            aria-describedby={`ajuda-${registroId}-${caminho}`}
            className="mt-[var(--e2)] w-full border border-[var(--linha)] bg-transparent px-[var(--e3)] py-[var(--e2)] text-[15px]"
          />

          <div className="mt-[var(--e3)] flex flex-wrap items-center gap-[var(--e3)]">
            <button
              type="button"
              onClick={enviar}
              disabled={enviando || altNovo.trim().length === 0}
              className="acao acao-forte disabled:opacity-40"
            >
              {enviando ? "enviando" : "usar esta imagem"}
            </button>
            <button
              type="button"
              onClick={() => setEscolhido(null)}
              className="enlace corpo-p"
            >
              cancelar
            </button>
          </div>

          {erro ? (
            <p role="alert" className="corpo-p mt-[var(--e2)] text-[var(--acento)]">
              {erro}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMediateca(true)}
          className="enlace nota mt-[var(--e1)]"
        >
          ou usar uma imagem já enviada
        </button>
      )}

      {mediateca ? (
        <Mediateca
          aoEscolher={(item) => {
            aplicar(item);
            setMediateca(false);
          }}
          aoFechar={() => setMediateca(false)}
        />
      ) : null}
    </div>
  );
}

function Mediateca({
  aoEscolher,
  aoFechar,
}: {
  aoEscolher: (item: ItemDeMidia) => void;
  aoFechar: () => void;
}) {
  const [itens, setItens] = useState<ItemDeMidia[] | null>(null);

  useEffect(() => {
    listarMidia().then(setItens);

    // Esc fecha. Diálogo que só fecha no X é diálogo que prende.
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagens já enviadas"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--papel)_86%,transparent)] p-[var(--e4)]"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div className="max-h-[80dvh] w-full max-w-[900px] overflow-auto border border-[var(--linha)] bg-[var(--papel)] p-[var(--e5)]">
        <div className="flex items-baseline justify-between gap-[var(--e4)]">
          <h2 className="titulo-3">Imagens já enviadas</h2>
          <button type="button" onClick={aoFechar} className="enlace corpo-p">
            fechar
          </button>
        </div>

        {itens === null ? (
          <p className="corpo mt-[var(--e4)]">Carregando.</p>
        ) : itens.length === 0 ? (
          <p className="corpo medida mt-[var(--e4)]">
            Nenhuma imagem enviada ainda. Feche isto e clique na imagem da página para
            mandar uma do seu computador.
          </p>
        ) : (
          <ul className="mt-[var(--e4)] grid gap-[var(--e4)] sm:grid-cols-3">
            {itens.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => aoEscolher(item)}
                  className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left hover:outline hover:outline-2 hover:outline-[var(--acento)]"
                >
                  <NextImage
                    src={urlDaMidia(item.path)}
                    alt={item.alt}
                    width={item.largura ?? 400}
                    height={item.altura ?? 300}
                    className="w-full"
                    sizes="240px"
                  />
                  <span className="nota mt-[var(--e1)] block">{item.alt}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
