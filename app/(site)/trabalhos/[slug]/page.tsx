import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buscarSecoesDe,
  buscarTextos,
  buscarTrabalho,
  buscarTrabalhos,
} from "@/lib/conteudo";
import { Secoes } from "@/components/secoes";
import { PaginaDoTrabalho } from "@/components/pagina-trabalho";

export async function generateStaticParams() {
  const trabalhos = await buscarTrabalhos();
  return trabalhos.map((trabalho) => ({ slug: trabalho.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trabalho = await buscarTrabalho(slug);
  if (!trabalho) return {};

  return { title: trabalho.titulo, description: trabalho.resumo };
}

export default async function Trabalho({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [trabalho, todos, textos] = await Promise.all([
    buscarTrabalho(slug),
    buscarTrabalhos(),
    buscarTextos(),
  ]);

  if (!trabalho) notFound();

  const indice = todos.findIndex((t) => t.slug === trabalho.slug);
  const proximo = indice >= 0 ? todos[(indice + 1) % todos.length] : undefined;

  const blocos = await buscarSecoesDe("project_id", trabalho.id);

  return (
    <PaginaDoTrabalho
      trabalho={trabalho}
      proximo={proximo}
      textos={textos}
      blocos={<Secoes secoes={blocos} servicos={[]} trabalhos={[]} textos={textos} />}
    />
  );
}
