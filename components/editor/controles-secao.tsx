"use client";

import { useState, useTransition } from "react";
import type { PropsAdicionar, PropsControles } from "@/components/controles";
import { apagarSecao, inserirSecao, moverSecao } from "@/app/editar/acoes";

const NOMES: Record<string, string> = {
  heroi: "abertura da home",
  intro: "abertura de página",
  texto: "texto",
  imagem: "imagem",
  convite: "chamada com botão",
  servicos: "lista de serviços",
  trabalhos: "lista de trabalhos",
};

const TIPOS = [
  { id: "texto", rotulo: "bloco de texto" },
  { id: "imagem", rotulo: "bloco de imagem" },
  { id: "intro", rotulo: "abertura de página" },
  { id: "convite", rotulo: "chamada com botão" },
  { id: "servicos", rotulo: "lista de serviços" },
  { id: "trabalhos", rotulo: "lista de trabalhos" },
] as const;

/**
 * A barra que aparece em cima de cada bloco no modo de edição.
 *
 * Estas ações vão direto para o banco e já ficam no ar — não passam por
 * rascunho. Adicionar, apagar e mover um bloco não tem meio-termo útil: ou o
 * bloco está lá ou não está. O que passa por rascunho é o texto e a imagem
 * dentro dele, onde dá para escrever, olhar e desistir.
 */
export function ControlesSecao({ secaoId, dono, tipo, ordem, primeiro, ultimo }: PropsControles) {
  const [abrindo, setAbrindo] = useState(false);
  const [ocupado, iniciar] = useTransition();

  return (
    <div className="grade" aria-label="Controles do bloco">
      <div className="calha" />
      <div className="mancha mt-[var(--e5)] flex flex-wrap items-center gap-[var(--e3)] border border-dashed border-[var(--acento)] px-[var(--e3)] py-[var(--e2)]">
        <span className="corpo-p" style={{ color: "var(--acento)" }}>
          bloco: {NOMES[tipo] ?? tipo}
        </span>
        <button
          type="button"
          disabled={primeiro || ocupado}
          onClick={() => iniciar(() => moverSecao(secaoId, "cima").then(() => undefined))}
          className="enlace corpo-p disabled:opacity-30"
        >
          subir
        </button>

        <button
          type="button"
          disabled={ultimo || ocupado}
          onClick={() => iniciar(() => moverSecao(secaoId, "baixo").then(() => undefined))}
          className="enlace corpo-p disabled:opacity-30"
        >
          descer
        </button>

        <button
          type="button"
          disabled={ocupado}
          onClick={() => setAbrindo((estava) => !estava)}
          className="enlace corpo-p disabled:opacity-30"
          aria-expanded={abrindo}
        >
          inserir bloco aqui embaixo
        </button>

        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            // Apagar bloco é irreversível e vai direto ao ar. Uma confirmação
            // do navegador é feia e evita o acidente.
            if (!window.confirm("Apagar este bloco? Isso vai ao ar na hora e não tem desfazer.")) {
              return;
            }
            iniciar(() => apagarSecao(secaoId).then(() => undefined));
          }}
          className="enlace corpo-p ml-auto disabled:opacity-30"
        >
          apagar bloco
        </button>

        {abrindo ? (
          <ul className="w-full pb-[var(--e2)]">
            {TIPOS.map((tipo) => (
              <li key={tipo.id}>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => {
                    setAbrindo(false);
                    iniciar(() => inserirSecao(dono, tipo.id, ordem).then(() => undefined));
                  }}
                  className="enlace corpo-p disabled:opacity-30"
                >
                  {tipo.rotulo}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Acrescentar bloco no fim, inclusive quando não existe nenhum.
 *
 * Sem isto, um trabalho recém-criado ficaria sem nenhuma barra na tela e sem
 * caminho para o primeiro bloco — o clássico estado vazio que não ensina o que
 * fazer.
 */
export function AdicionarBloco({ dono, ordem }: PropsAdicionar) {
  const [abrindo, setAbrindo] = useState(false);
  const [ocupado, iniciar] = useTransition();

  return (
    <div className="grade pb-[var(--e6)]">
      <div className="calha" />
      <div className="mancha border border-dashed border-[var(--acento)] px-[var(--e3)] py-[var(--e2)]">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => setAbrindo((estava) => !estava)}
          aria-expanded={abrindo}
          className="corpo-p"
          style={{ color: "var(--acento)" }}
        >
          acrescentar bloco no fim desta página
        </button>

        {abrindo ? (
          <ul className="mt-[var(--e2)]">
            {TIPOS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => {
                    setAbrindo(false);
                    iniciar(() => inserirSecao(dono, item.id, ordem).then(() => undefined));
                  }}
                  className="enlace corpo-p disabled:opacity-30"
                >
                  {item.rotulo}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
