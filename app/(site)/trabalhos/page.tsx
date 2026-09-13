import type { Metadata } from "next";
import { buscarTextos, buscarTrabalhos } from "@/lib/conteudo";
import { PaginaDeTrabalhos } from "@/components/pagina-listagem";

export const metadata: Metadata = {
  title: "Trabalhos",
  description:
    "Três projetos contados por inteiro: o que o cliente pediu, qual era o problema real, o que foi decidido e o que mudou.",
};

export default async function Trabalhos() {
  const [trabalhos, textos] = await Promise.all([buscarTrabalhos(), buscarTextos()]);
  return <PaginaDeTrabalhos trabalhos={trabalhos} textos={textos} />;
}
