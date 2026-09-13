"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { alternarEdicao } from "@/app/admin/acoes";
import { publicarRegistros, salvarEdicoes } from "@/app/editar/acoes";
import type { TabelaComRascunho } from "@/lib/rascunhos";

export type Alteracao = {
  tabela: TabelaComRascunho;
  registroId: string;
  caminho: string;
  valor: string;
  anterior: string;
  /**
   * Como devolver a tela ao valor antigo.
   *
   * Texto e imagem desfazem de jeitos diferentes — um mexe no textContent do
   * nó, o outro no estado do React. Em vez de o provedor conhecer os dois
   * casos, quem registra a alteração entrega a própria maneira de reverter.
   */
  restaurar: (valor: string) => void;
};

type Contexto = {
  registrar: (alteracao: Alteracao) => void;
  pendentes: Alteracao[];
};

const ContextoEdicao = createContext<Contexto | null>(null);

export function useEdicao() {
  const contexto = useContext(ContextoEdicao);
  if (!contexto) throw new Error("useEdicao precisa estar dentro de ProvedorEdicao");
  return contexto;
}

function chave(a: Alteracao) {
  return `${a.tabela}:${a.registroId}:${a.caminho}`;
}

export function ProvedorEdicao({
  children,
  jaSalvos = [],
}: {
  children: React.ReactNode;
  /** Registros desta página que já têm rascunho de visitas anteriores. */
  jaSalvos?: { tabela: TabelaComRascunho; registroId: string }[];
}) {
  const [pendentes, setPendentes] = useState<Alteracao[]>([]);
  const [estado, setEstado] = useState<{ erro?: string; ok?: boolean; publicado?: boolean }>({});
  const [salvando, iniciarSalvamento] = useTransition();

  /*
    O que foi salvo nesta rodada e ainda não está no ar.

    Guardo para o botão de publicar mandar exatamente estes registros. Publicar
    "tudo que está pendente" levaria junto rascunho de outra página que você
    talvez não quisesse no ar ainda.
  */
  const [salvos, setSalvos] = useState(jaSalvos);

  const registrar = useCallback((alteracao: Alteracao) => {
    setPendentes((anteriores) => {
      // Editar o mesmo campo duas vezes não vira duas alterações. A primeira
      // guarda o valor original, que é o que "desfazer" precisa.
      const jaExiste = anteriores.find((a) => chave(a) === chave(alteracao));
      if (!jaExiste) return [...anteriores, alteracao];
      return anteriores.map((a) =>
        chave(a) === chave(alteracao) ? { ...alteracao, anterior: a.anterior } : a,
      );
    });
    setEstado({});
  }, []);

  const desfazer = useCallback(() => {
    setPendentes((anteriores) => {
      const ultima = anteriores.at(-1);
      if (!ultima) return anteriores;
      ultima.restaurar(ultima.anterior);
      return anteriores.slice(0, -1);
    });
  }, []);

  const descartarTudo = useCallback(() => {
    setPendentes((anteriores) => {
      // De trás para a frente: se duas pendências tocaram o mesmo campo, o
      // valor que tem de sobrar é o mais antigo.
      for (const alteracao of [...anteriores].reverse()) {
        alteracao.restaurar(alteracao.anterior);
      }
      return [];
    });
    setEstado({});
  }, []);

  const salvar = useCallback(() => {
    iniciarSalvamento(async () => {
      const resultado = await salvarEdicoes(
        pendentes.map(({ tabela, registroId, caminho, valor }) => ({
          tabela,
          registroId,
          caminho,
          valor,
        })),
      );

      if (resultado.ok) {
        const unicos = new Map(
          pendentes.map((a) => [`${a.tabela}:${a.registroId}`, { tabela: a.tabela, registroId: a.registroId }]),
        );
        setSalvos([...unicos.values()]);
        setPendentes([]);
        setEstado({ ok: true });
      } else {
        setEstado({ erro: resultado.erro });
      }
    });
  }, [pendentes]);

  /**
   * O caminho principal: escreve e já vai ao ar, num clique.
   *
   * Rascunho continua existindo como opção — serve para escrever hoje e
   * decidir amanhã. Mas quem só quer corrigir uma frase não deveria precisar
   * de dois passos e de uma visita ao painel para isso.
   */
  const salvarEPublicar = useCallback(() => {
    iniciarSalvamento(async () => {
      const alvos = new Map(
        pendentes.map((a) => [`${a.tabela}:${a.registroId}`, { tabela: a.tabela, registroId: a.registroId }]),
      );

      const salvamento = await salvarEdicoes(
        pendentes.map(({ tabela, registroId, caminho, valor }) => ({ tabela, registroId, caminho, valor })),
      );

      if (!salvamento.ok) {
        setEstado({ erro: salvamento.erro });
        return;
      }

      const publicacao = await publicarRegistros([...alvos.values()]);

      if (publicacao.ok) {
        setPendentes([]);
        setSalvos([]);
        setEstado({ publicado: true });
      } else {
        // Salvou e não publicou: o texto não se perdeu, e o botão de publicar
        // continua ali para tentar de novo.
        setSalvos([...alvos.values()]);
        setPendentes([]);
        setEstado({ erro: publicacao.erro });
      }
    });
  }, [pendentes]);

  const publicar = useCallback(() => {
    iniciarSalvamento(async () => {
      const resultado = await publicarRegistros(salvos);
      if (resultado.ok) {
        setSalvos([]);
        setEstado({ publicado: true });
      } else {
        setEstado({ erro: resultado.erro });
      }
    });
  }, [salvos]);

  const valor = useMemo(() => ({ registrar, pendentes }), [registrar, pendentes]);

  return (
    <ContextoEdicao.Provider value={valor}>
      {children}
      <BarraFlutuante
        quantidade={pendentes.length}
        porPublicar={salvos.length}
        salvando={salvando}
        estado={estado}
        aoSalvar={salvar}
        aoSalvarEPublicar={salvarEPublicar}
        aoPublicar={publicar}
        aoDesfazer={desfazer}
        aoDescartar={descartarTudo}
      />
    </ContextoEdicao.Provider>
  );
}

function BarraFlutuante({
  quantidade,
  porPublicar,
  salvando,
  estado,
  aoSalvar,
  aoSalvarEPublicar,
  aoPublicar,
  aoDesfazer,
  aoDescartar,
}: {
  quantidade: number;
  porPublicar: number;
  salvando: boolean;
  estado: { erro?: string; ok?: boolean; publicado?: boolean };
  aoSalvar: () => void;
  aoSalvarEPublicar: () => void;
  aoPublicar: () => void;
  aoDesfazer: () => void;
  aoDescartar: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Edição da página"
      className="sticky bottom-[var(--e4)] z-40 mx-auto mt-[var(--e6)] flex w-fit flex-wrap items-center gap-[var(--e3)] border border-[var(--acento)] bg-[var(--papel)] px-[var(--e4)] py-[var(--e2)]"
    >
      <span className="corpo-p" aria-live="polite">
        {estado.erro
          ? estado.erro
          : estado.publicado
            ? "No ar."
            : estado.ok
              ? "Salvo como rascunho. Ainda não está no ar."
              : quantidade === 0
                ? "Clique em qualquer texto ou imagem para editar."
                : `${quantidade} ${quantidade === 1 ? "alteração" : "alterações"} sem salvar`}
      </span>

      {/*
        Sair daqui e não do painel. Recarrega a página inteira de propósito:
        quem decide se esta URL mostra a versão pública ou a editável é o
        middleware, e ele só roda numa navegação de verdade.
      */}
      <button
        type="button"
        disabled={salvando}
        onClick={async () => {
          await alternarEdicao(false);
          window.location.reload();
        }}
        className="enlace corpo-p disabled:opacity-40"
      >
        sair da edição
      </button>

      <button
        type="button"
        onClick={aoDesfazer}
        disabled={quantidade === 0 || salvando}
        className="enlace corpo-p disabled:opacity-40"
      >
        desfazer
      </button>
      <button
        type="button"
        onClick={aoDescartar}
        disabled={quantidade === 0 || salvando}
        className="enlace corpo-p disabled:opacity-40"
      >
        descartar
      </button>
      <button
        type="button"
        onClick={aoSalvar}
        disabled={quantidade === 0 || salvando}
        className="enlace corpo-p disabled:opacity-40"
      >
        só salvar rascunho
      </button>

      <button
        type="button"
        onClick={aoSalvarEPublicar}
        disabled={quantidade === 0 || salvando}
        className="acao acao-forte disabled:opacity-40"
      >
        {salvando ? "publicando" : "publicar"}
      </button>

      {/* Rascunho de visita anterior, sem alteração nova na tela agora. */}
      {porPublicar > 0 && quantidade === 0 ? (
        <button
          type="button"
          onClick={aoPublicar}
          disabled={salvando}
          className="acao acao-forte disabled:opacity-40"
        >
          publicar rascunho salvo
        </button>
      ) : null}
    </div>
  );
}
