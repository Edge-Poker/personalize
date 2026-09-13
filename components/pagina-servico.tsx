import Link from "next/link";
import type { Servico } from "@/lib/conteudo";
import { SemAdicionar, type ComponenteAdicionar } from "@/components/controles";
import { Rotulo } from "@/components/rotulo";
import { TextoSimples, type ComponenteTexto } from "@/components/texto";
import type { Textos } from "@/lib/textos";

/**
 * O corpo da pagina de um servico, separado da rota.
 *
 * Existe separado porque duas rotas desenham a mesma pagina: a publica, que
 * injeta `TextoSimples`, e a do editor, que injeta `Editavel`. Se o corpo
 * morasse dentro da rota publica, o editor precisaria de uma copia - e as
 * duas comecariam a divergir na primeira alteracao.
 */
export function PaginaDoServico({
  servico,
  whatsapp,
  textos,
  blocos,
  Texto = TextoSimples,
  Adicionar = SemAdicionar,
}: {
  servico: Servico;
  whatsapp: string | null;
  textos: Textos;
  /** Blocos livres deste serviço, desenhados antes da chamada final. */
  blocos: React.ReactNode;
  Texto?: ComponenteTexto;
  Adicionar?: ComponenteAdicionar;
}) {
  const id = servico.id;

  return (
    <>
      <section className="fx-up grade pt-[var(--e7)] pb-[var(--e5)]">
        <div className="calha">
          {/* Metadado empilhado, uma informacao por linha. */}
          <Texto tabela="services" registroId={id} caminho="preco_texto" className="nota" as="p">
            {servico.preco_texto ?? "sob consulta"}
          </Texto>
          {servico.prazo_texto ? (
            <Texto
              tabela="services"
              registroId={id}
              caminho="prazo_texto"
              className="nota mt-[var(--e1)] block"
              as="p"
            >
              {servico.prazo_texto}
            </Texto>
          ) : null}
        </div>
        <div className="mancha">
          <Texto
            tabela="services"
            registroId={id}
            caminho="titulo"
            className="titulo-1 medida"
            as="h1"
          >
            {servico.titulo}
          </Texto>
          <Texto
            tabela="services"
            registroId={id}
            caminho="resumo"
            className="corpo-g medida mt-[var(--e4)] block"
            as="p"
          >
            {servico.resumo}
          </Texto>
        </div>
      </section>

      {servico.descricao ? (
        <section className="fx-up grade pb-[var(--e6)]">
          <div className="calha">
            <Rotulo chave="servico_como_funciona" textos={textos} Texto={Texto} className="nota" as="p" />
          </div>
          <div className="mancha">
            <Texto
              tabela="services"
              registroId={id}
              caminho="descricao"
              className="corpo medida block"
              as="p"
            >
              {servico.descricao}
            </Texto>
          </div>
        </section>
      ) : null}

      {servico.para_quem ? (
        <section className="fx-up grade pb-[var(--e6)]">
          <div className="calha">
            <Rotulo chave="servico_para_quem" textos={textos} Texto={Texto} className="nota" as="p" />
          </div>
          <div className="mancha">
            <Texto
              tabela="services"
              registroId={id}
              caminho="para_quem"
              className="corpo medida block"
              as="p"
            >
              {servico.para_quem}
            </Texto>
          </div>
        </section>
      ) : null}

      <section className="fx-up grade pb-[var(--e6)]">
        <div className="calha">
          <Rotulo chave="servico_nota_listas" textos={textos} Texto={Texto} className="nota" as="p" />
        </div>
        <div className="fx-stagger mancha grid gap-[var(--e5)] sm:grid-cols-2">
          <Itens titulo={textos.servico_inclui} itens={servico.inclui} />
          <Itens titulo={textos.servico_nao_inclui} itens={servico.nao_inclui} />
        </div>
      </section>

      {blocos}
      <Adicionar dono={{ tipo: "servico", id: id }} ordem={9000} />

      <section className="fx-up grade pb-[var(--e6)]">
        <div className="calha" />
        <div className="mancha flex flex-wrap gap-[var(--e3)]">
          <Link href="/contato" className="acao acao-forte">
            {textos.servico_acao}
          </Link>
          {whatsapp ? (
            <a href={whatsapp} className="acao" target="_blank" rel="noopener noreferrer">
              {textos.servico_whatsapp}
            </a>
          ) : null}
        </div>
      </section>
    </>
  );
}

/**
 * As duas listas tem o mesmo peso visual de proposito.
 *
 * Nao sao editaveis clicando: sao colunas text[] no Postgres, e adicionar ou
 * remover item precisa de mais do que digitar por cima. Elas se editam no
 * painel, em /admin/servicos.
 */
function Itens({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null;

  return (
    <div className="cota">
      <h2 className="titulo-4">{titulo}</h2>
      <ul className="mt-[var(--e3)]">
        {itens.map((item) => (
          <li key={item} className="corpo py-[var(--e1)]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
