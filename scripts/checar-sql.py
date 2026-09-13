"""Passa as migrations pelo parser oficial do Postgres (libpg_query, via pglast).

Duas passadas, porque uma so nao basta:

1. parse_sql no arquivo inteiro - pega sintaxe de DDL. Mas o corpo de uma
   funcao plpgsql e so um literal de texto para o parser de SQL, entao um
   `if` sem `end if` passaria batido aqui.
2. parse_plpgsql em cada funcao plpgsql - ai sim o corpo e analisado.

Nao substitui rodar no banco: nao confere nome de coluna, nem tipo, nem se a
policy faz o que promete. Pega erro de sintaxe, que e o que mais custa tempo
quando aparece so na hora do deploy.

    pip install pglast
    npm run checar-sql
"""

import glob
import re
import sys

from pglast import parse_plpgsql, parse_sql
from pglast.parser import ParseError

# create [or replace] function ... $$ corpo $$;
FUNCAO = re.compile(
    r"create\s+(?:or\s+replace\s+)?function\b.*?\$\$.*?\$\$\s*;",
    re.IGNORECASE | re.DOTALL,
)

falhas = 0

for arquivo in sorted(glob.glob("supabase/migrations/*.sql")):
    with open(arquivo, encoding="utf-8") as f:
        sql = f.read()

    try:
        comandos = parse_sql(sql)
    except ParseError as erro:
        falhas += 1
        print(f"ERRO  {arquivo}: {erro}")
        continue

    plpgsql_ok = 0
    for corpo in FUNCAO.findall(sql):
        if not re.search(r"language\s+plpgsql", corpo, re.IGNORECASE):
            continue
        nome = re.search(r"function\s+([\w.]+)", corpo, re.IGNORECASE)
        try:
            parse_plpgsql(corpo)
            plpgsql_ok += 1
        except Exception as erro:  # noqa: BLE001 - parse_plpgsql levanta varios tipos
            falhas += 1
            print(f"ERRO  {arquivo} :: {nome.group(1) if nome else '?'}: {erro}")

    print(f"ok    {arquivo}  ({len(comandos)} comandos, {plpgsql_ok} funcoes plpgsql)")

sys.exit(1 if falhas else 0)
