import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/types/database";

/**
 * Cliente sem cookie, para ler o conteudo do site publico.
 *
 * Por que nao usar o cliente de servidor aqui: ele le cookies(), e qualquer
 * rota que le cookie vira dinamica no Next. O site publico inteiro perderia
 * cache e a nota de performance junto.
 *
 * Sem cookie, a consulta chega ao Postgres como `anon`, e a RLS devolve
 * exatamente o que o publico pode ver - publicado e visivel. Ou seja: o mesmo
 * conteudo para todo mundo, que e justamente o que da para cachear.
 *
 * A previa de rascunho nao passa por aqui. Ela mora em /admin, com sessao.
 */
export function criarClientePublico() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
