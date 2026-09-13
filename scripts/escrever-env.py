"""Monta o .env.local a partir das chaves do projeto Supabase.

Existe para as chaves irem do CLI direto para o arquivo, sem passar por
terminal, por historico de shell nem por transcricao de conversa. O script nao
imprime valor nenhum - so diz quais chaves gravou e quantos caracteres tinham,
o que basta para conferir que nao veio vazio.

    npx supabase projects api-keys --project-ref <ref> -o json \\
      | python3 scripts/escrever-env.py <ref>
"""

import json
import os
import sys

ref = sys.argv[1]
chaves = {k.get("name"): k.get("api_key") for k in json.load(sys.stdin)}

anon = chaves.get("anon")
service = chaves.get("service_role")

if not anon or not service:
    print("Nao achei anon e service_role na resposta do CLI.", file=sys.stderr)
    raise SystemExit(1)

# O que ja estava no arquivo e preservado - a senha do banco, gerada antes,
# mora aqui e nao da para pedir de novo ao Supabase.
existente = {}
if os.path.exists(".env.local"):
    for linha in open(".env.local", encoding="utf-8"):
        if "=" in linha and not linha.lstrip().startswith("#"):
            nome, _, valor = linha.partition("=")
            existente[nome.strip()] = valor.strip()

valores = {
    "NEXT_PUBLIC_SUPABASE_URL": f"https://{ref}.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": anon,
    "SUPABASE_SERVICE_ROLE_KEY": service,
    "NEXT_PUBLIC_SITE_URL": existente.get("NEXT_PUBLIC_SITE_URL") or "http://localhost:3000",
    "ADMIN_EMAIL": existente.get("ADMIN_EMAIL") or "",
    "RESEND_API_KEY": existente.get("RESEND_API_KEY") or "",
    "SUPABASE_DB_PASSWORD": existente.get("SUPABASE_DB_PASSWORD") or "",
    "SUPABASE_PROJECT_REF": ref,
}

anterior = os.umask(0o077)
try:
    with open(".env.local", "w", encoding="utf-8") as arquivo:
        arquivo.write("# Gerado por scripts/escrever-env.py. Nao vai para o git.\n")
        for nome, valor in valores.items():
            arquivo.write(f"{nome}={valor}\n")
finally:
    os.umask(anterior)

os.chmod(".env.local", 0o600)

for nome, valor in valores.items():
    print(f"  {nome}: {len(valor)} chars" if valor else f"  {nome}: VAZIO")
