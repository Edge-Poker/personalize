"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";

const esquema = z.object({
  path: z.string().min(1).max(300),
  // Obrigatorio no banco tambem (check em 0003). Imagem sem alt e imagem que
  // some para quem usa leitor de tela, e nao ha por que permitir.
  alt: z.string().trim().min(1, "Descreva a imagem. Sem isso ela não entra.").max(300),
  largura: z.number().int().positive().max(20000),
  altura: z.number().int().positive().max(20000),
  bytes: z.number().int().positive(),
});

export type MidiaRegistrada = {
  id: string;
  path: string;
  alt: string;
  largura: number | null;
  altura: number | null;
};

/**
 * Devolve a linha criada, e não só um "deu certo".
 *
 * Quem envia uma imagem no meio da página precisa usá-la em seguida — sem o
 * registro de volta, o editor teria de ir buscar na mediateca a imagem que
 * acabou de mandar, só para descobrir o caminho dela.
 */
export async function registrarMidia(
  dados: unknown,
): Promise<{ ok: true; item: MidiaRegistrada } | { ok: false; erro: string }> {
  const { supabase } = await exigirAdmin();

  const analise = esquema.safeParse(dados);
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { data, error } = await supabase
    .from("media")
    .insert({ ...analise.data, tipo: "image/webp" })
    .select("id, path, alt, largura, altura")
    .single();

  if (error || !data) {
    console.error("Falha ao registrar mídia:", error);
    return { ok: false, erro: "A imagem subiu mas não entrou na mediateca. Tente de novo." };
  }

  revalidatePath("/admin/midia");
  return { ok: true, item: data };
}

export async function atualizarAlt(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({ id: z.string().uuid(), alt: z.string().trim().min(1).max(300) })
    .safeParse({ id: formData.get("id"), alt: formData.get("alt") });

  if (!analise.success) return;

  await supabase.from("media").update({ alt: analise.data.alt }).eq("id", analise.data.id);
  revalidatePath("/admin/midia");
  revalidatePath("/", "layout");
}

export async function apagarMidia(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({ id: z.string().uuid(), path: z.string().min(1) })
    .safeParse({ id: formData.get("id"), path: formData.get("path") });

  if (!analise.success) return;

  // Storage primeiro. Se o arquivo sumir e a linha ficar, sobra registro
  // apontando para o nada - visivel e facil de limpar. O contrario deixaria
  // arquivo orfao no bucket, invisivel e cobrado.
  await supabase.storage.from("midia").remove([analise.data.path]);
  await supabase.from("media").delete().eq("id", analise.data.id);

  revalidatePath("/admin/midia");
}
