import type { Metadata } from "next";
import Link from "next/link";
import { perguntasPublicas } from "@/lib/briefing";
import { BriefingMotor } from "@/components/briefing/motor";
import { concluirBriefing } from "./acoes";

export const metadata: Metadata = {
  title: "Briefing",
  description: "Sete perguntas curtas para eu entender o que você precisa.",
  // Fora do indice: e uma ferramenta para quem ja chegou, nao uma porta de
  // entrada. Indexada, competiria com /servicos pela mesma busca.
  robots: { index: false, follow: true },
};

/*
  A pagina e de servidor e o motor e de cliente, com uma fronteira estreita no
  meio: `perguntasPublicas()` devolve enunciado, opcoes e rotulos, e nada mais.
  Os pesos do calculo ficam do lado de ca — ver o `import "server-only"` no topo
  de lib/briefing.ts.
*/
export default async function Briefing() {
  const perguntas = await perguntasPublicas();

  // Banco sem pergunta nao e erro do visitante. Em vez de uma tela vazia com
  // uma barra de progresso de zero passos, o caminho ao lado.
  if (perguntas.length === 0) {
    return (
      <section className="grade pt-[var(--e7)] pb-[var(--e7)]">
        <div className="calha">
          <p className="nota">o briefing está fora do ar</p>
        </div>
        <div className="mancha">
          <h1 className="titulo-1 medida">Vamos pelo caminho curto</h1>
          <p className="corpo-g medida mt-[var(--e4)]">
            O questionário está indisponível agora. Me conte o que você precisa direto na página de
            contato — é a mesma conversa, com menos cliques.
          </p>
          <div className="mt-[var(--e5)] flex flex-wrap gap-[var(--e3)]">
            <Link href="/contato" className="acao acao-forte">
              falar comigo
            </Link>
            <Link href="/servicos" className="acao">
              ver os serviços
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grade pt-[var(--e6)] pb-[var(--e7)]">
      <div className="mancha">
        <BriefingMotor perguntas={perguntas} acao={concluirBriefing} />
      </div>
    </section>
  );
}
