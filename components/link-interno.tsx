import type { Route } from "next";
import Link from "next/link";

/**
 * Link cujo destino vem do banco.
 *
 * typedRoutes valida rota escrita a mao, e estes hrefs sao editaveis pelo
 * painel - o TypeScript nao tem como conferir. O cast fica isolado aqui,
 * num lugar so, em vez de espalhado por cada pagina.
 *
 * Destino externo cai em <a> normal, com rel de seguranca.
 */
export function LinkInterno({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const externo = /^https?:\/\//i.test(href);

  if (externo) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={className}>
      {children}
    </Link>
  );
}
