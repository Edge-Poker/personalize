import { exigirAdmin } from "@/lib/admin";
import { apagarItemDeNav, atualizarItemDeNav, criarItemDeNav } from "./acoes";

const CAMPO =
  "rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]";

export default async function Navegacao() {
  const { supabase } = await exigirAdmin();

  const { data: itens } = await supabase.from("nav_items").select("*").order("ordem");

  return (
    <div className="max-w-[720px]">
      <h1 className="titulo-2">Navegação</h1>
      <p className="corpo medida mt-[var(--e3)]">
        As abas do site saem daqui. A ordem é o número: menor aparece antes. Desmarcar
        "visível" tira a aba do menu sem apagar nada — a página continua acessível por link
        direto.
      </p>

      <ul className="mt-[var(--e5)] border-t border-[var(--linha)]">
        {(itens ?? []).map((item) => (
          <li key={item.id} className="border-b border-[var(--linha)] py-[var(--e3)]">
            <form action={atualizarItemDeNav} className="flex flex-wrap items-end gap-[var(--e2)]">
              <input type="hidden" name="id" value={item.id} />

              <span className="flex flex-col">
                <label htmlFor={`rotulo-${item.id}`} className="nota">
                  nome
                </label>
                <input
                  id={`rotulo-${item.id}`}
                  name="rotulo"
                  defaultValue={item.rotulo}
                  className={`${CAMPO} w-[150px]`}
                />
              </span>

              <span className="flex flex-col">
                <label htmlFor={`href-${item.id}`} className="nota">
                  destino
                </label>
                <input
                  id={`href-${item.id}`}
                  name="href"
                  defaultValue={item.href}
                  className={`${CAMPO} w-[190px]`}
                />
              </span>

              <span className="flex flex-col">
                <label htmlFor={`ordem-${item.id}`} className="nota">
                  ordem
                </label>
                <input
                  id={`ordem-${item.id}`}
                  name="ordem"
                  type="number"
                  min={0}
                  defaultValue={item.ordem}
                  className={`${CAMPO} w-[80px] numero`}
                />
              </span>

              <label className="flex items-center gap-[6px] pb-[6px]">
                <input type="checkbox" name="visivel" defaultChecked={item.visivel} />
                <span className="corpo-p">visível</span>
              </label>

              <button type="submit" className="enlace corpo-p pb-[6px]">
                salvar
              </button>
            </form>

            <form action={apagarItemDeNav} className="mt-[var(--e1)]">
              <input type="hidden" name="id" value={item.id} />
              <button type="submit" className="nota underline">
                apagar esta aba
              </button>
            </form>
          </li>
        ))}
      </ul>

      <section className="mt-[var(--e6)]">
        <h2 className="titulo-3">Nova aba</h2>
        <form action={criarItemDeNav} className="mt-[var(--e3)] flex flex-wrap items-end gap-[var(--e2)]">
          <span className="flex flex-col">
            <label htmlFor="novo-rotulo" className="nota">
              nome
            </label>
            <input id="novo-rotulo" name="rotulo" required className={`${CAMPO} w-[150px]`} />
          </span>
          <span className="flex flex-col">
            <label htmlFor="novo-href" className="nota">
              destino
            </label>
            <input
              id="novo-href"
              name="href"
              required
              placeholder="/nova-pagina"
              className={`${CAMPO} w-[190px]`}
            />
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
              defaultValue={(itens?.length ?? 0) * 10 + 10}
              className={`${CAMPO} w-[80px] numero`}
            />
          </span>
          <label className="flex items-center gap-[6px] pb-[6px]">
            <input type="checkbox" name="visivel" defaultChecked />
            <span className="corpo-p">visível</span>
          </label>
          <button type="submit" className="acao">
            criar
          </button>
        </form>
      </section>
    </div>
  );
}
