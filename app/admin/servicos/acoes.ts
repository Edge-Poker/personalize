"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin, exigirSucesso } from "@/lib/admin";

/** Uma linha por item. É o jeito mais direto de editar text[] num formulário. */
function paraLista(valor: FormDataEntryValue | null): string[] {
  return String(valor ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
    .slice(0, 40);
}

const esquema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Só letras minúsculas, números e hífen."),
  preco_min: z.union([z.coerce.number().min(0).max(9999999), z.literal("")]),
  preco_texto: z.string().trim().max(80),
  prazo_texto: z.string().trim().max(80),
  ordem: z.coerce.number().int().min(0).max(9999),
  visivel: z.coerce.boolean(),
});

export async function atualizarServico(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = esquema.safeParse({
    id: formData.get("id"),
    slug: formData.get("slug"),
    preco_min: formData.get("preco_min") === "" ? "" : formData.get("preco_min"),
    preco_texto: formData.get("preco_texto") ?? "",
    prazo_texto: formData.get("prazo_texto") ?? "",
    ordem: formData.get("ordem") ?? 0,
    visivel: formData.get("visivel") === "on",
  });

  if (!analise.success) {
    throw new Error(analise.error.issues[0]?.message ?? "Confira os campos.");
  }
  const d = analise.data;

  const resultado = await supabase
    .from("services")
    .update({
      slug: d.slug,
      preco_min: d.preco_min === "" ? null : d.preco_min,
      preco_texto: d.preco_texto || null,
      prazo_texto: d.prazo_texto || null,
      ordem: d.ordem,
      visivel: d.visivel,
      inclui: paraLista(formData.get("inclui")),
      nao_inclui: paraLista(formData.get("nao_inclui")),
    })
    .eq("id", d.id);

  exigirSucesso(resultado, "salvar este serviço");

  revalidatePath("/admin/servicos");
  revalidatePath("/", "layout");
}
