import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { descartar, publicar } from "./acoes";

const NOME_DA_TABELA: Record<string, string> = {
  sections: "seção",
  pages: "página",
  services: "serviço",
  projects: "trabalho",
  testimonials: "depoimento",
  site_settings: "ajuste",
};

export default async function Painel() {
  const { supabase } = await exigirAdmin();

  const [leadsNovos, rascunhos, servicos, trabalhos] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "novo"),
    supabase
      .from("rascunhos")
      .select("id, tabela, registro_id, atualizado_em")
      .order("atualizado_em", { ascending: false }),
    supabase.from("services").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
  ]);

  const pendentes = rascunhos.data ?? [];

  return (
    <div className="max-w-[720px]">
      <h1 className="titulo-2">Painel</h1>

      <ul className="mt-[var(--e5)] border-t border-[var(--linha)]">
        <li className="flex justify-between border-b border-[var(--linha)] py-[var(--e3)]">
          <Link href="/admin/leads" className="enlace corpo">
            leads sem ler
          </Link>
          <span className="corpo numero">{leadsNovos.count ?? 0}</span>
        </li>
        <li className="flex justify-between border-b border-[var(--linha)] py-[var(--e3)]">
          <Link href="/admin/servicos" className="enlace corpo">
            serviços
          </Link>
          <span className="corpo numero">{servicos.count ?? 0}</span>
        </li>
        <li className="flex justify-between border-b border-[var(--linha)] py-[var(--e3)]">
          <Link href="/admin/trabalhos" className="enlace corpo">
            trabalhos
          </Link>
          <span className="corpo numero">{trabalhos.count ?? 0}</span>
        </li>
      </ul>

      <section className="mt-[var(--e7)]">
        <h2 className="titulo-3">Rascunhos não publicados</h2>

        {pendentes.length === 0 ? (
          <p className="corpo medida mt-[var(--e3)]">
            Nada esperando. Tudo que está no banco é o que está no ar. Para mudar alguma
            coisa, ligue o modo de edição ali em cima e clique no texto direto na página.
          </p>
        ) : (
          <>
            <p className="corpo medida mt-[var(--e3)]">
              Estas alterações estão salvas mas ainda não estão no ar. Publique quando
              estiver satisfeito, ou descarte para voltar ao que está publicado.
            </p>
            <ul className="mt-[var(--e4)] border-t border-[var(--linha)]">
              {pendentes.map((rascunho) => (
                <li
                  key={rascunho.id}
                  className="flex flex-wrap items-center justify-between gap-[var(--e3)] border-b border-[var(--linha)] py-[var(--e3)]"
                >
                  <span className="corpo">
                    {NOME_DA_TABELA[rascunho.tabela] ?? rascunho.tabela}
                    <span className="nota ml-[var(--e2)]">
                      alterada em{" "}
                      {new Date(rascunho.atualizado_em).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </span>

                  <span className="flex gap-[var(--e3)]">
                    <form
                      action={async () => {
                        "use server";
                        await descartar(
                          rascunho.tabela as never,
                          rascunho.registro_id,
                        );
                      }}
                    >
                      <button type="submit" className="enlace corpo-p">
                        descartar
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await publicar(
                          rascunho.tabela as never,
                          rascunho.registro_id,
                        );
                      }}
                    >
                      <button type="submit" className="acao">
                        publicar
                      </button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
