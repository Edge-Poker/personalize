import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { atualizarServico } from "./acoes";

const CAMPO =
  "rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px] w-full";

export default async function Servicos() {
  const { supabase } = await exigirAdmin();
  const { data: servicos } = await supabase.from("services").select("*").order("ordem");

  return (
    <div className="max-w-[720px]">
      <h1 className="titulo-2">Serviços</h1>
      <p className="corpo medida mt-[var(--e3)]">
        Aqui ficam preço, prazo, ordem e as listas do que entra e do que não entra. Título,
        resumo, descrição e "para quem é" se editam na própria página do serviço, com o modo
        de edição ligado.
      </p>

      <ul className="mt-[var(--e5)]">
        {(servicos ?? []).map((servico) => (
          <li key={servico.id} className="border-t border-[var(--linha)] py-[var(--e5)]">
            <div className="flex flex-wrap items-baseline justify-between gap-[var(--e3)]">
              <h2 className="titulo-3">{servico.titulo}</h2>
              <Link href={`/servicos/${servico.slug}`} className="enlace corpo-p">
                ver no site
              </Link>
            </div>

            <form action={atualizarServico} className="mt-[var(--e3)] flex flex-col gap-[var(--e3)]">
              <input type="hidden" name="id" value={servico.id} />

              <div className="flex flex-wrap gap-[var(--e3)]">
                <span className="flex w-[200px] flex-col">
                  <label htmlFor={`slug-${servico.id}`} className="nota">
                    endereço
                  </label>
                  <input
                    id={`slug-${servico.id}`}
                    name="slug"
                    defaultValue={servico.slug}
                    className={CAMPO}
                  />
                </span>

                <span className="flex w-[120px] flex-col">
                  <label htmlFor={`preco-${servico.id}`} className="nota">
                    a partir de (R$)
                  </label>
                  <input
                    id={`preco-${servico.id}`}
                    name="preco_min"
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={servico.preco_min ?? ""}
                    className={`${CAMPO} numero`}
                  />
                </span>

                <span className="flex w-[170px] flex-col">
                  <label htmlFor={`preco-texto-${servico.id}`} className="nota">
                    como o preço aparece
                  </label>
                  <input
                    id={`preco-texto-${servico.id}`}
                    name="preco_texto"
                    defaultValue={servico.preco_texto ?? ""}
                    className={CAMPO}
                  />
                </span>

                <span className="flex w-[170px] flex-col">
                  <label htmlFor={`prazo-${servico.id}`} className="nota">
                    prazo
                  </label>
                  <input
                    id={`prazo-${servico.id}`}
                    name="prazo_texto"
                    defaultValue={servico.prazo_texto ?? ""}
                    className={CAMPO}
                  />
                </span>

                <span className="flex w-[80px] flex-col">
                  <label htmlFor={`ordem-${servico.id}`} className="nota">
                    ordem
                  </label>
                  <input
                    id={`ordem-${servico.id}`}
                    name="ordem"
                    type="number"
                    min={0}
                    defaultValue={servico.ordem}
                    className={`${CAMPO} numero`}
                  />
                </span>
              </div>

              <div className="flex flex-wrap gap-[var(--e4)]">
                <span className="flex min-w-[260px] flex-1 flex-col">
                  <label htmlFor={`inclui-${servico.id}`} className="nota">
                    está incluso — um item por linha
                  </label>
                  <textarea
                    id={`inclui-${servico.id}`}
                    name="inclui"
                    rows={6}
                    defaultValue={servico.inclui.join("\n")}
                    className={CAMPO}
                  />
                </span>

                <span className="flex min-w-[260px] flex-1 flex-col">
                  <label htmlFor={`nao-${servico.id}`} className="nota">
                    não está — um item por linha
                  </label>
                  <textarea
                    id={`nao-${servico.id}`}
                    name="nao_inclui"
                    rows={6}
                    defaultValue={servico.nao_inclui.join("\n")}
                    className={CAMPO}
                  />
                </span>
              </div>

              <div className="flex items-center gap-[var(--e4)]">
                <label className="flex items-center gap-[6px]">
                  <input type="checkbox" name="visivel" defaultChecked={servico.visivel} />
                  <span className="corpo-p">visível no site</span>
                </label>
                <button type="submit" className="acao">
                  salvar
                </button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
