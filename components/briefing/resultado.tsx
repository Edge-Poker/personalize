"use client";

import { useState } from "react";
import type { PerguntaPublica, Respostas, Resultado as Dados } from "@/lib/briefing";
import { ResumoDoBriefing } from "@/components/briefing/resumo";

/**
 * A tela que aparece quando a pessoa termina o briefing.
 *
 * Ela mostra exatamente o que o link salvo mostra — o mesmo `ResumoDoBriefing`,
 * com a faixa desenhada, a composicao, o prazo, a maquete e as escolhas
 * listadas embaixo. Antes aqui havia uma versao resumida disso, e era pior por
 * dois motivos: a pessoa so via o trabalho completo depois de salvar, ou seja,
 * depois de ja ter decidido; e eram duas telas para manter em sincronia
 * dizendo a mesma coisa.
 *
 * Sobrou aqui o que e mesmo de cliente: os botoes e a copia do link. O resumo
 * em si nao tem estado nenhum.
 *
 * `ResumoDoBriefing` atravessa para o bundle sem arrastar nada junto — o que
 * ele importa de lib/briefing sao tipos, e tipo e apagado na compilacao. O
 * `server-only` fica do lado de la.
 */
export function Resultado({
  resultado,
  token,
  perguntas,
  respostas,
}: {
  resultado: Dados;
  token: string;
  perguntas: PerguntaPublica[];
  respostas: Respostas;
}) {
  const [copiado, setCopiado] = useState(false);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/briefing/${token}`;

  const mensagem = [
    "Oi! Terminei o briefing no site.",
    "",
    resultado.resumo,
    resultado.faixa ? `Faixa que o site calculou: ${resultado.faixa.texto}` : null,
    resultado.prazo ? `Prazo estimado: ${resultado.prazo.texto}` : null,
    "",
    `Minhas respostas: ${link}`,
  ]
    .filter((linha) => linha !== null)
    .join("\n");

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Area de transferencia negada (contexto inseguro, permissao recusada).
      // O endereco esta escrito ao lado e da para selecionar, entao nao ha o
      // que salvar nem o que avisar.
    }
  }

  return (
    <div>
      <ResumoDoBriefing
        resultado={resultado}
        respostas={respostas}
        perguntas={perguntas}
        nome={null}
        criadoEm={null}
      />

      <section className="cota mt-[var(--e6)]">
        <p className="nota">o que acontece agora</p>

        {/*
          O link deixou de ser uma nota cinza no rodape.

          Ele e a unica coisa desta tela que a pessoa perde se fechar a aba —
          todo o resto da para reconstruir respondendo de novo. Entao ganhou
          moldura, contraste de texto normal e o botao de copiar encostado, em
          vez de ficar em cinza claro embaixo de um botao que prometia "salvar
          para decidir depois" sem mostrar o que seria salvo.
        */}
        <div className="briefing-guardar mt-[var(--e4)]">
          <code className="briefing-endereco">{link}</code>
          <button type="button" className="acao briefing-copiar" onClick={copiarLink}>
            {copiado ? "copiado" : "copiar link"}
          </button>
        </div>

        <p className="nota medida mt-[var(--e2)]">
          Guarde esse endereço: ele reabre esta página inteira para revisar ou mudar as respostas, e
          vale 60 dias.
        </p>

        <div className="briefing-acoes mt-[var(--e5)]">
          <a
            className="acao acao-forte"
            href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            mandar por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
