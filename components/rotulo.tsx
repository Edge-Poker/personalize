import type { ChaveDeTexto, Textos } from "@/lib/textos";
import { TextoSimples, type ComponenteTexto } from "@/components/texto";

/**
 * Um texto de interface, editável como qualquer outro.
 *
 * Aponta sempre para a mesma linha (`site_settings` chave `textos`) e usa a
 * chave como campo. Do lado do servidor isso vira rascunho no jsonb `valor`,
 * pelo mesmo caminho de todo o resto — nenhuma rota nova, nenhuma tabela nova.
 */
export function Rotulo({
  chave,
  textos,
  Texto = TextoSimples,
  className,
  as = "span",
}: {
  chave: ChaveDeTexto;
  textos: Textos;
  Texto?: ComponenteTexto;
  className?: string;
  as?: "p" | "span" | "h1" | "h2" | "h3" | "div" | "li";
}) {
  return (
    <Texto
      tabela="site_settings"
      registroId="textos"
      caminho={chave}
      className={className}
      as={as}
    >
      {textos[chave]}
    </Texto>
  );
}
