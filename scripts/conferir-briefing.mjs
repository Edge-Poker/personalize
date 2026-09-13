/* Confere o que a 0014 deixou no banco. So leitura. */
import { readFile } from "node:fs/promises";
import pg from "pg";

const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const c = l.indexOf("=");
      return [l.slice(0, c).trim(), l.slice(c + 1).trim()];
    }),
);

const cliente = new pg.Client({
  host: `db.${env.SUPABASE_PROJECT_REF}.supabase.co`,
  port: 5432,
  user: "postgres",
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await cliente.connect();

const tabelas = await cliente.query(`
  select table_name
    from information_schema.tables
   where table_schema = 'public' and table_name like 'briefing_%'
   order by table_name
`);
console.log("tabelas novas:", tabelas.rows.map((r) => r.table_name).join(", ") || "(nenhuma)");

const colunas = await cliente.query(`
  select column_name
    from information_schema.columns
   where table_schema = 'public' and table_name = 'leads'
     and column_name in ('direcao_visual', 'temperamento')
   order by column_name
`);
console.log("colunas em leads:", colunas.rows.map((r) => r.column_name).join(", "));

const status = await cliente.query(`
  select pg_get_constraintdef(oid) as def
    from pg_constraint
   where conrelid = 'public.leads'::regclass and conname = 'leads_status_check'
`);
console.log("check de status:", status.rows[0]?.def ?? "(ausente)");

const distrib = await cliente.query("select status, count(*)::int from public.leads group by status");
console.log("leads por status:", distrib.rows.length ? JSON.stringify(distrib.rows) : "(tabela vazia)");

const fn = await cliente.query(`
  select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('registrar_lead', 'briefing_por_token', 'atualizar_briefing')
   order by p.proname
`);
for (const f of fn.rows) console.log(`funcao ${f.proname}(${f.args.split(", ").length} args)`);

await cliente.end();
