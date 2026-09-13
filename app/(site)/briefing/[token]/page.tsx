import type { Metadata } from "next";
import Link from "next/link";
import { calcular, perguntasPublicas, type Respostas } from "@/lib/briefing";
import { BriefingMotor } from "@/components/briefing/motor";
import { ResumoDoBriefing } from "@/components/briefing/resumo";
import { criarClientePublico } from "@/lib/supabase/publico";
import { reenviarBriefing } from "../acoes";

export const metadata: Metadata = {
  title: "Suas respostas",
  // Nunca indexado, e nunca seguido: a url contem um token que da acesso a um
  // lead. Buscador que a rastreasse a colocaria em cache publico.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * O link que o cliente guarda — e o mesmo que o painel abre em "abrir como o
 * cliente ve", para nao haver duas versoes da mesma verdade.
 *
 * Por padrao e uma pagina de leitura: o resumo, a faixa desenhada, a
 * composicao, o prazo, a direcao e tudo que ele marcou. A edicao existe, como
 * pede o 5.2, mas atras de `?editar=1` — assim quem abre o link cai numa
 * pagina pronta em vez de num formulario para refazer.
 *
 * O modo vive na url e nao em estado de cliente: recarregar mantem onde estava,
 * e o link da versao de leitura continua sendo o endereco limpo.
 *
 * A tabela `leads` segue fechada. Quem responde e `briefing_por_token`, uma
 * funcao `security definer` que monta o objeto a mao — sem status, sem ip, sem
 * user agent, sem id interno. Com o token na mao nao ha como ler o que o
 * visitante nao escreveu.
 */
export default async function BriefingSalvo({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { token } = await params;
  const { editar } = await searchParams;
  const supabase = criarClientePublico();

  const [{ data }, perguntas] = await Promise.all([
    supabase.rpc("briefing_por_token", { p_token: token }),
    perguntasPublicas(),
  ]);

  const salvo = data as {
    nome?: string;
    respostas?: Respostas;
    criado_em?: string;
  } | null;

  /*
    Token que nao abre nada tem dois motivos possiveis — nunca existiu, ou
    passou dos 60 dias — e a tela e a mesma para os dois de proposito. Dizer
    "esse link expirou" para um token inventado confirmaria ao curioso que o
    formato que ele tentou estava certo.
  */
  if (!salvo || !salvo.respostas) {
    return (
      <section className="grade pt-[var(--e7)] pb-[var(--e7)]">
        <div className="calha">
          <p className="nota">link sem resposta</p>
        </div>
        <div className="mancha">
          <h1 className="titulo-1 medida">Esse link não abre mais</h1>
          <p className="corpo-g medida mt-[var(--e4)]">
            Os links de briefing valem 60 dias. Passado esse prazo, ou se o endereço estiver
            incompleto, ele deixa de abrir.
          </p>
          <div className="mt-[var(--e5)] flex flex-wrap gap-[var(--e3)]">
            <Link href="/briefing" className="acao acao-forte">
              começar de novo
            </Link>
            <Link href="/contato" className="acao">
              falar comigo
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (editar === "1") {
    return (
      <section className="grade pt-[var(--e6)] pb-[var(--e7)]">
        <div className="calha">
          <p className="nota">editando</p>
        </div>
        <div className="mancha">
          <p className="corpo medida mb-[var(--e5)]">
            Mudar qualquer resposta refaz a conta — e atualiza este mesmo briefing, sem criar
            outro.{" "}
            <Link href={`/briefing/${token}`} className="enlace">
              voltar sem mudar
            </Link>
          </p>
          <BriefingMotor
            perguntas={perguntas}
            inicial={salvo.respostas}
            token={token}
            acao={reenviarBriefing}
          />
        </div>
      </section>
    );
  }

  // Recalculado, e nao lido de `faixa_estimada`: se voce ajustar um peso no
  // painel, o link que o cliente guardou passa a mostrar a conta nova. Guardar
  // o texto antigo faria o link e o painel discordarem sem ninguem perceber.
  const resultado = await calcular(salvo.respostas);

  return (
    <section className="grade pt-[var(--e6)] pb-[var(--e7)]">
      <div className="mancha">
        <ResumoDoBriefing
          resultado={resultado}
          respostas={salvo.respostas}
          perguntas={perguntas}
          nome={salvo.nome ?? null}
          criadoEm={salvo.criado_em ?? null}
        />

        <div className="briefing-acoes mt-[var(--e6)]">
          <Link href="/contato" className="acao acao-forte">
            falar comigo
          </Link>
          <Link href={`/briefing/${token}?editar=1`} className="acao">
            mudar minhas respostas
          </Link>
        </div>

        <p className="nota medida mt-[var(--e4)]">
          Este link é seu e vale 60 dias. Guardar ele é guardar esta página.
        </p>
      </div>
    </section>
  );
}
