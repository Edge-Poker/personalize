import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { Cabecalho } from "@/components/cabecalho";
import { Rodape } from "@/components/rodape";
import { alternarEdicao } from "@/app/admin/acoes";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * A versao editavel do site, servida na mesma URL da publica por reescrita do
 * middleware.
 *
 * O layout e o mesmo do site de proposito: editar tem de acontecer na pagina
 * de verdade, com a tipografia de verdade e a paleta de verdade. A unica
 * coisa a mais e a faixa de aviso aqui em cima e a barra flutuante que o
 * ProvedorEdicao pendura embaixo.
 */
export default async function LayoutEditor({ children }: { children: React.ReactNode }) {
  await exigirAdmin();

  return (
    <>
      <div className="border-b border-[var(--acento)]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-[var(--e3)] px-[var(--e5)] py-[var(--e2)]">
          <p className="corpo-p">
            Modo de edição. Só você está vendo isto — para quem não tem sessão, este endereço
            continua sendo a página publicada.
          </p>
          <div className="flex items-center gap-[var(--e4)]">
            <Link href="/admin" className="enlace corpo-p">
              painel
            </Link>
            <form
              action={async () => {
                "use server";
                await alternarEdicao(false);
              }}
            >
              <button type="submit" className="enlace corpo-p">
                ver publicado
              </button>
            </form>
          </div>
        </div>
      </div>

      <Cabecalho />
      {/* O ProvedorEdicao mora na página, não aqui: ele precisa saber quais
          registros estão sendo desenhados para o botão de publicar funcionar. */}
      <main id="conteudo">{children}</main>
      <Rodape />
    </>
  );
}
