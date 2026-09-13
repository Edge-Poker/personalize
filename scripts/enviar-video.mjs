// Sobe um arquivo grande para o bucket `midia`.
//
// O upload de imagem do site passa pelo navegador (lib/enviar-imagem.ts), que
// converte para WebP antes de mandar. Video nao passa por ali: e grande demais
// para o caminho do formulario e nao tem conversao a fazer. Entao vai por aqui,
// uma vez, com a service key — que nunca sai deste processo.
//
//   node scripts/enviar-video.mjs <arquivo> [nome-no-bucket]

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";

function lerEnv() {
  return readFile(".env.local", "utf8").then((texto) => {
    const env = {};
    for (const linha of texto.split("\n")) {
      const igual = linha.indexOf("=");
      if (igual < 1 || linha.startsWith("#")) continue;
      env[linha.slice(0, igual).trim()] = linha.slice(igual + 1).trim();
    }
    return env;
  });
}

const [arquivo, nomeDado] = process.argv.slice(2);
if (!arquivo) {
  console.error("uso: node scripts/enviar-video.mjs <arquivo> [nome-no-bucket]");
  process.exit(1);
}

const env = await lerEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const chave = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !chave) {
  console.error("faltou NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const conteudo = await readFile(arquivo);
const destino = `capa/${nomeDado ?? basename(arquivo)}`;

const supabase = createClient(url, chave, { auth: { persistSession: false } });

const { error } = await supabase.storage.from("midia").upload(destino, conteudo, {
  contentType: "video/mp4",
  // Um ano de cache: o arquivo e imutavel; trocar o video significa trocar o
  // nome, e nao sobrescrever o mesmo caminho e torcer para o CDN perceber.
  cacheControl: "31536000",
  upsert: true,
});

if (error) {
  console.error("falhou:", error.message);
  process.exit(1);
}

const { data } = supabase.storage.from("midia").getPublicUrl(destino);
console.log("enviado:", destino, `(${(conteudo.length / 1048576).toFixed(2)} MB)`);
console.log("url:", data.publicUrl);
