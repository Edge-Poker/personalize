import type { Metadata } from "next";
import { buscarServicos, buscarTextos } from "@/lib/conteudo";
import { PaginaDeServicos } from "@/components/pagina-listagem";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Quatro jeitos de começar: portfólio profissional, site de vendas, landing page de campanha ou projeto sob medida.",
};

export default async function Servicos() {
  const [servicos, textos] = await Promise.all([buscarServicos(), buscarTextos()]);
  return <PaginaDeServicos servicos={servicos} textos={textos} />;
}
