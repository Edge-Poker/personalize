"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin, exigirSucesso } from "@/lib/admin";

const esquemaItem = z.object({
  rotulo: z.string().trim().min(1, "A aba precisa de um nome.").max(60),
  href: z
    .string()
    .trim()
    .min(1)
    .max(300)
    // Caminho interno ou endereco completo. Sem isto daria para pendurar
    // javascript: no menu do proprio site.
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
      "Use um caminho começando com / ou um endereço http.",
    ),
  ordem: z.coerce.number().int().min(0).max(9999),
  visivel: z.coerce.boolean(),
});

export async function criarItemDeNav(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = esquemaItem.safeParse({
    rotulo: formData.get("rotulo"),
    href: formData.get("href"),
    ordem: formData.get("ordem") ?? 0,
    visivel: formData.get("visivel") === "on",
  });

  if (!analise.success) {
    throw new Error(analise.error.issues[0]?.message ?? "Confira os campos.");
  }

  exigirSucesso(await supabase.from("nav_items").insert(analise.data), "criar a aba");
  revalidatePath("/admin/navegacao");
  revalidatePath("/", "layout");
}

export async function atualizarItemDeNav(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const id = z.string().uuid().safeParse(formData.get("id"));
  const analise = esquemaItem.safeParse({
    rotulo: formData.get("rotulo"),
    href: formData.get("href"),
    ordem: formData.get("ordem") ?? 0,
    visivel: formData.get("visivel") === "on",
  });

  if (!id.success || !analise.success) {
    throw new Error(analise.success ? "Aba inválida." : analise.error.issues[0]?.message ?? "Confira os campos.");
  }

  exigirSucesso(
    await supabase.from("nav_items").update(analise.data).eq("id", id.data),
    "salvar a aba",
  );
  revalidatePath("/admin/navegacao");
  revalidatePath("/", "layout");
}

export async function apagarItemDeNav(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  exigirSucesso(await supabase.from("nav_items").delete().eq("id", id.data), "apagar a aba");
  revalidatePath("/admin/navegacao");
  revalidatePath("/", "layout");
}
