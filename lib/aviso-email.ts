import "server-only";
import { env } from "@/lib/env";
import { envServidor } from "@/lib/env.server";

/**
 * Avisa por e-mail que chegou lead novo, via Resend.
 *
 * Chamado direto por fetch em vez de instalar o SDK: e uma requisicao POST com
 * um JSON, e uma dependencia a menos e uma dependencia a menos.
 *
 * Nunca lanca. Se o e-mail falhar, o lead ja esta salvo no banco - perder o
 * aviso e ruim, perder o contato do cliente porque o Resend estava fora seria
 * pior.
 */
export async function avisarLeadNovo(lead: {
  nome: string;
  email: string | null;
  whatsapp: string | null;
  tipoProjeto: string | null;
  mensagem: string | null;
  origem: string;
}): Promise<void> {
  if (!envServidor.RESEND_API_KEY) return;

  const linhas = [
    `Nome: ${lead.nome}`,
    lead.email ? `E-mail: ${lead.email}` : null,
    lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : null,
    lead.tipoProjeto ? `Tipo de projeto: ${lead.tipoProjeto}` : null,
    `Origem: ${lead.origem}`,
    "",
    lead.mensagem ?? "(sem mensagem)",
    "",
    `Painel: ${env.NEXT_PUBLIC_SITE_URL}/admin`,
  ].filter((linha) => linha !== null);

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${envServidor.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "persona.lize <onboarding@resend.dev>",
        to: [envServidor.ADMIN_EMAIL],
        reply_to: lead.email ?? undefined,
        subject: `Lead novo: ${lead.nome}`,
        text: linhas.join("\n"),
      }),
    });

    if (!resposta.ok) {
      console.error("Resend recusou o aviso de lead:", resposta.status, await resposta.text());
    }
  } catch (erro) {
    console.error("Nao consegui avisar sobre o lead novo:", erro);
  }
}
