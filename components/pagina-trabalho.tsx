import Link from "next/link";
import type { Trabalho } from "@/lib/conteudo";
import { SemAdicionar, type ComponenteAdicionar } from "@/components/controles";
import { ImagemSimples, type ComponenteImagem } from "@/components/imagem";
import { Rotulo } from "@/components/rotulo";
import { TextoSimples, type ComponenteTexto } from "@/components/texto";
import type { ChaveDeTexto, Textos } from "@/lib/textos";

/** Mesma razao de PaginaDoServico: uma implementacao, duas rotas. */
export function PaginaDoTrabalho({
  trabalho,
  proximo,
  textos,
  blocos,
  editando = false,
  Texto = TextoSimples,
  Imagem = ImagemSimples,
  Adicionar = SemAdicionar,
}: {
  trabalho: Trabalho;
  textos: Textos;
  /** Blocos livres deste case, desenhados depois do relato. */
  blocos: React.ReactNode;
  /**
   * No modo de edição os espaços vazios aparecem para poderem ser preenchidos.
   * No site público eles continuam invisíveis: o briefing pede que o lugar da
   * citação fique vazio até existir frase real, e não que fique com um texto
   * de exemplo no ar.
   */
  editando?: boolean;
  proximo?: Pick<Trabalho, "slug" | "titulo"> | undefined;
  Texto?: ComponenteTexto;
  Imagem?: ComponenteImagem;
  Adicionar?: ComponenteAdicionar;
}) {
  const id = trabalho.id;

  const todosOsCapitulos: { chave: ChaveDeTexto; campo: string; texto: string }[] = [
    { chave: "case_pedido", campo: "pedido", texto: trabalho.pedido },
    { chave: "case_problema", campo: "problema", texto: trabalho.problema },
    { chave: "case_decisao", campo: "decisao", texto: trabalho.decisao },
    { chave: "case_mudou", campo: "mudou", texto: trabalho.mudou },
    { chave: "case_resultado", campo: "resultado", texto: trabalho.resultado },
  ];
  const capitulos = todosOsCapitulos.filter((capitulo) => capitulo.texto);

  return (
    <article>
      <section className="fx-up grade pt-[var(--e7)] pb-[var(--e5)]">
        <div className="calha">
          {/* Uma informação por linha. Nada de "papel · ano". */}
          <Texto tabela="projects" registroId={id} caminho="papel" className="nota" as="p">
            {trabalho.papel}
          </Texto>
          {trabalho.ano || editando ? (
            <Texto
              tabela="projects"
              registroId={id}
              caminho="ano"
              className="nota numero mt-[var(--e1)] block"
              as="p"
            >
              {trabalho.ano ?? "ano"}
            </Texto>
          ) : null}
        </div>
        <div className="mancha relative">
          {/* Único bloco de sobreimpressão desta página. */}
          <div
            className="bloco pointer-events-none absolute"
            aria-hidden="true"
            style={{ left: "-3%", width: "42%", top: "30%", height: "0.36em", zIndex: 1 }}
          />
          <Texto
            tabela="projects"
            registroId={id}
            caminho="titulo"
            className="titulo-1 medida relative"
            as="h1"
          >
            {trabalho.titulo}
          </Texto>
          <Texto
            tabela="projects"
            registroId={id}
            caminho="resumo"
            className="corpo-g medida mt-[var(--e4)] block"
            as="p"
          >
            {trabalho.resumo}
          </Texto>
        </div>
      </section>

      <section className="fx-up grade pb-[var(--e6)]">
        <div className="calha" />
        <div className="mancha-larga grupo-imagem">
          <span className="moldura fx-shine">
            <Imagem
            tabela="projects"
              registroId={id}
              caminho="capa_path"
              caminhoAlt="capa_alt"
              path={trabalho.capa_path}
              alt={trabalho.capa_alt ?? trabalho.titulo}
              reserva={trabalho.slug}
              className="w-full"
            />
          </span>
        </div>
      </section>

      {capitulos.map((capitulo) => (
        <section key={capitulo.campo} className="fx-up grade pb-[var(--e6)]">
          <div className="calha">
            <Rotulo chave={capitulo.chave} textos={textos} Texto={Texto} className="nota" as="p" />
          </div>
          <div className="mancha">
            <Texto
              tabela="projects"
              registroId={id}
              caminho={capitulo.campo}
              className="corpo medida block"
              as="p"
            >
              {capitulo.texto}
            </Texto>
          </div>
        </section>
      ))}

      {/*
        Os blocos livres entram depois do relato. O relato tem ordem fixa —
        pedido, problema, decisão, o que mudou, resultado — porque é assim que
        a história se conta. O que vem depois é seu.
      */}
      {blocos}
      <Adicionar dono={{ tipo: "trabalho", id: id }} ordem={9000} />

      {/*
        O espaço da citação existe mesmo sem citação, e fica visivelmente
        vazio. Preencher com frase inventada seria mais fácil e seria mentira.
      */}
      {trabalho.citacao || editando ? (
        <section className="fx-pop grade pb-[var(--e6)]">
          <div className="calha">
            <Rotulo chave="case_citacao" textos={textos} Texto={Texto} className="nota" as="p" />
          </div>
          <blockquote className="mancha">
            <Texto
              tabela="projects"
              registroId={id}
              caminho="citacao"
              className="titulo-3 medida"
              as="p"
            >
              {trabalho.citacao ?? "a frase que o cliente disse"}
            </Texto>
            {trabalho.citacao_autor || editando ? (
              <footer className="corpo-p mt-[var(--e3)] text-[var(--tinta-fraca)]">
                <Texto tabela="projects" registroId={id} caminho="citacao_autor" as="span">
                  {trabalho.citacao_autor ?? "quem disse"}
                </Texto>
                {trabalho.citacao_cargo || editando ? (
                  <Texto
                    tabela="projects"
                    registroId={id}
                    caminho="citacao_cargo"
                    className="block"
                    as="span"
                  >
                    {trabalho.citacao_cargo ?? "cargo de quem disse"}
                  </Texto>
                ) : null}
              </footer>
            ) : null}
          </blockquote>
        </section>
      ) : null}

      {proximo && proximo.slug !== trabalho.slug ? (
        <section className="fx-slide-l grade border-t border-[var(--linha)] pt-[var(--e5)] pb-[var(--e6)]">
          <div className="calha">
            <Rotulo chave="case_proximo" textos={textos} Texto={Texto} className="nota" as="p" />
          </div>
          <div className="mancha">
            <Link href={`/trabalhos/${proximo.slug}`} className="linha-viva titulo-2 inline-block no-underline transition-colors duration-300 hover:text-[var(--acento)]">
              {proximo.titulo}
            </Link>
          </div>
        </section>
      ) : null}
    </article>
  );
}
