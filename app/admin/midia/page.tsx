import Image from "next/image";
import { exigirAdmin } from "@/lib/admin";
import { env } from "@/lib/env";
import { apagarMidia, atualizarAlt } from "./acoes";
import { Enviador } from "./enviador";

function urlPublica(path: string) {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/midia/${path}`;
}

export default async function Midia() {
  const { supabase } = await exigirAdmin();
  const { data: itens } = await supabase
    .from("media")
    .select("*")
    .order("criado_em", { ascending: false });

  return (
    <div className="max-w-[720px]">
      <h1 className="titulo-2">Mídia</h1>
      <p className="corpo medida mt-[var(--e3)]">
        Toda imagem passa por recorte e vira WebP antes de subir. A descrição é obrigatória —
        o banco recusa imagem sem ela.
      </p>

      <Enviador />

      <ul className="mt-[var(--e6)] border-t border-[var(--linha)]">
        {(itens ?? []).length === 0 ? (
          <li className="corpo py-[var(--e4)]">
            Nenhuma imagem ainda. As capas dos trabalhos usam um traço gerado a partir do
            nome enquanto não houver foto.
          </li>
        ) : null}

        {(itens ?? []).map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start gap-[var(--e4)] border-b border-[var(--linha)] py-[var(--e4)]"
          >
            <Image
              src={urlPublica(item.path)}
              alt={item.alt}
              width={item.largura ?? 160}
              height={item.altura ?? 100}
              className="w-[160px]"
            />

            <div className="flex-1">
              <form action={atualizarAlt} className="flex flex-wrap items-end gap-[var(--e2)]">
                <input type="hidden" name="id" value={item.id} />
                <span className="flex min-w-[240px] flex-1 flex-col">
                  <label htmlFor={`alt-${item.id}`} className="nota">
                    descrição
                  </label>
                  <input
                    id={`alt-${item.id}`}
                    name="alt"
                    defaultValue={item.alt}
                    required
                    className="rounded-[2px] border border-[var(--linha)] bg-transparent px-[var(--e2)] py-[4px] text-[15px]"
                  />
                </span>
                <button type="submit" className="enlace corpo-p pb-[6px]">
                  salvar
                </button>
              </form>

              {/* Metadado empilhado, uma informação por linha. */}
              <p className="nota numero mt-[var(--e2)]">
                {item.largura}×{item.altura}
              </p>
              {item.bytes ? (
                <p className="nota numero">{Math.round(item.bytes / 1024)} kB</p>
              ) : null}

              <form action={apagarMidia} className="mt-[var(--e2)]">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="path" value={item.path} />
                <button type="submit" className="nota underline">
                  apagar
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
