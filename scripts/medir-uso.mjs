/*
  Leitura pura: mede quanto o banco e o storage ja ocupam, para comparar com os
  limites do plano gratis do Supabase. Nao altera nada.

    node scripts/medir-uso.mjs
*/

import { readFile } from "node:fs/promises";
import pg from "pg";

const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((linha) => linha.includes("=") && !linha.trim().startsWith("#"))
    .map((linha) => {
      const corte = linha.indexOf("=");
      return [linha.slice(0, corte).trim(), linha.slice(corte + 1).trim()];
    }),
);

const cliente = new pg.Client({
  host: `db.${env.SUPABASE_PROJECT_REF}.supabase.co`,
  port: 5432,
  user: "postgres",
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

await cliente.connect();

const tamanhoBanco = await cliente.query(
  `select pg_size_pretty(pg_database_size(current_database())) as pretty,
          pg_database_size(current_database()) as bytes`,
);
console.log("== BANCO ==");
console.log(`total: ${tamanhoBanco.rows[0].pretty} (${tamanhoBanco.rows[0].bytes} bytes)\n`);

const porTabela = await cliente.query(`
  select n.nspname as schema,
         c.relname as tabela,
         pg_size_pretty(pg_total_relation_size(c.oid)) as tamanho,
         pg_total_relation_size(c.oid) as bytes,
         coalesce(s.n_live_tup, 0) as linhas
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_stat_user_tables s on s.relid = c.oid
   where c.relkind = 'r'
     and n.nspname in ('public','auth','storage')
   order by pg_total_relation_size(c.oid) desc
   limit 25
`);
console.log("== MAIORES TABELAS ==");
for (const r of porTabela.rows) {
  console.log(`${r.tamanho.padStart(9)}  ${String(r.linhas).padStart(7)} linhas  ${r.schema}.${r.tabela}`);
}

console.log("\n== STORAGE (buckets) ==");
const buckets = await cliente.query(`
  select b.id as bucket,
         count(o.id) as arquivos,
         pg_size_pretty(coalesce(sum((o.metadata->>'size')::bigint), 0)) as tamanho,
         coalesce(sum((o.metadata->>'size')::bigint), 0) as bytes
    from storage.buckets b
    left join storage.objects o on o.bucket_id = b.id
   group by b.id
   order by bytes desc
`);
for (const r of buckets.rows) {
  console.log(`${r.tamanho.padStart(9)}  ${String(r.arquivos).padStart(4)} arquivos  ${r.bucket}`);
}

console.log("\n== CONTAGEM ==");
const contagens = await cliente.query(`
  select 'leads' as tabela, count(*) from public.leads
  union all select 'rascunhos', count(*) from public.rascunhos
`);
for (const r of contagens.rows) {
  console.log(`${String(r.count).padStart(6)}  ${r.tabela}`);
}

await cliente.end();
