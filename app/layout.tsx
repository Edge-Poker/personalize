import type { Metadata } from "next";
import { buscarAjustes } from "@/lib/conteudo";
import { fonteDisplay, fonteTexto } from "./fontes";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { marca, seo } = await buscarAjustes();

  return {
    title: { default: seo.titulo_padrao || marca.nome, template: seo.template_titulo },
    description: seo.descricao_padrao,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
      O <html> e a primeira coisa que qualquer coisa instalada no navegador
      encontra, e varias escrevem nele antes de a hidratacao comecar: extensoes,
      pontes de inspecao remota, tradutores. O React entao compara o html que
      veio do servidor com o DOM ja mexido, acha um atributo a mais e reclama de
      um erro que nao e nosso — nao ha como o servidor prever o que esta
      instalado na maquina de quem visita.

      suppressHydrationWarning cala essa comparacao, e so ela: vale para os
      atributos deste elemento e para nada abaixo dele. Diferenca de verdade,
      dentro da pagina, continua sendo apontada como antes.
    */
    <html
      lang="pt-BR"
      className={`${fonteDisplay.variable} ${fonteTexto.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
