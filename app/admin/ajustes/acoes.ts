"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";

export type EstadoAjustes = { ok?: boolean; erro?: string };

const esquema = z.object({
  marca_nome: z.string().trim().min(1, "A marca precisa de um nome.").max(80),
  marca_descricao: z.string().trim().max(300),
  contato_email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Esse e-mail não parece certo."),
  contato_whatsapp: z.string().trim().max(30),
  contato_instagram: z.string().trim().max(60),
  contato_cidade: z.string().trim().max(80),
  seo_titulo_padrao: z.string().trim().max(120),
  seo_template_titulo: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || v.includes("%s"), "O modelo precisa ter %s no lugar do título."),
  seo_descricao_padrao: z.string().trim().max(300),
});

export async function salvarAjustes(
  _anterior: EstadoAjustes,
  formData: FormData,
): Promise<EstadoAjustes> {
  const { supabase } = await exigirAdmin();

  const analise = esquema.safeParse(Object.fromEntries(formData));
  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Confira os campos." };
  }

  const d = analise.data;

  const { error } = await supabase.from("site_settings").upsert(
    [
      {
        chave: "marca",
        valor: { nome: d.marca_nome, descricao: d.marca_descricao },
        publico: true,
      },
      {
        chave: "contato",
        valor: {
          email: d.contato_email,
          // Guardo so digitos: o link do WhatsApp precisa deles, e assim tanto
          // faz se voce digitou com parenteses, traco ou espaco.
          whatsapp: d.contato_whatsapp.replace(/\D/g, ""),
          instagram: d.contato_instagram.replace(/^@/, ""),
          cidade: d.contato_cidade,
        },
        publico: true,
      },
      {
        chave: "seo",
        valor: {
          titulo_padrao: d.seo_titulo_padrao,
          template_titulo: d.seo_template_titulo || "%s | persona.lize",
          descricao_padrao: d.seo_descricao_padrao,
        },
        publico: true,
      },
    ],
    { onConflict: "chave" },
  );

  if (error) {
    console.error("Falha ao salvar ajustes:", error);
    return { erro: "Não consegui salvar. Tente de novo." };
  }

  // Marca, contatos e SEO aparecem no cabecalho e no rodape de toda pagina.
  revalidatePath("/", "layout");
  return { ok: true };
}
