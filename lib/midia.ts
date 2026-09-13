import { env } from "@/lib/env";

/**
 * Caminho no Storage vira URL pública.
 *
 * O bucket `midia` é público de propósito: são as imagens do site, e servir
 * por URL assinada obrigaria a renderização a ser dinâmica só por causa disso.
 * O que protege não é o segredo da URL, é a policy de escrita.
 */
export function urlDaMidia(path: string): string {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/midia/${path}`;
}
