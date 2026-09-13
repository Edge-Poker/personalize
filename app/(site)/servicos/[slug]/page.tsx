import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buscarAjustes,
  buscarSecoesDe,
  buscarServico,
  buscarServicos,
  buscarTextos,
} from "@/lib/conteudo";
import { Secoes } from "@/components/secoes";
import { linkWhatsapp } from "@/lib/whatsapp";
import { PaginaDoServico } from "@/components/pagina-servico";

export async function generateStaticParams() {
  const servicos = await buscarServicos();
  return servicos.map((servico) => ({ slug: servico.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const servico = await buscarServico(slug);
  if (!servico) return {};

  return { title: servico.titulo, description: servico.resumo };
}

export default async function Servico({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [servico, ajustes, textos] = await Promise.all([
    buscarServico(slug),
    buscarAjustes(),
    buscarTextos(),
  ]);

  if (!servico) notFound();

  const blocos = await buscarSecoesDe("service_id", servico.id);

  return (
    <PaginaDoServico
      servico={servico}
      textos={textos}
      blocos={<Secoes secoes={blocos} servicos={[]} trabalhos={[]} textos={textos} />}
      whatsapp={linkWhatsapp(
        ajustes.contato.whatsapp,
        `Oi! Vim pelo site e queria falar sobre ${servico.titulo}.`,
      )}
    />
  );
}
