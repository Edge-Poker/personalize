import { cookies } from "next/headers";
import { COOKIE_EDICAO } from "@/lib/admin";
import { alternarEdicao } from "./acoes";

/**
 * Com o modo ligado, as URLs públicas passam a mostrar a versão editável para
 * quem tem sessão. Para todo mundo, elas continuam sendo a página estática de
 * sempre — quem não está logado não recebe nem o botão nem o código do editor.
 *
 * Ligar abre aba nova de propósito: a aba do painel continua sendo o painel.
 * Transformar a aba onde você estava trabalhando na aba de edição obrigava a
 * navegar de volta toda vez que precisasse de leads, mídia ou ajustes.
 */
export async function AlternarEdicao() {
  const ligado = (await cookies()).get(COOKIE_EDICAO)?.value === "1";

  if (!ligado) {
    return (
      <a
        href="/admin/editar-no-site"
        target="_blank"
        rel="noopener noreferrer"
        className="acao acao-forte"
      >
        editar pelo site
      </a>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await alternarEdicao(false);
      }}
    >
      <button type="submit" className="acao">
        sair do modo de edição
      </button>
    </form>
  );
}
