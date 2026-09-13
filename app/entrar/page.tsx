import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ehAdmin } from "@/lib/supabase/server";
import { Marca } from "@/components/marca";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const { proximo, erro } = await searchParams;

  // O redirect de quem ja esta logado mora aqui, e nao no middleware, porque
  // aqui da para saber se a pessoa e admin de verdade. No middleware daria
  // para saber so que existe sessao, e uma sessao nao-admin ficaria pingando
  // entre /entrar e /admin sem parar.
  if (await ehAdmin()) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="titulo-3">
        <Link href="/" className="marca">
          <Marca />
        </Link>
      </h1>
      <p className="mt-3 text-base leading-relaxed">
        Entrada do painel. Uma conta so, a sua.
      </p>

      {erro === "sem_permissao" ? (
        <p role="alert" className="mt-6 text-base leading-relaxed text-[#7a2e42]">
          Voce esta autenticado, mas essa conta nao esta na lista de admins. Entre com a
          conta certa, ou rode <code>npm run criar-admin</code> para liberar esta.
        </p>
      ) : null}

      <FormularioLogin proximo={proximo ?? "/admin"} />
    </main>
  );
}
