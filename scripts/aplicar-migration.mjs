/*
  Aplica um arquivo de migration no banco.

  O projeto nao tem psql nem a CLI do Supabase, e supabase-js nao executa DDL —
  ele fala com o PostgREST, que so enxerga tabelas e funcoes. Entao aqui e
  conexao direta com o Postgres, com a senha que ja esta no .env.local.

  O ensaio e real, e nao uma leitura otimista do arquivo:

    node scripts/aplicar-migration.mjs 0014_briefing.sql            -> roda e desfaz
    node scripts/aplicar-migration.mjs 0014_briefing.sql --gravar   -> roda e mantem

  Nos dois casos o arquivo inteiro roda dentro de uma transacao, contra o schema
  de verdade. A diferenca e o fim: ROLLBACK ou COMMIT. Ou seja, o ensaio executa
  cada comando e descobre erro de coluna que nao existe, constraint que nao bate
  com dado gravado, funcao com assinatura errada — e depois desfaz tudo.

  Transacao tambem e o que impede meia migration: se o decimo comando falhar, os
  nove anteriores voltam atras.
*/

import { readFile } from "node:fs/promises";
import pg from "pg";

const arquivo = process.argv[2];
const gravar = process.argv.includes("--gravar");

if (!arquivo) {
  console.error("uso: node scripts/aplicar-migration.mjs <arquivo.sql> [--gravar]");
  process.exit(1);
}

const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((linha) => linha.includes("=") && !linha.trim().startsWith("#"))
    .map((linha) => {
      const corte = linha.indexOf("=");
      return [linha.slice(0, corte).trim(), linha.slice(corte + 1).trim()];
    }),
);

const sql = await readFile(new URL(`../supabase/migrations/${arquivo}`, import.meta.url), "utf8");

const cliente = new pg.Client({
  host: `db.${env.SUPABASE_PROJECT_REF}.supabase.co`,
  port: 5432,
  user: "postgres",
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  // O certificado do Supabase e de uma CA propria. A conexao continua cifrada;
  // o que se abre mao aqui e da verificacao da cadeia, num script que roda na
  // maquina do dono do banco.
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

await cliente.connect();
console.log(`conectado. aplicando ${arquivo} (${sql.length} caracteres)\n`);

try {
  await cliente.query("begin");
  await cliente.query(sql);

  if (gravar) {
    await cliente.query("commit");
    console.log("COMMIT — migration aplicada.");
  } else {
    await cliente.query("rollback");
    console.log("ensaio: rodou inteira sem erro, e foi desfeita.");
    console.log("rode com --gravar para manter.");
  }
} catch (erro) {
  await cliente.query("rollback").catch(() => {});
  console.error("ERRO — nada foi aplicado.");
  console.error(`  ${erro.message}`);
  if (erro.position) console.error(`  posicao ${erro.position} do arquivo`);
  if (erro.detail) console.error(`  detalhe: ${erro.detail}`);
  if (erro.hint) console.error(`  dica: ${erro.hint}`);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
