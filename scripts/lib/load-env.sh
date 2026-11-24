#!/usr/bin/env bash
# Carrega e exporta as variáveis de um arquivo .env para o shell atual.
# Uso: source scripts/lib/load-env.sh [arquivo_env]
#
# Feito em Node (via dotenv) em vez de parse manual em bash porque valores
# com aspas/caracteres especiais (comum em senha de banco) quebram parsers
# bash ingênuos. Cada linha impressa é "CHAVE='valor-com-aspas-escapadas'",
# que o `source` abaixo interpreta como atribuição comum.

ENV_FILE="${1:-.env}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: arquivo de ambiente '$ENV_FILE' não encontrado." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source <(node "$SCRIPT_DIR/print-env.mjs" "$ENV_FILE")
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERRO: DATABASE_URL não definida em '$ENV_FILE'." >&2
  exit 1
fi
