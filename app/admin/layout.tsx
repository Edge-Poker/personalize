import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { Marca } from "@/components/marca";
import { sair } from "@/app/entrar/acoes";
import { AlternarEdicao } from "./alternar-edicao";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

const ABAS = [
  { rotulo: "início", href: "/admin" },
  { rotulo: "leads", href: "/admin/leads" },
  { rotulo: "páginas", href: "/admin/paginas" },
  { rotulo: "serviços", href: "/admin/servicos" },
  { rotulo: "trabalhos", href: "/admin/trabalhos" },
  { rotulo: "navegação", href: "/admin/navegacao" },
  { rotulo: "mídia", href: "/admin/midia" },
  { rotulo: "ajustes", href: "/admin/ajustes" },
] as const;

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  // Segunda camada de autorizacao. O middleware garantiu que existe sessao;
  // aqui o banco responde se essa sessao e admin. A terceira e a RLS.
  await exigirAdmin();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--linha)]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-[var(--e4)] px-[var(--e5)] py-[var(--e4)]">
          <Link href="/admin" className="marca titulo-4">
            <Marca />
          </Link>
          <div className="flex items-center gap-[var(--e4)]">
            <AlternarEdicao />
            <form action={sair}>
              <button type="submit" className="enlace corpo-p">
                sair
              </button>
            </form>
          </div>
        </div>

        <nav aria-label="Seções do painel" className="mx-auto max-w-[1240px] px-[var(--e5)] pb-[var(--e3)]">
          <ul className="flex flex-wrap gap-x-[var(--e4)] gap-y-1">
            {ABAS.map((aba) => (
              <li key={aba.href}>
                <Link href={aba.href} className="enlace corpo-p">
                  {aba.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-[1240px] px-[var(--e5)] py-[var(--e6)]">{children}</main>
    </div>
  );
}
