import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/lib/types/database";

/**
 * Cliente para Server Components, Server Actions e Route Handlers.
 * Usa a chave anon, entao toda consulta continua passando pela RLS.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(paraGravar) {
          try {
            for (const { name, value, options } of paraGravar) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component nao pode gravar cookie. O middleware ja renova a
            // sessao a cada request, entao aqui da para ignorar sem perder nada.
          }
        },
      },
    },
  );
}

/**
 * Usuario da sessao atual, ou null.
 * Sempre getUser(), nunca getSession(): getSession le o cookie sem validar a
 * assinatura no servidor de auth, e cookie da para forjar.
 */
export async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** true se o usuario logado esta na tabela admins. Checagem no banco, nao na UI. */
export async function ehAdmin() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data !== null;
}
