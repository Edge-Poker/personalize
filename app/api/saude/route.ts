import { NextResponse } from "next/server";
import { criarClientePublico } from "@/lib/supabase/publico";

/**
 * Batida de saude — existe para manter o Postgres do Supabase acordado.
 *
 * O plano gratis do Supabase hiberna o projeto apos 7 dias sem nenhuma
 * requisicao ao banco, e um projeto pausado precisa ser religado a mao no
 * painel. As paginas do site sao ISR (revalidate = 3600): elas so consultam o
 * banco quando alguem acessa depois do cache expirar. Sem visita, sem consulta,
 * e o relogio dos 7 dias corre.
 *
 * O cron do Vercel (vercel.json) bate aqui uma vez por dia. Uma batida diaria
 * contra uma janela de 7 dias tem folga de sobra. A consulta abaixo e de
 * proposito a mais barata que toca o Postgres: um unico id, sem payload.
 *
 * force-dynamic para o Next nunca servir isto do cache — uma batida cacheada
 * nao chegaria ao banco, e ai nao serviria para nada.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = criarClientePublico();

  const inicio = Date.now();
  const { error } = await supabase.from("sections").select("id").limit(1);
  const ms = Date.now() - inicio;

  if (error) {
    return NextResponse.json({ ok: false, erro: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, ms });
}
