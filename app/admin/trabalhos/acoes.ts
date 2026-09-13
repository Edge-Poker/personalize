"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdmin, exigirSucesso } from "@/lib/admin";

const esquema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Só letras minúsculas, números e hífen."),
  cliente: z.string().trim().max(120),
  ano: z.union([z.coerce.number().int().min(1990).max(2100), z.literal("")]),
  citacao_autor: z.string().trim().max(120),
  citacao_cargo: z.string().trim().max(120),
  url_externa: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Use um endereço http."),
  ordem: z.coerce.number().int().min(0).max(9999),
  visivel: z.coerce.boolean(),
});

export async function atualizarTrabalho(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = esquema.safeParse({
    id: formData.get("id"),
    slug: formData.get("slug"),
    cliente: formData.get("cliente") ?? "",
    ano: formData.get("ano") === "" ? "" : formData.get("ano"),
    citacao_autor: formData.get("citacao_autor") ?? "",
    citacao_cargo: formData.get("citacao_cargo") ?? "",
    url_externa: formData.get("url_externa") ?? "",
    ordem: formData.get("ordem") ?? 0,
    visivel: formData.get("visivel") === "on",
  });

  if (!analise.success) {
    throw new Error(analise.error.issues[0]?.message ?? "Confira os campos.");
  }
  const d = analise.data;

  const resultado = await supabase
    .from("projects")
    .update({
      slug: d.slug,
      cliente: d.cliente,
      ano: d.ano === "" ? null : d.ano,
      citacao_autor: d.citacao_autor || null,
      citacao_cargo: d.citacao_cargo || null,
      url_externa: d.url_externa || null,
      ordem: d.ordem,
      visivel: d.visivel,
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
    })
    .eq("id", d.id);

  exigirSucesso(resultado, "salvar este trabalho");

  revalidatePath("/admin/trabalhos");
  revalidatePath("/", "layout");
}

export async function criarTrabalho(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({
      titulo: z.string().trim().min(1).max(200),
      slug: z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    })
    .safeParse({ titulo: formData.get("titulo"), slug: formData.get("slug") });

  if (!analise.success) {
    throw new Error("Título e endereço são obrigatórios, e o endereço só aceita letras minúsculas, números e hífen.");
  }

  // Nasce invisivel: um case incompleto no ar e pior do que case nenhum.
  exigirSucesso(
    await supabase.from("projects").insert({
      titulo: analise.data.titulo,
      slug: analise.data.slug,
      visivel: false,
      ordem: 999,
    }),
    "criar o trabalho",
  );

  revalidatePath("/admin/trabalhos");
  redirect("/admin/trabalhos");
}
