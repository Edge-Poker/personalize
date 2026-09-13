import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { envServidor } from "@/lib/env.server";
import type { Database } from "@/lib/types/database";

/**
 * Cliente com service_role. Ignora RLS por completo.
 *
 * Regra: so em Route Handler ou Server Action, e so quando nao ha jeito de
 * fazer pela chave anon. Hoje isso significa dois casos - o script que cria a
 * conta admin e o webhook de e-mail. Se aparecer um terceiro, e sinal de que
 * falta uma policy, nao de que falta service_role.
 */
export function criarClienteAdmin() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    envServidor.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
