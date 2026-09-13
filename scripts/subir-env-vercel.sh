#!/usr/bin/env bash
#
# Sobe as variaveis do .env.local para o projeto do Vercel, de uma vez.
#
# Roda DEPOIS de:
#   npx vercel login     (login no navegador — so voce faz isso)
#   npx vercel link      (vincula esta pasta a um projeto do Vercel)
#
# Uso:
#   bash scripts/subir-env-vercel.sh production
#   bash scripts/subir-env-vercel.sh preview
#
# Le cada linha CHAVE=valor do .env.local e manda para o Vercel. Se a variavel
# ja existir naquele ambiente, remove e recria (pra poder rodar de novo sem dar
# erro). Os valores saem daqui direto para o seu Vercel — nao passam por mais
# lugar nenhum.

set -euo pipefail

AMBIENTE="${1:-production}"
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "nao achei $ENV_FILE — rode a partir da raiz do projeto." >&2
  exit 1
fi

# PASTA_BUILD e coisa de build local; nao vai pro Vercel.
IGNORAR="PASTA_BUILD"

while IFS= read -r linha || [ -n "$linha" ]; do
  # pula vazias e comentarios
  case "$linha" in
    ''|'#'*) continue ;;
  esac
  # so linhas CHAVE=valor
  case "$linha" in
    *=*) : ;;
    *) continue ;;
  esac

  chave="${linha%%=*}"
  valor="${linha#*=}"
  # tira aspas em volta, se houver
  valor="${valor%\"}"; valor="${valor#\"}"

  case " $IGNORAR " in *" $chave "*) echo "pulando $chave"; continue ;; esac

  echo "-> $chave ($AMBIENTE)"
  # remove se ja existe (silencioso), depois adiciona
  npx vercel env rm "$chave" "$AMBIENTE" --yes >/dev/null 2>&1 || true
  printf '%s' "$valor" | npx vercel env add "$chave" "$AMBIENTE" >/dev/null
done < "$ENV_FILE"

echo ""
echo "pronto. as variaveis estao no ambiente '$AMBIENTE' do Vercel."
echo "confira com: npx vercel env ls"
