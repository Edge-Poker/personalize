import { z } from "zod";

/**
 * Variaveis que podem chegar ao navegador. So NEXT_PUBLIC_ entra aqui.
 * Nenhum segredo neste arquivo, nunca.
 */
const esquema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

// Precisa ser acesso literal a process.env.NEXT_PUBLIC_*, senao o Next nao
// substitui o valor no bundle do cliente.
const resultado = esquema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!resultado.success) {
  const faltando = resultado.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Faltam variaveis de ambiente: ${faltando}. Copie .env.example para .env.local e preencha.`,
  );
}

export const env = resultado.data;
