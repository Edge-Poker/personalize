"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type { PerguntaPublica } from "@/lib/briefing";
import type { EstadoBriefing } from "@/app/(site)/briefing/acoes";
import { Resultado } from "@/components/briefing/resultado";

/**
 * O briefing, uma pergunta por tela.
 *
 * Este componente nao sabe quanto nada custa, e isso e proposital: ele recebe
 * `PerguntaPublica`, que e a projecao sem pesos feita em lib/briefing.ts. Todo
 * numero aparece depois, vindo da resposta do servidor.
 *
 * As perguntas tambem nao estao aqui. Chegam do banco e sao desenhadas como
 * vierem — mudar uma opcao pelo painel muda a tela, sem passar por deploy.
 */

const GUARDA = "personalize:briefing";

type Marcadas = Record<string, string | string[]>;

/** Sete perguntas mais a tela de contato. */
function totalDeTelas(perguntas: PerguntaPublica[]) {
  return perguntas.length + 1;
}

function respondida(pergunta: PerguntaPublica, marcadas: Marcadas): boolean {
  const valor = marcadas[pergunta.chave];
  if (pergunta.tipo === "unica") return typeof valor === "string" && valor.length > 0;
  return Array.isArray(valor) && valor.length > 0;
}

export function BriefingMotor({
  perguntas,
  inicial,
  token,
  acao,
}: {
  perguntas: PerguntaPublica[];
  /** Respostas de um briefing reaberto pelo link. */
  inicial?: Marcadas;
  token?: string;
  acao: (anterior: EstadoBriefing, dados: FormData) => Promise<EstadoBriefing>;
}) {
  const [marcadas, setMarcadas] = useState<Marcadas>(inicial ?? {});
  const [tela, setTela] = useState(0);
  const [estado, enviar, enviando] = useActionState<EstadoBriefing, FormData>(acao, {
    estado: "parado",
  });
  const regiao = useRef<HTMLDivElement>(null);

  const total = totalDeTelas(perguntas);
  const pergunta = perguntas[tela] ?? null;
  const noContato = tela === perguntas.length;

  /*
    Retomar de onde parou.

    So no briefing novo. Num briefing reaberto pelo link, o que vale sao as
    respostas que vieram do banco — sobrepor com o rascunho de outra sessao
    faria o visitante revisar respostas que nao sao as dele.
  */
  useEffect(() => {
    if (inicial) return;
    try {
      const salvo = window.localStorage.getItem(GUARDA);
      if (salvo) setMarcadas(JSON.parse(salvo) as Marcadas);
    } catch {
      // Armazenamento negado ou json corrompido. Comeca do zero, que e o
      // comportamento correto de qualquer forma.
    }
  }, [inicial]);

  useEffect(() => {
    if (inicial) return;
    try {
      window.localStorage.setItem(GUARDA, JSON.stringify(marcadas));
    } catch {
      // Modo privado costuma recusar. Nao ha o que fazer, e nada quebra.
    }
  }, [marcadas, inicial]);

  const avancar = useCallback(() => {
    setTela((atual) => Math.min(atual + 1, total - 1));
  }, [total]);

  const voltar = useCallback(() => {
    setTela((atual) => Math.max(atual - 1, 0));
  }, []);

  function marcar(pergunta: PerguntaPublica, valor: string) {
    if (pergunta.tipo === "unica") {
      setMarcadas((antes) => ({ ...antes, [pergunta.chave]: valor }));
      // Escolha unica nao precisa de confirmacao: clicar ja e a resposta.
      window.setTimeout(avancar, 180);
      return;
    }

    setMarcadas((antes) => {
      const atuais = Array.isArray(antes[pergunta.chave]) ? (antes[pergunta.chave] as string[]) : [];
      const opcao = pergunta.opcoes.find((o) => o.valor === valor);

      // "Nada disso" e uma resposta, e ela limpa as outras. E o inverso
      // tambem: marcar qualquer outra coisa tira o "nada disso".
      if (opcao?.neutra) {
        return { ...antes, [pergunta.chave]: atuais.includes(valor) ? [] : [valor] };
      }

      const semNeutras = atuais.filter((item) => {
        const outra = pergunta.opcoes.find((o) => o.valor === item);
        return !outra?.neutra;
      });

      if (semNeutras.includes(valor)) {
        return { ...antes, [pergunta.chave]: semNeutras.filter((item) => item !== valor) };
      }

      // Teto respeitado na entrada: o mais antigo sai para o novo entrar, em
      // vez de o clique simplesmente nao responder.
      const proximas = [...semNeutras, valor];
      const cortadas =
        pergunta.maxEscolhas !== null && proximas.length > pergunta.maxEscolhas
          ? proximas.slice(proximas.length - pergunta.maxEscolhas)
          : proximas;

      return { ...antes, [pergunta.chave]: cortadas };
    });
  }

  /*
    Teclado completo, como pede o 5.2.

    Numero escolhe a opcao, Enter avanca, Esc e seta esquerda voltam. O ouvinte
    fica no documento e nao num campo: numa tela sem foco visivel, exigir que a
    pessoa "clique em algum lugar" antes de o teclado funcionar seria um
    atalho que so quem ja sabe usa.
  */
  useEffect(() => {
    if (estado.estado === "pronto") return;

    function aoTeclar(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement | null;
      // Dentro de um campo de texto, o teclado e do campo.
      if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA")) return;

      if (evento.key === "Escape" || evento.key === "ArrowLeft") {
        evento.preventDefault();
        voltar();
        return;
      }

      if (!pergunta) return;

      if (evento.key === "Enter" || evento.key === "ArrowRight") {
        if (respondida(pergunta, marcadas)) {
          evento.preventDefault();
          avancar();
        }
        return;
      }

      const numero = Number(evento.key);
      if (Number.isInteger(numero) && numero >= 1 && numero <= pergunta.opcoes.length) {
        evento.preventDefault();
        marcar(pergunta, pergunta.opcoes[numero - 1]!.valor);
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  });

  // Leitor de tela precisa saber que a tela trocou: sem isto, o foco fica onde
  // estava e a pergunta nova passa despercebida.
  useEffect(() => {
    regiao.current?.focus();
  }, [tela]);

  if (estado.estado === "pronto") {
    // As perguntas e as marcacoes vao junto: a tela de resultado agora lista o
    // que foi escolhido, e quem tem os rotulos e quem tem as respostas e aqui.
    return (
      <Resultado
        resultado={estado.resultado}
        token={estado.token}
        perguntas={perguntas}
        respostas={marcadas}
      />
    );
  }

  return (
    <div className="briefing">
      <Progresso atual={tela} total={total} />

      <div
        className="briefing-tela"
        ref={regiao}
        tabIndex={-1}
        // A troca de pergunta e a mesma sempre, e a chave e o que a dispara.
        key={pergunta?.chave ?? "contato"}
        aria-live="polite"
      >
        {pergunta ? (
          <PerguntaNaTela
            pergunta={pergunta}
            marcadas={marcadas}
            aoMarcar={(valor) => marcar(pergunta, valor)}
            aoAvancar={avancar}
          />
        ) : (
          <TelaDeContato
            enviar={enviar}
            enviando={enviando}
            marcadas={marcadas}
            token={token}
            erro={estado.estado === "erro" ? estado.mensagem : null}
          />
        )}
      </div>

      <div className="briefing-rodape">
        {tela > 0 ? (
          <button type="button" className="briefing-voltar" onClick={voltar}>
            voltar
          </button>
        ) : (
          <span />
        )}
        <span className="nota numero">
          {Math.min(tela + 1, total)} de {total}
        </span>
      </div>
    </div>
  );
}

/**
 * O progresso.
 *
 * O ponto da marca anda pela linha, em vez de uma barra que engorda. E o mesmo
 * ponto do `persona.lize` no cabecalho: a marca vira o indicador em vez de
 * haver dois vocabularios visuais na mesma tela.
 */
function Progresso({ atual, total }: { atual: number; total: number }) {
  const porcento = total <= 1 ? 0 : (atual / (total - 1)) * 100;

  return (
    <div
      className="briefing-progresso"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={atual + 1}
      aria-label="Progresso do briefing"
    >
      <span className="briefing-trilho" aria-hidden="true" />
      <span className="briefing-ponto" style={{ left: `${porcento}%` }} aria-hidden="true" />
    </div>
  );
}

function PerguntaNaTela({
  pergunta,
  marcadas,
  aoMarcar,
  aoAvancar,
}: {
  pergunta: PerguntaPublica;
  marcadas: Marcadas;
  aoMarcar: (valor: string) => void;
  aoAvancar: () => void;
}) {
  const valor = marcadas[pergunta.chave];
  const lista = Array.isArray(valor) ? valor : valor ? [valor] : [];

  return (
    <fieldset className="briefing-campo">
      <legend className="briefing-enunciado titulo-2">{pergunta.enunciado}</legend>
      {pergunta.ajuda ? <p className="nota mt-[var(--e2)]">{pergunta.ajuda}</p> : null}

      <div className="briefing-opcoes">
        {pergunta.opcoes.map((opcao, indice) => {
          const escolhida = lista.includes(opcao.valor);
          return (
            <button
              key={opcao.valor}
              type="button"
              className={escolhida ? "briefing-opcao briefing-opcao-marcada" : "briefing-opcao"}
              aria-pressed={escolhida}
              onClick={() => aoMarcar(opcao.valor)}
            >
              {/* O numero e o atalho de teclado, escrito onde ele vale. */}
              <span className="briefing-tecla numero" aria-hidden="true">
                {indice + 1}
              </span>
              <span>{opcao.rotulo}</span>
            </button>
          );
        })}
      </div>

      {/* Escolha unica avanca sozinha; multipla precisa de um "pronto". */}
      {pergunta.tipo === "multipla" ? (
        <div className="mt-[var(--e5)]">
          <button
            type="button"
            className="acao"
            onClick={aoAvancar}
            disabled={lista.length === 0}
          >
            continuar
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}

function TelaDeContato({
  enviar,
  enviando,
  marcadas,
  token,
  erro,
}: {
  enviar: (dados: FormData) => void;
  enviando: boolean;
  marcadas: Marcadas;
  token?: string;
  erro: string | null;
}) {
  return (
    <form action={enviar} className="briefing-campo">
      <h2 className="briefing-enunciado titulo-2">Para onde eu mando o resultado?</h2>
      <p className="nota mt-[var(--e2)]">
        Só isso. O resultado aparece na tela seguinte de qualquer jeito.
      </p>

      {/* As respostas viajam como um campo so: o servidor as valida contra as
          opcoes do banco antes de calcular qualquer coisa. */}
      <input type="hidden" name="respostas" value={JSON.stringify(marcadas)} />
      {token ? <input type="hidden" name="token" value={token} /> : null}

      <div className="briefing-contato">
        <label className="briefing-rotulo">
          <span>Seu nome</span>
          <input name="nome" required minLength={2} maxLength={120} className="campo" autoComplete="name" />
        </label>

        <label className="briefing-rotulo">
          <span>E-mail</span>
          <input name="email" type="email" maxLength={200} className="campo" autoComplete="email" />
        </label>

        <label className="briefing-rotulo">
          <span>ou WhatsApp</span>
          <input name="whatsapp" maxLength={30} className="campo" autoComplete="tel" />
        </label>

        <label className="briefing-rotulo">
          <span>Ficou algo de fora? (opcional)</span>
          <input name="observacao" maxLength={400} className="campo" />
        </label>
      </div>

      {/* Isca antispam. Fora da tela, mas nao com display:none — leitor de tela
          ignora pelo aria-hidden, e robo que le o html preenche. */}
      <div className="so-leitor" aria-hidden="true">
        <label>
          Não preencha
          <input name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {erro ? (
        <p className="briefing-erro corpo mt-[var(--e4)]" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="mt-[var(--e5)]">
        <button type="submit" className="acao acao-forte" disabled={enviando}>
          {enviando ? "calculando…" : "ver o resultado"}
        </button>
      </div>
    </form>
  );
}
