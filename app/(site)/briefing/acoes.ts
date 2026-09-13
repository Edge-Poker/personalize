"use server";

import { z } from "zod";
import { calcular, validarRespostas, type Resultado } from "@/lib/briefing";
import { avisarLeadNovo } from "@/lib/aviso-email";
import { chaveDeLimite, ipDoPedido } from "@/lib/pedido";
import { criarClientePublico } from "@/lib/supabase/publico";

/**
 * A conclusao do briefing.
 *
 * O calculo mora do lado de ca por dois motivos, e o segundo importa mais que o
 * primeiro. Um: a tabela de precos nao pode viajar no bundle. Dois: numero
 * calculado no navegador e numero que o visitante pode reescrever antes de
 * gravar — o que transformaria a faixa de orcamento em campo de texto.
 *
 * Entao o cliente manda o que marcou, e nada mais. Quem decide o que aquilo
 * vale e este arquivo, contra as opcoes que existem no banco agora.
 */

export type EstadoBriefing =
  | { estado: "parado" }
  | { estado: "erro"; mensagem: string }
  | { estado: "pronto"; resultado: Resultado; token: string };

const contato = z
  .object({
    nome: z.string().trim().min(2, "Escreva seu nome.").max(120),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Esse e-mail não parece certo."),
    whatsapp: z.string().trim().max(30),
    observacao: z.string().trim().max(400),
    // Isca antispam: robo preenche, gente nao ve.
    site: z.string().max(0),
  })
  .refine((dados) => dados.email !== "" || dados.whatsapp !== "", {
    message: "Deixe um e-mail ou um WhatsApp, para eu conseguir te responder.",
    path: ["email"],
  });

export async function concluirBriefing(
  _anterior: EstadoBriefing,
  formData: FormData,
): Promise<EstadoBriefing> {
  const analise = contato.safeParse({
    nome: formData.get("nome") ?? "",
    email: formData.get("email") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    observacao: formData.get("observacao") ?? "",
    site: formData.get("site") ?? "",
  });

  if (!analise.success) {
    const primeiro = analise.error.issues[0];

    // Robo que recebe erro tenta de novo; robo que recebe sucesso vai embora.
    if (primeiro?.path[0] === "site") {
      return { estado: "erro", mensagem: "Não consegui enviar agora." };
    }
    return { estado: "erro", mensagem: primeiro?.message ?? "Confira os campos." };
  }

  let cruas: unknown;
  try {
    cruas = JSON.parse(String(formData.get("respostas") ?? "{}"));
  } catch {
    return { estado: "erro", mensagem: "Não consegui ler suas respostas. Tente de novo." };
  }

  const validacao = await validarRespostas(cruas);
  if (!validacao.ok) return { estado: "erro", mensagem: validacao.erro };

  const respostas = validacao.respostas;
  const dados = analise.data;
  const supabase = criarClientePublico();

  /*
    O limite, antes de gravar e depois de validar.

    Depois de validar de proposito: payload malformado nao consome tentativa de
    quem so errou o preenchimento. E antes de gravar, porque o custo que a gente
    esta protegendo e a linha em `leads` e o e-mail de aviso.

    Balde proprio do briefing (ver 0017). Antes ele dividia o teto com o
    /contato pela mesma chave de ip, entao mandar mensagens no contato consumia
    tentativas de briefing — um limite que depende do que a pessoa fez noutra
    pagina e um limite que ela nao tem como entender.
  */
  const chaveLimite = chaveDeLimite(await ipDoPedido());
  const { data: limite } = await supabase.rpc("checar_limite_briefing", {
    p_chave: chaveLimite ?? "",
  });

  const permissao = limite as { permitido?: boolean; restam_segundos?: number } | null;
  if (permissao && permissao.permitido === false) {
    const minutos = Math.max(1, Math.ceil((permissao.restam_segundos ?? 3600) / 60));
    return {
      estado: "erro",
      mensagem: `Tentativas indisponíveis — você já enviou três briefings nesta hora. Elas voltam em ${minutos} ${
        minutos === 1 ? "minuto" : "minutos"
      }. Se for urgente, me chame no WhatsApp.`,
    };
  }

  const resultado = await calcular(respostas);

  const { data, error } = await supabase.rpc("registrar_lead", {
    p_nome: dados.nome,
    p_email: dados.email || null,
    p_whatsapp: dados.whatsapp || null,
    p_origem: "briefing",
    p_tipo_projeto: typeof respostas.tipo === "string" ? respostas.tipo : null,
    p_mensagem: dados.observacao || null,
    p_respostas: respostas,
    p_faixa_estimada: resultado.faixa?.texto ?? null,
    p_prazo_estimado: resultado.prazo?.texto ?? null,
    p_direcao_visual: resultado.direcao?.chave ?? null,
    // Nulo: o limite do briefing ja foi conferido acima, no balde proprio.
    // Passar a chave aqui faria a tentativa contar duas vezes — uma no balde do
    // briefing e outra no balde compartilhado com o /contato, que e justamente
    // o acoplamento que a 0017 desfez.
    p_chave_limite: null,
    // Mas o balde fica registrado: e por ele que apagar o lead no painel sabe
    // a quem devolver a tentativa. Ver 0018.
    p_balde: chaveLimite,
  });

  if (error) {
    if (error.message.includes("limite_excedido")) {
      return {
        estado: "erro",
        mensagem: "Você já enviou alguns briefings na última hora. Se for urgente, me chame no WhatsApp.",
      };
    }
    return { estado: "erro", mensagem: "Não consegui salvar agora. Tente de novo em instantes." };
  }

  const token = (data as { token_retorno?: string } | null)?.token_retorno;
  if (!token) return { estado: "erro", mensagem: "Não consegui salvar agora. Tente de novo em instantes." };

  // O aviso nunca derruba a conclusao: o lead ja esta gravado, e perder o
  // e-mail e menos grave que devolver erro para quem respondeu sete perguntas.
  await avisarLeadNovo({
    nome: dados.nome,
    email: dados.email || null,
    whatsapp: dados.whatsapp || null,
    tipoProjeto: typeof respostas.tipo === "string" ? respostas.tipo : null,
    mensagem: dados.observacao || null,
    origem: "briefing",
  });

  return { estado: "pronto", resultado, token };
}

/**
 * A reabertura pelo link.
 *
 * Recalcula e atualiza o mesmo lead. Nao cria linha nova: o token e a
 * identidade daquele briefing, e duplicar seria transformar "revisei minha
 * resposta" em dois clientes na lista.
 */
export async function reenviarBriefing(
  _anterior: EstadoBriefing,
  formData: FormData,
): Promise<EstadoBriefing> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { estado: "erro", mensagem: "Link inválido." };

  let cruas: unknown;
  try {
    cruas = JSON.parse(String(formData.get("respostas") ?? "{}"));
  } catch {
    return { estado: "erro", mensagem: "Não consegui ler suas respostas. Tente de novo." };
  }

  const validacao = await validarRespostas(cruas);
  if (!validacao.ok) return { estado: "erro", mensagem: validacao.erro };

  const resultado = await calcular(validacao.respostas);
  const supabase = criarClientePublico();

  const { data, error } = await supabase.rpc("atualizar_briefing", {
    p_token: token,
    p_respostas: validacao.respostas,
    p_faixa_estimada: resultado.faixa?.texto ?? null,
    p_prazo_estimado: resultado.prazo?.texto ?? null,
    p_nome: String(formData.get("nome") ?? "").trim() || null,
    p_email: String(formData.get("email") ?? "").trim() || null,
    p_whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
  });

  if (error || data === false) {
    return {
      estado: "erro",
      mensagem: "Não consegui atualizar. O link pode ter expirado — ele vale 60 dias.",
    };
  }

  return { estado: "pronto", resultado, token };
}
