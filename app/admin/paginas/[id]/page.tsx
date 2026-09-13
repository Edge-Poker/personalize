import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { LinkInterno } from "@/components/link-interno";
import {
  apagarPagina,
  apagarSecao,
  atualizarPagina,
  atualizarSecao,
  criarSecao,
} from "../acoes";

const CAMPO =
  "rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]";

const TIPOS = ["intro", "texto", "convite", "servicos", "trabalhos", "heroi"] as const;

export default async function EditarPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await exigirAdmin();

  const { data: pagina } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (!pagina) notFound();

  const { data: secoes } = await supabase
    .from("sections")
    .select("*")
    .eq("page_id", id)
    .order("ordem");

  const seo = (pagina.seo ?? {}) as { titulo?: string; descricao?: string };
  const enderecoPublico = pagina.slug === "home" ? "/" : `/${pagina.slug}`;

  return (
    <div className="max-w-[720px]">
      <p className="nota">
        <Link href="/admin/paginas" className="enlace">
          páginas
        </Link>
      </p>
      <h1 className="titulo-2 mt-[var(--e2)]">{pagina.titulo}</h1>
      <p className="corpo medida mt-[var(--e3)]">
        Aqui ficam a estrutura e os metadados. O texto de cada seção se edita na própria
        página: ligue o modo de edição no topo do painel e vá em{" "}
        <LinkInterno href={enderecoPublico} className="enlace">
          {enderecoPublico}
        </LinkInterno>
        .
      </p>

      <form action={atualizarPagina} className="mt-[var(--e5)] flex flex-col gap-[var(--e3)]">
        <input type="hidden" name="id" value={pagina.id} />

        <span className="flex flex-col">
          <label htmlFor="titulo" className="nota">
            título
          </label>
          <input id="titulo" name="titulo" defaultValue={pagina.titulo} className={CAMPO} />
        </span>

        <span className="flex flex-col">
          <label htmlFor="seo_titulo" className="nota">
            título para busca e compartilhamento
          </label>
          <input id="seo_titulo" name="seo_titulo" defaultValue={seo.titulo ?? ""} className={CAMPO} />
        </span>

        <span className="flex flex-col">
          <label htmlFor="seo_descricao" className="nota">
            descrição para busca e compartilhamento
          </label>
          <textarea
            id="seo_descricao"
            name="seo_descricao"
            rows={2}
            defaultValue={seo.descricao ?? ""}
            className={CAMPO}
          />
        </span>

        <label className="flex items-center gap-[6px]">
          <input type="checkbox" name="publicado" defaultChecked={pagina.publicado} />
          <span className="corpo-p">publicada</span>
        </label>

        <div>
          <button type="submit" className="acao acao-forte">
            salvar
          </button>
        </div>
      </form>

      <section className="mt-[var(--e7)]">
        <h2 className="titulo-3">Seções</h2>
        <p className="corpo medida mt-[var(--e2)]">
          A ordem é o número: menor aparece antes. Esconder tira a seção da página sem apagar
          o texto.
        </p>

        <ul className="mt-[var(--e4)] border-t border-[var(--linha)]">
          {(secoes ?? []).map((secao) => (
            <li
              key={secao.id}
              className="flex flex-wrap items-end gap-[var(--e3)] border-b border-[var(--linha)] py-[var(--e3)]"
            >
              <form action={atualizarSecao} className="flex flex-wrap items-end gap-[var(--e2)]">
                <input type="hidden" name="id" value={secao.id} />
                <input type="hidden" name="page_id" value={pagina.id} />

                <span className="corpo w-[110px]">{secao.tipo}</span>

                <span className="flex flex-col">
                  <label htmlFor={`ordem-${secao.id}`} className="nota">
                    ordem
                  </label>
                  <input
                    id={`ordem-${secao.id}`}
                    name="ordem"
                    type="number"
                    min={0}
                    defaultValue={secao.ordem}
                    className={`${CAMPO} numero w-[80px]`}
                  />
                </span>

                <label className="flex items-center gap-[6px] pb-[6px]">
                  <input type="checkbox" name="visivel" defaultChecked={secao.visivel} />
                  <span className="corpo-p">visível</span>
                </label>

                <button type="submit" className="enlace corpo-p pb-[6px]">
                  salvar
                </button>
              </form>

              <form action={apagarSecao} className="pb-[6px]">
                <input type="hidden" name="id" value={secao.id} />
                <input type="hidden" name="page_id" value={pagina.id} />
                <button type="submit" className="nota underline">
                  apagar
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form action={criarSecao} className="mt-[var(--e4)] flex flex-wrap items-end gap-[var(--e2)]">
          <input type="hidden" name="page_id" value={pagina.id} />
          <span className="flex flex-col">
            <label htmlFor="tipo" className="nota">
              tipo da nova seção
            </label>
            <select id="tipo" name="tipo" className={`${CAMPO} w-[160px]`}>
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </span>
          <span className="flex flex-col">
            <label htmlFor="nova-ordem" className="nota">
              ordem
            </label>
            <input
              id="nova-ordem"
              name="ordem"
              type="number"
              min={0}
              defaultValue={((secoes?.length ?? 0) + 1) * 10}
              className={`${CAMPO} numero w-[80px]`}
            />
          </span>
          <button type="submit" className="acao">
            adicionar seção
          </button>
        </form>
      </section>

      {pagina.slug !== "home" ? (
        <form action={apagarPagina} className="mt-[var(--e7)]">
          <input type="hidden" name="id" value={pagina.id} />
          <button type="submit" className="nota underline">
            apagar esta página e todas as seções dela
          </button>
        </form>
      ) : null}
    </div>
  );
}
