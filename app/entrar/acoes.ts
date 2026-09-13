"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoLogin = { erro?: string };

const esquema = z.object({
  email: z.string().trim().email("Esse e-mail nao parece certo."),
  senha: z.string().min(8, "A senha tem pelo menos 8 caracteres."),
  proximo: z.string().optional(),
  // Campo isca. Fica escondido para gente e visivel para robo.
  site: z.string().max(0).optional(),
});

/**
 * So aceita caminho interno. Sem isso, ?proximo=https://site-falso vira
 * redirect aberto - a pessoa entra no painel de verdade e sai numa pagina
 * que nao e minha.
 *
 * O cast e inevitavel: typedRoutes valida rota escrita a mao, e este valor
 * chega da query string. A validacao acima e o que faz o cast ser seguro.
 */
function destinoSeguro(valor: string | undefined): Route {
  if (!valor) return "/admin";
  if (!valor.startsWith("/")) return "/admin";
  if (valor.startsWith("//") || valor.includes("\\")) return "/admin";
  return valor as Route;
}

export async function entrar(
  _anterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const analise = esquema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
    proximo: formData.get("proximo") ?? undefined,
    site: formData.get("site") ?? undefined,
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Confira os campos." };
  }

  const { email, senha, proximo } = analise.data;
  const supabase = await criarClienteServidor();

  // Freio por e-mail: 10 tentativas por 15 minutos. Nao substitui o limite do
  // proprio Supabase, mas corta forca bruta antes de chegar la.
  const { data: dentroDoLimite } = await supabase.rpc("checar_rate_limit", {
    p_chave: `login:${email.toLowerCase()}`,
    p_limite: 10,
    p_janela_segundos: 900,
  });

  if (dentroDoLimite === false) {
    return { erro: "Muitas tentativas seguidas. Espere 15 minutos e tente de novo." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    // Mensagem unica para senha errada e e-mail inexistente. Duas mensagens
    // diferentes contam para o atacante quais e-mails existem.
    return { erro: "E-mail ou senha nao conferem." };
  }

  // Autorizacao no banco. Estar autenticado nao e estar autorizado: a conta
  // precisa constar em admins, e quem responde isso e a RLS.
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { erro: "Essa conta nao tem acesso ao painel." };
  }

  redirect(destinoSeguro(proximo));
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
