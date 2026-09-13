import { z } from "zod";
import type { Secao, Servico, Trabalho } from "@/lib/conteudo";
import { LinkInterno } from "@/components/link-interno";
import { ListaDeServicos, ListaDeTrabalhos } from "@/components/listas";
import {
  SemControles,
  type ComponenteControles,
  type DonoDeSecoes,
} from "@/components/controles";
import { ImagemSimples, type ComponenteImagem } from "@/components/imagem";
import { Capa } from "@/components/capa";
import { TextoSimples, type ComponenteTexto } from "@/components/texto";
import type { Textos } from "@/lib/textos";

/**
 * As secoes vem de jsonb, e jsonb editavel pelo painel pode chegar torto -
 * campo renomeado, chave faltando, tipo trocado. Cada tipo tem um esquema, e
 * secao que nao passa e simplesmente pulada.
 *
 * A alternativa seria confiar no formato e quebrar a home inteira por causa de
 * um campo digitado errado num formulario.
 *
 * `Texto` e o componente injetado que decide se cada texto e so texto ou e
 * campo editavel. Ver components/texto.tsx.
 */

const esquemaAcao = z.object({
  rotulo: z.string().min(1),
  href: z.string().min(1),
  forte: z.boolean().optional(),
});

/*
  O herói agora é a capa: vídeo, frase que se digita e pílulas.

  Os campos antigos (voz, seletor_antes, seletor_depois) continuam nas linhas do
  banco e são simplesmente ignorados — zod não reclama de chave a mais. Preferi
  isso a uma migration que apaga texto: se a capa não vingar, o conteúdo ainda
  está lá.
*/
const esquemaHeroi = z.object({
  /** As duas linhas desfocadas. Quebra de linha separa. */
  nota: z.string().optional(),
  /** A frase que se digita. É o h1 da home. */
  titulo: z.string().min(1),
  acoes: z.array(esquemaAcao).optional(),
  /** O par de botoes grandes no pe da capa. */
  botoes: z.array(esquemaAcao).optional(),
  email: z.string().optional(),
  video: z.string().optional(),
});

const ROTULO_PADRAO = "Oi. Aqui é o estúdio inteiro:\numa pessoa, um site por vez.";

/* Padrão no código para os botões existirem antes de alguém cadastrá-los. */
const BOTOES_PADRAO = [
  { rotulo: "começar um briefing", href: "/briefing" },
  { rotulo: "falar comigo", href: "/contato" },
];

const esquemaComNota = z.object({
  nota: z.string().optional(),
  titulo: z.string().optional(),
});

/** Abertura de pagina interna. E o h1 dela - por isso titulo e obrigatorio. */
const esquemaIntro = z.object({
  nota: z.string().optional(),
  titulo: z.string().min(1),
  texto: z.string().optional(),
});

const esquemaConvite = z.object({
  nota: z.string().optional(),
  titulo: z.string().min(1),
  texto: z.string().min(1),
  acao: esquemaAcao.optional(),
});

/** Bloco de imagem solto entre blocos de texto. */
const esquemaImagem = z.object({
  path: z.string().optional(),
  alt: z.string().optional(),
  legenda: z.string().optional(),
});

const esquemaTexto = z.object({
  nota: z.string().optional(),
  titulo: z.string().optional(),
  paragrafos: z.array(z.string()).min(1),
});

function Acoes({ acoes }: { acoes: z.infer<typeof esquemaAcao>[] }) {
  if (acoes.length === 0) return null;
  return (
    <div className="mt-[var(--e5)] flex flex-wrap gap-[var(--e3)]">
      {acoes.map((acao) => (
        <LinkInterno
          key={acao.href + acao.rotulo}
          href={acao.href}
          className={acao.forte ? "acao acao-forte" : "acao"}
        >
          {acao.rotulo}
        </LinkInterno>
      ))}
    </div>
  );
}

export function Secoes({
  secoes,
  servicos,
  trabalhos,
  textos,
  dono = { tipo: "pagina", id: "" },
  editando = false,
  Texto = TextoSimples,
  Imagem = ImagemSimples,
  Controles = SemControles,
}: {
  secoes: Secao[];
  servicos: Servico[];
  trabalhos: Trabalho[];
  textos: Textos;
  /** Só o editor precisa disto, para saber onde inserir bloco novo. */
  dono?: DonoDeSecoes;
  /** No editor a capa mostra a frase inteira em vez de digitá-la. */
  editando?: boolean;
  Texto?: ComponenteTexto;
  Imagem?: ComponenteImagem;
  Controles?: ComponenteControles;
}) {
  const Calha = ({ nota, id }: { nota?: string; id: string }) => (
    <div className="calha">
      {nota ? (
        <Texto tabela="sections" registroId={id} caminho="nota" className="nota" as="p">
          {nota}
        </Texto>
      ) : null}
    </div>
  );

  function desenhar(secao: Secao) {
    switch (secao.tipo) {
          case "heroi": {
            const analise = esquemaHeroi.safeParse(secao.dados);
            if (!analise.success) return null;
            const { nota, titulo, acoes, botoes, email, video } = analise.data;
            return (
              <Capa
                rotulo={nota ?? ROTULO_PADRAO}
                frase={titulo}
                pilulas={(acoes ?? []).map((acao) => ({ rotulo: acao.rotulo, href: acao.href }))}
                botoes={(botoes ?? BOTOES_PADRAO).map((b) => ({ rotulo: b.rotulo, href: b.href }))}
                email={email}
                video={video}
                registroId={secao.id}
                editando={editando}
                Texto={Texto}
              />
            );
          }

          case "intro": {
            const analise = esquemaIntro.safeParse(secao.dados);
            if (!analise.success) return null;
            const { nota, titulo, texto } = analise.data;
            return (
              <section className="grade pt-[var(--e7)] pb-[var(--e5)]">
                <Calha nota={nota} id={secao.id} />
                <div className="mancha">
                  <Texto
                    tabela="sections"
                    registroId={secao.id}
                    caminho="titulo"
                    className="titulo-1 medida"
                    as="h1"
                  >
                    {titulo}
                  </Texto>
                  {texto ? (
                    <Texto
                      tabela="sections"
                      registroId={secao.id}
                      caminho="texto"
                      className="corpo-g medida mt-[var(--e4)] block"
                      as="p"
                    >
                      {texto}
                    </Texto>
                  ) : null}
                </div>
              </section>
            );
          }

          case "servicos": {
            const analise = esquemaComNota.safeParse(secao.dados);
            if (!analise.success) return null;
            return (
              <section className="grade py-[var(--e6)]">
                <Calha nota={analise.data.nota} id={secao.id} />
                <div className="mancha">
                  <ListaDeServicos servicos={servicos} textos={textos} />
                </div>
              </section>
            );
          }

          case "trabalhos": {
            const analise = esquemaComNota.safeParse(secao.dados);
            if (!analise.success) return null;
            return (
              <section className="grade py-[var(--e6)]">
                <Calha nota={analise.data.nota} id={secao.id} />
                <ListaDeTrabalhos trabalhos={trabalhos} textos={textos} />
              </section>
            );
          }

          case "convite": {
            const analise = esquemaConvite.safeParse(secao.dados);
            if (!analise.success) return null;
            const { nota, titulo, texto, acao } = analise.data;
            return (
              <section className="grade py-[var(--e6)]">
                <Calha nota={nota} id={secao.id} />
                <div className="mancha">
                  <Texto
                    tabela="sections"
                    registroId={secao.id}
                    caminho="titulo"
                    className="titulo-2 medida"
                    as="h2"
                  >
                    {titulo}
                  </Texto>
                  <Texto
                    tabela="sections"
                    registroId={secao.id}
                    caminho="texto"
                    className="corpo-g medida mt-[var(--e3)] block"
                    as="p"
                  >
                    {texto}
                  </Texto>
                  <Acoes acoes={acao ? [acao] : []} />
                </div>
              </section>
            );
          }

          case "texto": {
            const analise = esquemaTexto.safeParse(secao.dados);
            if (!analise.success) return null;
            const { nota, titulo, paragrafos } = analise.data;
            return (
              <section className="grade py-[var(--e6)]">
                <Calha nota={nota} id={secao.id} />
                <div className="mancha">
                  {titulo ? (
                    <Texto
                      tabela="sections"
                      registroId={secao.id}
                      caminho="titulo"
                      className="titulo-2 medida"
                      as="h2"
                    >
                      {titulo}
                    </Texto>
                  ) : null}
                  {paragrafos.map((paragrafo, i) => (
                    <Texto
                      key={i}
                      tabela="sections"
                      registroId={secao.id}
                      caminho={`paragrafos.${i}`}
                      className="corpo medida mt-[var(--e3)] block"
                      as="p"
                    >
                      {paragrafo}
                    </Texto>
                  ))}
                </div>
              </section>
            );
          }

      case "imagem": {
        const analise = esquemaImagem.safeParse(secao.dados);
        if (!analise.success) return null;
        const { path, alt, legenda } = analise.data;
        return (
          <section className="grade py-[var(--e6)]">
            <div className="calha">
              <Texto
                tabela="sections"
                registroId={secao.id}
                caminho="legenda"
                className="nota"
                as="p"
              >
                {legenda ?? "legenda da imagem"}
              </Texto>
            </div>
            <div className="mancha-larga grupo-imagem">
              <span className="moldura">
                <Imagem
                  tabela="sections"
                  registroId={secao.id}
                  caminho="path"
                  caminhoAlt="alt"
                  path={path ? path : null}
                  alt={alt ?? ""}
                  reserva={secao.id}
                  className="w-full"
                />
              </span>
            </div>
          </section>
        );
      }

      default:
        // Tipo de seção que este build não conhece. Pular é melhor do que
        // quebrar: dá para cadastrar uma seção nova no painel antes do código
        // que a desenha existir.
        return null;
    }
  }

  return (
    <>
      {secoes.map((secao, indice) => {
        const conteudo = desenhar(secao);
        if (!conteudo) return null;
        // A capa já se apresenta sozinha ao carregar; revelá-la de novo ao
        // rolar seria animar a mesma coisa duas vezes.
        const revela = secao.tipo === "heroi" ? "" : "fx-up";

        return (
          <div key={secao.id} className={revela}>
            <Controles
              secaoId={secao.id}
              dono={dono}
              tipo={secao.tipo}
              ordem={secao.ordem}
              primeiro={indice === 0}
              ultimo={indice === secoes.length - 1}
            />
            {conteudo}
          </div>
        );
      })}
    </>
  );
}
