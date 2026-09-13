import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_EDICAO } from "@/lib/admin";
import { atualizarSessao, repassarCookies } from "@/lib/supabase/middleware";

/** Rotas que nao sao conteudo do site e nunca viram versao editavel. */
const FORA_DO_SITE = [
  "/admin",
  "/entrar",
  "/editar",
  "/api",
  "/contato",
  "/briefing",
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  /*
    Visitante anonimo nao tem cookie de sessao, entao getUser() responde sem ir
    a rede e este caminho custa quase nada. E o que permite o middleware rodar
    no site publico inteiro sem pesar para quem so esta lendo.
  */
  const { resposta, user } = await atualizarSessao(request);

  // Primeira camada: /admin exige sessao. A segunda - estar na tabela admins -
  // fica no layout do /admin, e a terceira e a RLS. O middleware nao consulta
  // admins de proposito: roda em toda navegacao e uma ida ao banco por request
  // nao paga o que entrega, ja que quem passa daqui esbarra nas outras duas.
  if (pathname.startsWith("/admin") && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = "";
    destino.searchParams.set("proximo", pathname + search);
    return repassarCookies(NextResponse.redirect(destino), resposta);
  }

  /*
    Edicao no proprio site, sem entregar o editor para quem nao pediu.

    O requisito e que a pagina publica fique editavel ao clicar, e que quem nao
    esta logado nao veja "nem o botao, nem o bundle". As duas coisas juntas nao
    cabem numa pagina so: ou ela e estatica e igual para todos, ou ela varia
    por sessao e deixa de ser cacheavel.

    A saida e ter duas paginas para a mesma URL. /sobre continua estatica e
    sem uma linha de codigo de editor. Quem tem sessao e ligou o modo de edicao
    e reescrito para /editar/sobre, que renderiza os mesmos componentes com a
    camada de edicao em volta. A URL na barra nao muda.

    Reescrita e nao redirect: o endereco continua sendo o publico, entao dar um
    "ver publicado" e so desligar o modo.
  */
  const modoEdicao = request.cookies.get(COOKIE_EDICAO)?.value === "1";
  const editavel = !FORA_DO_SITE.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );

  if (modoEdicao && user && editavel) {
    const destino = request.nextUrl.clone();
    destino.pathname = `/editar${pathname === "/" ? "" : pathname}`;
    return repassarCookies(NextResponse.rewrite(destino), resposta);
  }

  // Nao existe redirect de /entrar para /admin aqui. Se existisse, um usuario
  // autenticado que nao e admin ficaria quicando entre as duas rotas para
  // sempre. Quem decide isso e a propria pagina /entrar.

  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
