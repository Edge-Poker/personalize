#!/usr/bin/env node
/**
 * Testa, no banco de verdade, se a RLS faz o que as migrations prometem.
 *
 * Nao le pg_tables: le o comportamento. Uma policy pode existir e estar errada,
 * e o que importa e o que o visitante anonimo consegue de fato puxar. Cada
 * linha aqui e uma afirmacao do README posta a prova.
 *
 *   node scripts/checar-acesso.mjs
 */

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonimo = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const servico = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let falhas = 0;

function conferir(descricao, passou, detalhe = "") {
  if (!passou) falhas += 1;
  console.log(`${passou ? "ok   " : "FALHA"} ${descricao}${detalhe ? `  (${detalhe})` : ""}`);
}

// --- as tabelas existem? -----------------------------------------------------
const TABELAS = [
  "admins",
  "site_settings",
  "nav_items",
  "pages",
  "sections",
  "services",
  "projects",
  "testimonials",
  "media",
  "rascunhos",
  "leads",
  "proposals",
  "rate_limit",
];

console.log("\nExistencia das tabelas\n");
let faltando = 0;
for (const tabela of TABELAS) {
  /*
    Select de verdade, com limite 1, e nao head:true.
    Com head:true o supabase-js nao devolve o corpo do erro, entao tabela
    inexistente vinha sem `error` e a checagem dava ok para tudo - um verde
    falso, que e pior do que nao ter checagem nenhuma.
  */
  const { error } = await servico.from(tabela).select("*").limit(1);
  const existe = error === null;
  if (!existe) faltando += 1;
  conferir(tabela, existe, error ? `${error.code}: ${error.message}` : "");
}

if (faltando > 0) {
  console.log(`\n${faltando} tabelas faltando. As migrations nao foram aplicadas.`);
  process.exit(1);
}

// --- leitura publica ---------------------------------------------------------
console.log("\nO que o visitante anonimo enxerga\n");

const publicas = [
  ["services", 4],
  ["projects", 3],
  ["nav_items", 4],
  ["site_settings", 4], // marca, contato, seo, textos
];

for (const [tabela, esperado] of publicas) {
  const { data, error } = await anonimo.from(tabela).select("*");
  conferir(
    `${tabela}: le o publicado (${esperado} linhas)`,
    !error && (data?.length ?? 0) === esperado,
    error ? error.message : `veio ${data?.length ?? 0}`,
  );
}

// --- o que ele NAO pode enxergar --------------------------------------------
console.log("\nO que o visitante anonimo nao pode enxergar\n");

const fechadas = ["leads", "proposals", "rascunhos", "rate_limit", "admins"];

for (const tabela of fechadas) {
  const { data, error } = await anonimo.from(tabela).select("*");
  // Vazio ou erro, os dois servem: o que nao pode e vir linha.
  conferir(
    `${tabela}: nao devolve nada`,
    (data?.length ?? 0) === 0,
    error ? `bloqueado: ${error.code ?? error.message}` : `${data?.length ?? 0} linhas`,
  );
}

// --- escrita direta tem de ser recusada -------------------------------------
console.log("\nEscrita direta pelo anonimo\n");

const { error: erroLead } = await anonimo
  .from("leads")
  .insert({ nome: "teste rls", email: "rls@exemplo.com" });
conferir("insert direto em leads e recusado", erroLead !== null, erroLead?.code ?? "passou!");

/*
  UPDATE bloqueado por RLS nao levanta erro.
  O USING da policy filtra as linhas antes, entao o comando afeta zero linhas -
  e zero linhas afetadas e sucesso, nao falha. So o INSERT viola WITH CHECK e
  devolve 42501.

  Por isso a asercao aqui e sobre quantas linhas voltaram do `.select()`, e nao
  sobre a presenca de erro. Medir o erro daria falha onde a protecao funciona,
  que foi o que este script fez na primeira execucao contra o banco real.
*/
const { data: afetadas, error: erroServico } = await anonimo
  .from("services")
  .update({ titulo: "invadido" })
  .eq("slug", "portfolio-profissional")
  .select("id");

conferir(
  "update em services nao altera nada",
  (afetadas?.length ?? 0) === 0,
  erroServico ? `bloqueado: ${erroServico.code}` : `${afetadas?.length ?? 0} linhas alteradas`,
);

const { error: erroAdmin } = await anonimo
  .from("admins")
  .insert({ user_id: "00000000-0000-0000-0000-000000000000" });
conferir("insert em admins e recusado", erroAdmin !== null, erroAdmin?.code ?? "passou!");

// --- os caminhos que o anonimo PODE usar ------------------------------------
console.log("\nAs portas que o anonimo pode usar\n");

const { data: lead, error: erroRpc } = await anonimo.rpc("registrar_lead", {
  p_nome: "Teste automatizado",
  p_email: "teste-automatizado@exemplo.com",
  p_origem: "contato",
  p_mensagem: "Lead criado pelo checar-acesso.mjs.",
});
conferir(
  "rpc registrar_lead cria lead",
  !erroRpc && Boolean(lead?.id),
  erroRpc?.message ?? "criado",
);

const { data: proposta } = await anonimo.rpc("proposta_por_token", {
  p_slug: "nao-existe",
  p_token: "token-errado",
});
conferir("proposta_por_token com token errado devolve nada", proposta === null);

// Limpa o lead de teste para nao sujar o painel.
if (lead?.id) {
  await servico.from("leads").delete().eq("id", lead.id);
  console.log("\n(lead de teste apagado)");
}

console.log(falhas === 0 ? "\nTudo passou.\n" : `\n${falhas} falhas.\n`);
process.exit(falhas === 0 ? 0 : 1);
