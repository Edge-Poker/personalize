// Le a secao do heroi e imprime o que a capa vai mostrar.
//
// Usa a chave anonima de proposito: se esta consulta funciona, e porque a RLS
// deixa o visitante ler — ou seja, e exatamente o que o site publico enxerga.
//
//   node scripts/ver-capa.mjs

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const linha of (await readFile(".env.local", "utf8")).split("\n")) {
  const i = linha.indexOf("=");
  if (i > 0 && !linha.startsWith("#")) env[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const { data: pagina, error: erroPagina } = await supabase
  .from("pages").select("id").eq("slug", "home").single();

if (erroPagina) {
  console.error("nao achei a pagina home:", erroPagina.message);
  process.exit(1);
}

const { data, error } = await supabase
  .from("sections").select("dados").eq("page_id", pagina.id).eq("tipo", "heroi").single();

if (error) {
  console.error("nao achei o heroi:", error.message);
  process.exit(1);
}

const d = data.dados ?? {};
const acoes = Array.isArray(d.acoes) ? d.acoes : [];

console.log("rotulo :", JSON.stringify(d.nota ?? "(vazio - usa o padrao do codigo)"));
console.log("frase  :", JSON.stringify(d.titulo ?? "(faltando)"));
console.log("pilulas:", acoes.length, acoes.map((a) => a.rotulo).join(", ") || "(nenhuma)");
console.log("email  :", d.email ? d.email : "(vazio - a pilula de copiar nao aparece)");
console.log("video  :", d.video ?? "(nenhum - a capa usa o fundo desenhado)");
console.log();
/*
  A conferencia olha para a ESTRUTURA, e nao para o texto.

  A primeira versao testava se o titulo comecava com "Que bom" — a frase que a
  migration escreveu. Deu falso negativo assim que o dono editou a capa pelo
  site, que e exatamente o que ele deve fazer. Teste que quebra quando o
  cliente usa o produto esta testando a coisa errada.
*/
const faltando = [];
if (!d.video) faltando.push("video");
if (!d.titulo) faltando.push("titulo (a frase da capa)");
if (!d.nota) faltando.push("nota (o rotulo desfocado)");
if (acoes.length === 0) faltando.push("acoes (as pilulas)");

if (faltando.length) {
  console.log("=> INCOMPLETO. falta:", faltando.join(", "));
} else {
  console.log("=> a capa esta completa");
}
