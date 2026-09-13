import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buscarPagina,
  buscarServicos,
  buscarTextos,
  buscarTrabalhos,
  listarSlugsDePaginas,
} from "@/lib/conteudo";
import { Secoes } from "@/components/secoes";

/**
 * Renderiza qualquer pagina cadastrada no banco.
 *
 * E o que atende ao "criar paginas novas sem codigo": voce cria a pagina e as
 * secoes no painel, e a rota passa a existir. `/sobre` vem por aqui.
 *
 * Rotas escritas a mao - /servicos, /trabalhos, /contato - tem precedencia
 * sobre este segmento dinamico, entao nao ha risco de uma pagina cadastrada
 * com slug `contato` sequestrar o formulario.
 */

export async function generateStaticParams() {
  const slugs = await listarSlugsDePaginas();
  // A home tem rota propria; se ela entrasse aqui, seriam duas rotas para o
  // mesmo conteudo e o Google escolheria uma delas sozinho.
  return slugs.filter((slug) => slug !== "home").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await buscarPagina(slug);
  if (!pagina) return {};

  return {
    title: pagina.seo.titulo ?? pagina.titulo,
    description: pagina.seo.descricao,
  };
}

export default async function PaginaDoBanco({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === "home") notFound();

  const [pagina, servicos, trabalhos, textos] = await Promise.all([
    buscarPagina(slug),
    buscarServicos(),
    buscarTrabalhos(),
    buscarTextos(),
  ]);

  if (!pagina) notFound();

  return (
    <Secoes secoes={pagina.secoes} servicos={servicos} trabalhos={trabalhos} textos={textos} />
  );
}
