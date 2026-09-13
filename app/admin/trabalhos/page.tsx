import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { atualizarTrabalho, criarTrabalho } from "./acoes";

const CAMPO =
  "rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px] w-full";

export default async function Trabalhos() {
  const { supabase } = await exigirAdmin();
  const { data: trabalhos } = await supabase.from("projects").select("*").order("ordem");

  return (
    <div className="max-w-[720px]">
      <h1 className="titulo-2">Trabalhos</h1>
      <p className="corpo medida mt-[var(--e3)]">
        Estrutura e metadados. O relato — o que pediram, o problema, a decisão, o que mudou e
        o resultado — se edita na própria página do case, com o modo de edição ligado.
      </p>

      <ul className="mt-[var(--e5)]">
        {(trabalhos ?? []).map((trabalho) => (
          <li key={trabalho.id} className="border-t border-[var(--linha)] py-[var(--e5)]">
            <div className="flex flex-wrap items-baseline justify-between gap-[var(--e3)]">
              <h2 className="titulo-3">{trabalho.titulo}</h2>
              <Link href={`/trabalhos/${trabalho.slug}`} className="enlace corpo-p">
                ver no site
              </Link>
            </div>

            <form action={atualizarTrabalho} className="mt-[var(--e3)] flex flex-col gap-[var(--e3)]">
              <input type="hidden" name="id" value={trabalho.id} />

              <div className="flex flex-wrap gap-[var(--e3)]">
                <span className="flex w-[200px] flex-col">
                  <label htmlFor={`slug-${trabalho.id}`} className="nota">
                    endereço
                  </label>
                  <input id={`slug-${trabalho.id}`} name="slug" defaultValue={trabalho.slug} className={CAMPO} />
                </span>

                <span className="flex w-[180px] flex-col">
                  <label htmlFor={`cliente-${trabalho.id}`} className="nota">
                    cliente
                  </label>
                  <input
                    id={`cliente-${trabalho.id}`}
                    name="cliente"
                    defaultValue={trabalho.cliente}
                    className={CAMPO}
                  />
                </span>

                <span className="flex w-[90px] flex-col">
                  <label htmlFor={`ano-${trabalho.id}`} className="nota">
                    ano
                  </label>
                  <input
                    id={`ano-${trabalho.id}`}
                    name="ano"
                    type="number"
                    min={1990}
                    max={2100}
                    defaultValue={trabalho.ano ?? ""}
                    className={`${CAMPO} numero`}
                  />
                </span>

                <span className="flex w-[80px] flex-col">
                  <label htmlFor={`ordem-${trabalho.id}`} className="nota">
                    ordem
                  </label>
                  <input
                    id={`ordem-${trabalho.id}`}
                    name="ordem"
                    type="number"
                    min={0}
                    defaultValue={trabalho.ordem}
                    className={`${CAMPO} numero`}
                  />
                </span>
              </div>

              <div className="flex flex-wrap gap-[var(--e3)]">
                <span className="flex w-[240px] flex-col">
                  <label htmlFor={`tags-${trabalho.id}`} className="nota">
                    tags, separadas por vírgula
                  </label>
                  <input
                    id={`tags-${trabalho.id}`}
                    name="tags"
                    defaultValue={trabalho.tags.join(", ")}
                    className={CAMPO}
                  />
                </span>

                <span className="flex w-[240px] flex-col">
                  <label htmlFor={`url-${trabalho.id}`} className="nota">
                    endereço do site do cliente
                  </label>
                  <input
                    id={`url-${trabalho.id}`}
                    name="url_externa"
                    defaultValue={trabalho.url_externa ?? ""}
                    className={CAMPO}
                  />
                </span>
              </div>

              <div className="flex flex-wrap gap-[var(--e3)]">
                <span className="flex w-[200px] flex-col">
                  <label htmlFor={`autor-${trabalho.id}`} className="nota">
                    quem disse a citação
                  </label>
                  <input
                    id={`autor-${trabalho.id}`}
                    name="citacao_autor"
                    defaultValue={trabalho.citacao_autor ?? ""}
                    className={CAMPO}
                  />
                </span>

                <span className="flex w-[200px] flex-col">
                  <label htmlFor={`cargo-${trabalho.id}`} className="nota">
                    cargo de quem disse
                  </label>
                  <input
                    id={`cargo-${trabalho.id}`}
                    name="citacao_cargo"
                    defaultValue={trabalho.citacao_cargo ?? ""}
                    className={CAMPO}
                  />
                </span>
              </div>

              {!trabalho.citacao ? (
                <p className="nota">
                  Este case ainda não tem citação. O espaço dela fica vazio na página até
                  existir uma frase real — escreva no modo de edição, clicando no lugar dela.
                </p>
              ) : null}

              <div className="flex items-center gap-[var(--e4)]">
                <label className="flex items-center gap-[6px]">
                  <input type="checkbox" name="visivel" defaultChecked={trabalho.visivel} />
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

      <section className="mt-[var(--e6)] border-t border-[var(--linha)] pt-[var(--e5)]">
        <h2 className="titulo-3">Novo trabalho</h2>
        <p className="corpo-p mt-[var(--e2)]">
          Nasce invisível. Escreva o relato na página dele e só então marque como visível.
        </p>
        <form action={criarTrabalho} className="mt-[var(--e3)] flex flex-wrap items-end gap-[var(--e2)]">
          <span className="flex w-[220px] flex-col">
            <label htmlFor="novo-titulo" className="nota">
              título
            </label>
            <input id="novo-titulo" name="titulo" required className={CAMPO} />
          </span>
          <span className="flex w-[220px] flex-col">
            <label htmlFor="novo-slug" className="nota">
              endereço
            </label>
            <input
              id="novo-slug"
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={CAMPO}
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
