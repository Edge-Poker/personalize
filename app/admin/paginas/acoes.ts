"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import type { Json } from "@/lib/types/database";

const SLUG = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Só letras minúsculas, números e hífen.");

/**
 * Rotas escritas a mao tem precedencia sobre o segmento dinamico, entao uma
 * pagina com slug `contato` nunca apareceria - o formulario de contato ganha.
 * Melhor recusar na criacao do que deixar criar uma pagina invisivel e a
 * pessoa passar meia hora tentando entender por que nao aparece.
 */
const SLUGS_OCUPADOS = ["home", "servicos", "trabalhos", "contato", "briefing", "admin", "entrar", "editar", "proposta"];

export async function criarPagina(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({ slug: SLUG, titulo: z.string().trim().min(1).max(200) })
    .safeParse({ slug: formData.get("slug"), titulo: formData.get("titulo") });

  if (!analise.success) return;
  if (SLUGS_OCUPADOS.includes(analise.data.slug)) return;

  const { data } = await supabase
    .from("pages")
    .insert({ slug: analise.data.slug, titulo: analise.data.titulo, publicado: false })
    .select("id")
    .maybeSingle();

  revalidatePath("/admin/paginas");
  if (data) redirect(`/admin/paginas/${data.id}`);
}

export async function atualizarPagina(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({
      id: z.string().uuid(),
      titulo: z.string().trim().min(1).max(200),
      seo_titulo: z.string().trim().max(200),
      seo_descricao: z.string().trim().max(300),
      publicado: z.coerce.boolean(),
    })
    .safeParse({
      id: formData.get("id"),
      titulo: formData.get("titulo"),
      seo_titulo: formData.get("seo_titulo") ?? "",
      seo_descricao: formData.get("seo_descricao") ?? "",
      publicado: formData.get("publicado") === "on",
    });

  if (!analise.success) return;

  await supabase
    .from("pages")
    .update({
      titulo: analise.data.titulo,
      publicado: analise.data.publicado,
      seo: { titulo: analise.data.seo_titulo, descricao: analise.data.seo_descricao } as Json,
    })
    .eq("id", analise.data.id);

  revalidatePath("/admin/paginas");
  revalidatePath("/", "layout");
}

export async function apagarPagina(formData: FormData) {
  const { supabase } = await exigirAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  await supabase.from("pages").delete().eq("id", id.data);
  revalidatePath("/admin/paginas");
  revalidatePath("/", "layout");
  redirect("/admin/paginas");
}

/** Cada tipo nasce com um exemplo preenchido, para a seção já aparecer na página. */
const MODELOS: Record<string, Json> = {
  intro: { nota: "uma nota de margem", titulo: "Título da página", texto: "Uma frase de abertura." },
  texto: { nota: "sobre o quê", titulo: "Um subtítulo", paragrafos: ["Escreva aqui."] },
  convite: {
    nota: "o próximo passo",
    titulo: "Uma chamada.",
    texto: "Uma frase explicando o que acontece depois.",
    acao: { rotulo: "falar comigo", href: "/contato", forte: true },
  },
  servicos: { nota: "o que eu faço" },
  trabalhos: { nota: "três trabalhos reais" },
  heroi: {
    nota: "uma nota de margem",
    titulo: "Um título grande.",
    voz: { calmo: "Escreva aqui.", direto: "Escreva aqui.", autoral: "Escreva aqui." },
    acoes: [],
  },
};

export async function criarSecao(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({
      page_id: z.string().uuid(),
      tipo: z.enum(["intro", "texto", "convite", "servicos", "trabalhos", "heroi"]),
      ordem: z.coerce.number().int().min(0).max(9999),
    })
    .safeParse({
      page_id: formData.get("page_id"),
      tipo: formData.get("tipo"),
      ordem: formData.get("ordem") ?? 0,
    });

  if (!analise.success) return;

  await supabase.from("sections").insert({
    page_id: analise.data.page_id,
    tipo: analise.data.tipo,
    ordem: analise.data.ordem,
    dados: MODELOS[analise.data.tipo] ?? {},
    visivel: true,
  });

  revalidatePath(`/admin/paginas/${analise.data.page_id}`);
  revalidatePath("/", "layout");
}

export async function atualizarSecao(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({
      id: z.string().uuid(),
      page_id: z.string().uuid(),
      ordem: z.coerce.number().int().min(0).max(9999),
      visivel: z.coerce.boolean(),
    })
    .safeParse({
      id: formData.get("id"),
      page_id: formData.get("page_id"),
      ordem: formData.get("ordem") ?? 0,
      visivel: formData.get("visivel") === "on",
    });

  if (!analise.success) return;

  await supabase
    .from("sections")
    .update({ ordem: analise.data.ordem, visivel: analise.data.visivel })
    .eq("id", analise.data.id);

  revalidatePath(`/admin/paginas/${analise.data.page_id}`);
  revalidatePath("/", "layout");
}

export async function apagarSecao(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const analise = z
    .object({ id: z.string().uuid(), page_id: z.string().uuid() })
    .safeParse({ id: formData.get("id"), page_id: formData.get("page_id") });

  if (!analise.success) return;

  await supabase.from("sections").delete().eq("id", analise.data.id);
  revalidatePath(`/admin/paginas/${analise.data.page_id}`);
  revalidatePath("/", "layout");
}
