import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buscarPagina, buscarServicos,
  buscarTextos, buscarTrabalhos } from "@/lib/conteudo";
import { Secoes } from "@/components/secoes";

export async function generateMetadata(): Promise<Metadata> {
  const pagina = await buscarPagina("home");
  if (!pagina) return {};

  return {
    // absolute para a home nao virar "persona.lize | persona.lize"
    title: { absolute: pagina.seo.titulo ?? pagina.titulo },
    description: pagina.seo.descricao,
  };
}

export default async function Home() {
  const [pagina, servicos, trabalhos, textos] = await Promise.all([
    buscarPagina("home"),
    buscarServicos(),
    buscarTrabalhos(),
    buscarTextos(),
  ]);

  // Sem a pagina `home` no banco nao ha o que desenhar. Acontece se as
  // migrations foram aplicadas sem a semente, ou se a home foi despublicada.
  if (!pagina) notFound();


  return (
    <Secoes secoes={pagina.secoes} servicos={servicos} trabalhos={trabalhos} textos={textos} />
  );
}
