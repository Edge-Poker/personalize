/*
  Corrige o registro do caso do Bernardo em `projects`.

  O conteudo do site mora no Supabase, entao mexer no arquivo de semente nao
  muda o que esta no ar — `0008_semente.sql` termina em `on conflict do nothing`
  e so vale para um banco vazio. Este script fala com o banco de verdade.

  Roda em dois passos, e o primeiro nunca escreve:

    node scripts/caso-bernardo.mjs          -> le, mostra o antes/depois, salva backup
    node scripts/caso-bernardo.mjs --gravar -> aplica

  O backup da linha inteira fica em /tmp antes de qualquer escrita.
*/

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const SLUG_ANTIGO = "eduardo-cantelli";
const BACKUP = "/tmp/backup-eduardo-cantelli.json";

/*
  A narrativa e do Pedro; os detalhes tecnicos foram conferidos no codigo.

  "Elementos 3D" virou a descricao exata do que esta la: uma roda de fotos que
  gira em CSS puro — perspective 1500px, cartoes em rotateY(i * 72deg)
  translateZ(...), volta completa em 46s, cada quadro com frente e verso via
  backface-visibility. Sem three.js e sem WebGL. Num portfolio que vende
  trabalho tecnico, dizer "3D" quando e CSS e vender menos do que se fez; dizer
  "three.js" quando nao e seria mentir.

  Os nomes das galerias saem do site no ar: Editorial, Character, Expressao e
  Digital/Polaroid.
*/
const NOVO = {
  slug: "bernardo-cantelli",
  cliente: "Bernardo Cantelli",
  papel: "Portfólio de modelo",
  ano: 2026,
  resumo:
    "Portfólio de modelo com abertura em roda 3D, galerias por categoria e troca das fotos pela própria página.",
  pedido:
    "Um portfólio de verdade, para mandar quando uma empresa pedisse para ver o trabalho dele. Quase nenhum modelo tem um — e era exatamente por isso que ele queria.",
  problema:
    "O que existia era o Instagram. As empresas pediam o material e recebiam um perfil: mesma grade, mesmo formato e mesma cara de todo mundo que faz o mesmo trabalho. Não faltava foto. Faltava um lugar que fizesse aquelas fotos parecerem profissionais.",
  decisao:
    "A abertura virou uma roda de fotos girando em 3D, com frente e verso, feita só em CSS. Portfólio de modelo costuma ser grade parada; quem abre este entende em dois segundos que tem alguém cuidando do próprio material. Atrás da abertura as fotos ficam separadas por categoria — Editorial, Character, Expressão e Digital/Polaroid — e ele troca todas pela própria página, sem precisar me chamar.",
  mudou:
    "De várias versões que eu mesmo descartei para a primeira que eu achei boa o bastante para entregar.",
  resultado:
    "O site está no ar com as quatro galerias, e ele passou a mandar um endereço em vez de um perfil. As empresas que pediram o material se impressionaram.",
  tags: ["portfólio", "3D em CSS", "edição pelo site"],
};

function lerEnv() {
  const texto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const pares = texto
    .split("\n")
    .filter((linha) => linha.includes("=") && !linha.trim().startsWith("#"))
    .map((linha) => {
      const corte = linha.indexOf("=");
      return [linha.slice(0, corte).trim(), linha.slice(corte + 1).trim()];
    });
  return Object.fromEntries(pares);
}

const env = lerEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: atual, error: erroLeitura } = await db
  .from("projects")
  .select("*")
  .eq("slug", SLUG_ANTIGO)
  .maybeSingle();

if (erroLeitura) {
  console.error("erro ao ler:", erroLeitura.message);
  process.exit(1);
}

if (!atual) {
  console.error(`nenhuma linha com slug "${SLUG_ANTIGO}" — ja foi aplicado?`);
  process.exit(1);
}

writeFileSync(BACKUP, JSON.stringify(atual, null, 2));
console.log(`backup da linha inteira: ${BACKUP}\n`);

for (const campo of Object.keys(NOVO)) {
  const de = JSON.stringify(atual[campo]);
  const para = JSON.stringify(NOVO[campo]);
  if (de === para) continue;
  console.log(`${campo}:`);
  console.log(`   de   ${de}`);
  console.log(`   para ${para}\n`);
}

if (!process.argv.includes("--gravar")) {
  console.log("nada foi escrito. rode com --gravar para aplicar.");
  process.exit(0);
}

const { error: erroEscrita } = await db.from("projects").update(NOVO).eq("id", atual.id);

if (erroEscrita) {
  console.error("erro ao gravar:", erroEscrita.message);
  process.exit(1);
}

console.log("aplicado.");
