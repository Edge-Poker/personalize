import "server-only";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Porta de entrada de tudo que e administrativo.
 *
 * Devolve o cliente ja autenticado para quem chamou, entao a pagina nao cria
 * outro: as consultas seguintes saem com a sessao do admin e a RLS libera a
 * escrita. Quem nao passa daqui nao chega a ver a pagina.
 */
export async function exigirAdmin() {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?proximo=/admin");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/entrar?erro=sem_permissao");

  return { supabase, user };
}

/**
 * Versao que nao redireciona, para quando a resposta e "esconde o botao" e nao
 * "manda embora".
 */
export async function souAdmin(): Promise<boolean> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data !== null;
}

export const COOKIE_EDICAO = "personalize:edicao";

/**
 * Falha de gravação tem de aparecer na tela.
 *
 * As ações do painel usavam `action={fn}` e ignoravam o retorno do supabase.
 * Quando o banco recusava — ou quando a validação voltava cedo —, a página
 * recarregava com os valores antigos e nada era dito. O sintoma era exatamente
 * o que parecia um bug de RLS: você desmarcava "visível", salvava, e continuava
 * visível.
 *
 * Lançar não é elegante, mas é honesto: app/admin/error.tsx transforma isso
 * numa mensagem legível. Silêncio, não.
 */
export function exigirSucesso(
  resultado: { error: { message: string } | null },
  oQue: string,
): void {
  if (resultado.error) {
    throw new Error(`Não consegui ${oQue}: ${resultado.error.message}`);
  }
}
