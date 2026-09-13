import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { buscarAjustes } from "@/lib/conteudo";
import {
  comRascunhoPendente,
  paginaParaEditar,
  secoesParaEditar,
  servicosParaEditar,
  textosParaEditar,
  trabalhosParaEditar,
} from "@/lib/conteudo-editor";
import type { TabelaComRascunho } from "@/lib/rascunhos";
import { linkWhatsapp } from "@/lib/whatsapp";
import { Editavel } from "@/components/editor/editavel";
import { AdicionarBloco, ControlesSecao } from "@/components/editor/controles-secao";
import { ImagemEditavel } from "@/components/editor/imagem-editavel";
import { ProvedorEdicao } from "@/components/editor/provedor";
import { PaginaDeServicos, PaginaDeTrabalhos } from "@/components/pagina-listagem";
import { PaginaDoServico } from "@/components/pagina-servico";
import { PaginaDoTrabalho } from "@/components/pagina-trabalho";
import { Secoes } from "@/components/secoes";

/**
 * Espelho editável do site inteiro numa rota só.
 *
 * O middleware reescreve /sobre para /editar/sobre quando há sessão e o modo
 * de edição está ligado, então este arquivo precisa reconhecer as mesmas
 * formas de URL que o site público tem.
 *
 * O ProvedorEdicao mora aqui e não no layout porque ele precisa saber quais
 * registros esta página desenha. Sem isso, o botão de publicar só apareceria
 * para rascunho salvo na mesma visita — quem salvasse hoje e voltasse amanhã
 * não teria como publicar sem descobrir sozinho que a resposta estava no
 * /admin.
 */
export default async function Editor({
  params,
}: {
  params: Promise<{ caminho?: string[] }>;
}) {
  const { supabase } = await exigirAdmin();
  const { caminho = [] } = await params;
  const [primeiro, segundo] = caminho;

  // /servicos/[slug]
  if (primeiro === "servicos" && segundo) {
    const [servicos, ajustes, textos] = await Promise.all([
      servicosParaEditar(supabase),
      buscarAjustes(),
      textosParaEditar(supabase),
    ]);
    const servico = servicos.find((s) => s.slug === segundo);
    if (!servico) notFound();

    const blocos = await secoesParaEditar(supabase, "service_id", servico.id);
    const pendentes = await comRascunhoPendente(supabase, "services", [
      servico.id,
      ...blocos.map((b) => b.id),
    ]);

    return (
      <ProvedorEdicao jaSalvos={paraAlvos("services", pendentes)}>
        <PaginaDoServico
          servico={servico}
          whatsapp={linkWhatsapp(
            ajustes.contato.whatsapp,
            `Oi! Vim pelo site e queria falar sobre ${servico.titulo}.`,
          )}
          textos={textos}
          blocos={
            <Secoes
              secoes={blocos}
              servicos={[]}
              trabalhos={[]}
              textos={textos}
              dono={{ tipo: "servico", id: servico.id }}
              editando
              Texto={Editavel}
              Imagem={ImagemEditavel}
              Controles={ControlesSecao}
            />
          }
          Texto={Editavel}
          Adicionar={AdicionarBloco}
        />
      </ProvedorEdicao>
    );
  }

  // /trabalhos/[slug]
  if (primeiro === "trabalhos" && segundo) {
    const [trabalhos, textos] = await Promise.all([
      trabalhosParaEditar(supabase),
      textosParaEditar(supabase),
    ]);
    const indice = trabalhos.findIndex((t) => t.slug === segundo);
    if (indice < 0) notFound();

    const trabalho = trabalhos[indice]!;
    const blocos = await secoesParaEditar(supabase, "project_id", trabalho.id);
    const pendentes = await comRascunhoPendente(supabase, "projects", [trabalho.id]);

    return (
      <ProvedorEdicao jaSalvos={paraAlvos("projects", pendentes)}>
        <PaginaDoTrabalho
          trabalho={trabalho}
          proximo={trabalhos[(indice + 1) % trabalhos.length]}
          textos={textos}
          editando
          blocos={
            <Secoes
              secoes={blocos}
              servicos={[]}
              trabalhos={[]}
              textos={textos}
              dono={{ tipo: "trabalho", id: trabalho.id }}
              editando
              Texto={Editavel}
              Imagem={ImagemEditavel}
              Controles={ControlesSecao}
            />
          }
          Texto={Editavel}
          Imagem={ImagemEditavel}
          Adicionar={AdicionarBloco}
        />
      </ProvedorEdicao>
    );
  }

  /*
    /servicos e /trabalhos sem slug.

    Antes isto mostrava um aviso genérico dizendo que a listagem não tinha
    texto próprio. Tinha: o título e o parágrafo de abertura eram literais
    dentro da rota, escritos com cuidado e impossíveis de editar sem abrir o
    código. Agora vivem em site_settings e a listagem de verdade é desenhada
    aqui, editável como o resto.
  */
  if (primeiro === "servicos" || primeiro === "trabalhos") {
    const textos = await textosParaEditar(supabase);
    const pendentes = await comRascunhoPendente(supabase, "site_settings", ["textos"]);
    const jaSalvos = paraAlvos("site_settings", pendentes);

    if (primeiro === "servicos") {
      const servicos = await servicosParaEditar(supabase);
      return (
        <ProvedorEdicao jaSalvos={jaSalvos}>
          <PaginaDeServicos servicos={servicos} textos={textos} Texto={Editavel} />
        </ProvedorEdicao>
      );
    }

    const trabalhos = await trabalhosParaEditar(supabase);
    return (
      <ProvedorEdicao jaSalvos={jaSalvos}>
        <PaginaDeTrabalhos trabalhos={trabalhos} textos={textos} Texto={Editavel} />
      </ProvedorEdicao>
    );
  }

  // O resto é página montada de seções: a home quando o caminho é vazio, e
  // qualquer página do banco quando há um segmento só.
  const slug = caminho.length === 0 ? "home" : primeiro;
  if (!slug || caminho.length > 1) notFound();

  const [pagina, servicos, trabalhos, textos] = await Promise.all([
    paginaParaEditar(supabase, slug),
    servicosParaEditar(supabase),
    trabalhosParaEditar(supabase),
    textosParaEditar(supabase),
  ]);

  if (!pagina) notFound();

  const pendentes = await comRascunhoPendente(
    supabase,
    "sections",
    pagina.secoes.map((secao) => secao.id),
  );

  return (
    <ProvedorEdicao jaSalvos={paraAlvos("sections", pendentes)}>
      <Secoes
        secoes={pagina.secoes}
        servicos={servicos}
        trabalhos={trabalhos}
        textos={textos}
        dono={{ tipo: "pagina", id: pagina.id }}
        editando
        Texto={Editavel}
        Imagem={ImagemEditavel}
        Controles={ControlesSecao}
      />
    </ProvedorEdicao>
  );
}

function paraAlvos(tabela: TabelaComRascunho, ids: string[]) {
  return ids.map((registroId) => ({ tabela, registroId }));
}
