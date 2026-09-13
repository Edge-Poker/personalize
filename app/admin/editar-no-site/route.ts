import { NextResponse } from "next/server";
import { COOKIE_EDICAO, souAdmin } from "@/lib/admin";
import { env } from "@/lib/env";

/**
 * Liga o modo de edição e manda para a home.
 *
 * É rota e não server action porque o botão do painel abre em aba nova, e
 * `target="_blank"` num formulário de server action não se comporta: o Next
 * responde a ação com um payload de navegação que a aba nova não sabe ler.
 * Um link comum para uma rota GET resolve.
 *
 * O cookie é preferência de sessão, não dado — e a rota exige admin, então o
 * pior que um GET forjado consegue é ligar o modo de edição para alguém que já
 * é admin e já podia ligar.
 */
export async function GET() {
  if (!(await souAdmin())) {
    return NextResponse.redirect(new URL("/entrar", env.NEXT_PUBLIC_SITE_URL));
  }

  const resposta = NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_SITE_URL));

  resposta.cookies.set(COOKIE_EDICAO, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return resposta;
}
