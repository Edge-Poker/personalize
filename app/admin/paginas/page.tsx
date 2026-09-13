import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { criarPagina } from "./acoes";

const CAMPO =
  "rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]";

export default async function Paginas() {
  const { supabase } = await exigirAdmin();
  const { data: paginas } = await supabase.from("pages").select("*").order("ordem");

  return (
    <div className="max-w-[720px]">
      <h1 className="titulo-2">Páginas</h1>
      <p className="corpo medida mt-[var(--e3)]">
        Toda página criada aqui vira uma rota do site na hora, sem precisar de código. Ela
        nasce despublicada — o endereço só passa a existir para o público quando você marcar
        como publicada.
      </p>

      <ul className="mt-[var(--e5)] border-t border-[var(--linha)]">
        {(paginas ?? []).map((pagina) => (
          <li
            key={pagina.id}
            className="flex flex-wrap items-baseline justify-between gap-[var(--e3)] border-b border-[var(--linha)] py-[var(--e3)]"
          >
            <Link href={`/admin/paginas/${pagina.id}`} className="enlace corpo">
              {pagina.titulo}
            </Link>
            <span className="flex items-baseline gap-[var(--e4)]">
              <span className="nota">/{pagina.slug === "home" ? "" : pagina.slug}</span>
              <span className="nota">{pagina.publicado ? "publicada" : "rascunho"}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-[var(--e6)]">
        <h2 className="titulo-3">Nova página</h2>
        <form action={criarPagina} className="mt-[var(--e3)] flex flex-wrap items-end gap-[var(--e2)]">
          <span className="flex flex-col">
            <label htmlFor="titulo" className="nota">
              título
            </label>
            <input id="titulo" name="titulo" required className={`${CAMPO} w-[220px]`} />
          </span>
          <span className="flex flex-col">
            <label htmlFor="slug" className="nota">
              endereço
            </label>
            <input
              id="slug"
              name="slug"
              required
              placeholder="minha-pagina"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={`${CAMPO} w-[220px]`}
            />
          </span>
          <button type="submit" className="acao">
            criar
          </button>
        </form>
      </section>
    </div>
  );
}
