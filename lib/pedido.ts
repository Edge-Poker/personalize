import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * IP de quem esta pedindo, olhando os cabecalhos que a Vercel escreve.
 * Devolve null quando nao da para saber - e melhor nao limitar do que limitar
 * a pessoa errada.
 */
export async function ipDoPedido(): Promise<string | null> {
  const cabecalhos = await headers();

  const encaminhado = cabecalhos.get("x-forwarded-for");
  if (encaminhado) {
    // x-forwarded-for e uma lista; o primeiro e o cliente original.
    const primeiro = encaminhado.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }

  return cabecalhos.get("x-real-ip");
}

/**
 * Chave de rate limit derivada do IP.
 *
 * Guardo o hash e nao o IP porque a tabela rate_limit nao precisa saber quem e
 * a pessoa - precisa saber se e a mesma de antes. Um hash resolve isso e nao
 * deixa endereco de ninguem parado no banco.
 */
export function chaveDeLimite(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
