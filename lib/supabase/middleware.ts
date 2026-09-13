import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Renova a sessao a cada request e devolve a resposta com os cookies novos.
 * Sem isso o token expira e o usuario cai do painel no meio de uma edicao.
 */
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(paraGravar) {
          for (const { name, value } of paraGravar) {
            request.cookies.set(name, value);
          }
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of paraGravar) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser valida o token no servidor de auth. getSession so le o cookie,
  // e cookie da para forjar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { resposta, user };
}

/** Leva os cookies renovados para dentro de um redirect. */
export function repassarCookies(destino: NextResponse, origem: NextResponse) {
  for (const cookie of origem.cookies.getAll()) {
    destino.cookies.set(cookie);
  }
  return destino;
}
