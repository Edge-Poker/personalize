import type { Servico, Trabalho } from "@/lib/conteudo";
import type { ChaveDeTexto, Textos } from "@/lib/textos";
import { ListaDeServicos, ListaDeTrabalhos } from "@/components/listas";
import { Rotulo } from "@/components/rotulo";
import { TextoSimples, type ComponenteTexto } from "@/components/texto";

/**
 * As duas listagens — /servicos e /trabalhos.
 *
 * Vieram para cá pelo mesmo motivo das outras: a rota pública e a do editor
 * desenham a mesma página, e ter duas cópias garantiria que elas divergissem.
 *
 * Antes desta mudança, o texto de abertura destas páginas era literal dentro
 * da rota — bonito, escrito com cuidado, e impossível de editar sem abrir o
 * código.
 */
function Abertura({
  nota,
  titulo,
  intro,
  textos,
  Texto,
}: {
  nota: ChaveDeTexto;
  titulo: ChaveDeTexto;
  intro: ChaveDeTexto;
  textos: Textos;
  Texto: ComponenteTexto;
}) {
  return (
    <section className="fx-up grade pt-[var(--e7)] pb-[var(--e4)]">
      <div className="calha">
        <Rotulo chave={nota} textos={textos} Texto={Texto} className="nota" as="p" />
      </div>
      <div className="mancha">
        <Rotulo chave={titulo} textos={textos} Texto={Texto} className="titulo-1 medida" as="h1" />
        <Rotulo
          chave={intro}
          textos={textos}
          Texto={Texto}
          className="corpo-g medida mt-[var(--e4)] block"
          as="p"
        />
      </div>
    </section>
  );
}

export function PaginaDeServicos({
  servicos,
  textos,
  Texto = TextoSimples,
}: {
  servicos: Servico[];
  textos: Textos;
  Texto?: ComponenteTexto;
}) {
  return (
    <>
      <Abertura
        nota="servicos_nota"
        titulo="servicos_titulo"
        intro="servicos_intro"
        textos={textos}
        Texto={Texto}
      />
      <section className="fx-up grade pb-[var(--e6)]">
        <div className="calha" />
        <div className="mancha">
          <ListaDeServicos servicos={servicos} textos={textos} />
        </div>
      </section>
    </>
  );
}

export function PaginaDeTrabalhos({
  trabalhos,
  textos,
  Texto = TextoSimples,
}: {
  trabalhos: Trabalho[];
  textos: Textos;
  Texto?: ComponenteTexto;
}) {
  return (
    <>
      <Abertura
        nota="trabalhos_nota"
        titulo="trabalhos_titulo"
        intro="trabalhos_intro"
        textos={textos}
        Texto={Texto}
      />
      <section className="fx-up grade pb-[var(--e6)]">
        <div className="calha" />
        <ListaDeTrabalhos trabalhos={trabalhos} textos={textos} />
      </section>
    </>
  );
}
