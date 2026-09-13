#!/usr/bin/env bash
#
# Sobe as variaveis que o app precisa para o projeto do Vercel.
#
# Roda a partir da raiz do projeto, com a pasta ja vinculada (vercel link).
#
#   bash scripts/subir-env-vercel.sh
#
# Como funciona: le cada valor do .env.local e manda por pipe para o
# `vercel env add`. Nenhum valor aparece na tela nem fica em arquivo
# intermediario — o que se imprime aqui e so o nome da variavel e o resultado.
#
# A lista e branca de proposito. So sobe o que lib/env.ts e lib/env.server.ts
# realmente exigem. Fica de fora, deliberadamente:
#
#   SUPABASE_DB_PASSWORD   so os scripts locais usam (aplicar-migration.mjs).
#   SUPABASE_PROJECT_REF   idem. A senha do banco nao tem motivo para estar
#                          num servidor de build.
#   VERCEL_OIDC_TOKEN      o proprio `vercel link` escreve isso no .env.local;
#                          e credencial de maquina, nao configuracao do app.
#
# NEXT_PUBLIC_SITE_URL e o unico caso especial: no .env.local ele aponta para
# localhost, que e o certo para desenvolver e o errado para producao. O valor
# de producao vem do primeiro argumento, ou do padrao abaixo.

set -euo pipefail

SITE_URL="${1:-https://personalize-edge-poker.vercel.app}"
ENV_FILE=".env.local"
AMBIENTES="production,preview,development"

# As unicas que sobem. RESEND_API_KEY e opcional no schema: se faltar, o site
# roda e so nao avisa de lead nova.
OBRIGATORIAS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY ADMIN_EMAIL"
OPCIONAIS="RESEND_API_KEY"

if [ ! -f "$ENV_FILE" ]; then
  echo "nao achei $ENV_FILE — rode a partir da raiz do projeto." >&2
  exit 1
fi

ler() {
  # Primeira ocorrencia, tudo depois do primeiro '='; tira aspas em volta.
  local v
  v="$(grep -m1 "^$1=" "$ENV_FILE" | cut -d= -f2- || true)"
  v="${v%\"}"; v="${v#\"}"
  printf '%s' "$v"
}

subir() {
  local chave="$1" valor="$2" sensivel="$3"
  # O valor vai por stdin, e nunca em --value: argumento de linha de comando
  # aparece no `ps` e no historico do shell. --force sobrescreve o que ja
  # existir, o que deixa este script poder rodar de novo sem limpar antes.
  if printf '%s' "$valor" \
    | npx --yes vercel@latest env add "$chave" "$AMBIENTES" "$sensivel" --force >/dev/null 2>&1; then
    echo "  $chave -> $AMBIENTES (${#valor} caracteres, $sensivel)"
  else
    echo "  ERRO ao subir $chave" >&2
    return 1
  fi
}

echo "subindo variaveis para o projeto vinculado:"

for chave in $OBRIGATORIAS; do
  valor="$(ler "$chave")"
  if [ -z "$valor" ]; then
    echo "  ERRO: $chave esta vazia no $ENV_FILE" >&2
    exit 1
  fi
  # Tudo que comeca com NEXT_PUBLIC_ e gravado no pacote que vai para o
  # navegador — ja e publico por construcao. Guardar como Config em vez de
  # Secret nao expoe nada novo e deixa o valor legivel depois, que e o que
  # permite conferir um deploy sem adivinhar.
  case "$chave" in
    NEXT_PUBLIC_*) subir "$chave" "$valor" "--no-sensitive" ;;
    *)             subir "$chave" "$valor" "--sensitive" ;;
  esac
done

# O caso especial.
subir "NEXT_PUBLIC_SITE_URL" "$SITE_URL" "--no-sensitive"

for chave in $OPCIONAIS; do
  valor="$(ler "$chave")"
  if [ -z "$valor" ]; then
    echo "  $chave: ausente no $ENV_FILE — pulando (e opcional)"
  else
    subir "$chave" "$valor" "--sensitive"
  fi
done

echo ""
echo "pronto. confira os nomes com: npx vercel env ls"
