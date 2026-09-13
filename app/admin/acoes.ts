"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_EDICAO, exigirAdmin } from "@/lib/admin";
import { descartarRascunho, publicarRascunho, type TabelaComRascunho } from "@/lib/rascunhos";

/**
 * Liga e desliga o modo de edicao.
 *
 * O modo mora num cookie porque quem le esse cookie e o middleware, que
 * precisa decidir antes de a pagina existir se a URL publica vai para a
 * versao estatica ou para a espelho editavel.
 *
 * httpOnly de proposito: nenhum script de pagina precisa ler isso, e o cookie
 * so vale acompanhado de sessao valida.
 */
export async function alternarEdicao(ligado: boolean) {
  await exigirAdmin();
  const jar = await cookies();

  if (ligado) {
    jar.set(COOKIE_EDICAO, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  } else {
    jar.delete(COOKIE_EDICAO);
  }

  revalidatePath("/", "layout");

  // Ligar o modo e continuar no painel não serve para nada: o lugar de editar
  // é o site. Desligar mantém você onde está, para ver o resultado publicado.
  if (ligado) redirect("/");
}

/** Publica o rascunho de um registro e derruba o cache das paginas publicas. */
export async function publicar(tabela: TabelaComRascunho, registroId: string) {
  const { supabase } = await exigirAdmin();
  await publicarRascunho(supabase, tabela, registroId);

  // As paginas publicas sao estaticas com revalidacao de uma hora. Sem isto,
  // publicar nao apareceria na hora e pareceria que nao funcionou.
  revalidatePath("/", "layout");
}

export async function descartar(tabela: TabelaComRascunho, registroId: string) {
  const { supabase } = await exigirAdmin();
  await descartarRascunho(supabase, tabela, registroId);
  revalidatePath("/", "layout");
}
