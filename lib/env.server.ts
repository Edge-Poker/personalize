import "server-only";
import { z } from "zod";

/**
 * Segredos. O import de "server-only" faz o build quebrar se algum arquivo de
 * cliente importar isto, em vez de vazar a chave silenciosamente.
 */
const esquema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ADMIN_EMAIL: z.string().email(),
  RESEND_API_KEY: z.string().optional(),
});

const resultado = esquema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});

if (!resultado.success) {
  const faltando = resultado.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Faltam variaveis de ambiente do servidor: ${faltando}.`);
}

export const envServidor = resultado.data;
