import type { ComponentType } from "react";
import type { TabelaComRascunho } from "@/lib/rascunhos";

/**
 * O truque que faz a edicao no lugar existir sem vazar o editor para o site
 * publico.
 *
 * Todo texto editavel do site e renderizado atraves de um componente injetado.
 * A rota publica injeta `TextoSimples`, que so imprime o texto. A rota do
 * editor injeta `Editavel`, que e client component e traz contentEditable,
 * contexto e barra flutuante.
 *
 * Como quem monta a pagina (`Secoes`, `PaginaDoServico`) nao importa nenhum
 * dos dois - recebe por prop -, o grafo de modulos da rota publica nunca
 * encosta no editor. Nao e o CSS escondendo o botao: o codigo nao esta la.
 */
export type PropsTexto = {
  tabela: TabelaComRascunho;
  registroId: string;
  /** Campo do registro. Aceita caminho com ponto para entrar no jsonb: "voz.calmo". */
  caminho: string;
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "h1" | "h2" | "h3" | "div" | "li";
};

export type ComponenteTexto = ComponentType<PropsTexto>;

export function TextoSimples({ children, className, as: Tag = "span" }: PropsTexto) {
  return <Tag className={className}>{children}</Tag>;
}
