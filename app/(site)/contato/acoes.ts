"use server";

import { z } from "zod";
import { avisarLeadNovo } from "@/lib/aviso-email";
import { chaveDeLimite, ipDoPedido } from "@/lib/pedido";
import { criarClientePublico } from "@/lib/supabase/publico";

export type EstadoContato = { estado: "parado" | "enviado" | "erro"; mensagem?: string };

const esquema = z
  .object({
    nome: z.string().trim().min(2, "Escreva seu nome.").max(120),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Esse e-mail não parece certo."),
    whatsapp: z.string().trim().max(30),
    tipo_projeto: z.string().trim().max(120),
    mensagem: z.string().trim().max(4000),
    // Isca antispam: robo preenche, gente nao ve.
    site: z.string().max(0),
  })
  .refine((dados) => dados.email !== "" || dados.whatsapp !== "", {
    message: "Deixe um e-mail ou um WhatsApp, para eu conseguir te responder.",
    path: ["email"],
  });

export async function enviarContato(
  _anterior: EstadoContato,
  formData: FormData,
): Promise<EstadoContato> {
  const analise = esquema.safeParse({
    nome: formData.get("nome") ?? "",
    email: formData.get("email") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    tipo_projeto: formData.get("tipo_projeto") ?? "",
    mensagem: formData.get("mensagem") ?? "",
    site: formData.get("site") ?? "",
  });

  if (!analise.success) {
    const primeiro = analise.error.issues[0];

    // Se o campo isca veio preenchido, quem mandou foi robo. Respondo como se
    // tivesse dado certo: robo que recebe erro tenta de novo, robo que recebe
    // sucesso vai embora.
    if (primeiro?.path[0] === "site") {
      return { estado: "enviado" };
    }

    return { estado: "erro", mensagem: primeiro?.message ?? "Confira os campos." };
  }

  const dados = analise.data;
  const chave = chaveDeLimite(await ipDoPedido());
  const supabase = criarClientePublico();

  const { data, error } = await supabase.rpc("registrar_lead", {
    p_nome: dados.nome,
    p_email: dados.email || null,
    p_whatsapp: dados.whatsapp || null,
    p_origem: "contato",
    p_tipo_projeto: dados.tipo_projeto || null,
    p_mensagem: dados.mensagem || null,
    p_chave_limite: chave,
  });

  if (error) {
    if (error.message.includes("limite_excedido")) {
      return {
        estado: "erro",
        mensagem:
          "Você já mandou algumas mensagens na última hora. Se for urgente, me chame no WhatsApp.",
      };
    }

    console.error("Falha ao registrar lead:", error);
    return {
      estado: "erro",
      mensagem:
        "A mensagem não saiu daqui. Tente de novo em um minuto, ou me chame no WhatsApp que eu respondo do mesmo jeito.",
    };
  }

  if (!data) {
    return { estado: "erro", mensagem: "A mensagem não saiu daqui. Tente de novo em um minuto." };
  }

  // O aviso vai depois do lead salvo, e nao lanca. Se o Resend estiver fora,
  // o contato ja esta no banco e eu vejo no painel.
  await avisarLeadNovo({
    nome: dados.nome,
    email: dados.email || null,
    whatsapp: dados.whatsapp || null,
    tipoProjeto: dados.tipo_projeto || null,
    mensagem: dados.mensagem || null,
    origem: "contato",
  });

  return { estado: "enviado" };
}
