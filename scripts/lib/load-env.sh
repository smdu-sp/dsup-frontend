#!/usr/bin/env bash
# Carrega e exporta as variáveis de um arquivo .env para o shell atual.
# Uso: source scripts/lib/load-env.sh [arquivo_env]
#
# Feito em Node (via dotenv) em vez de parse manual em bash porque valores
# com aspas/caracteres especiais (comum em senha de banco) quebram parsers
# bash ingênuos. Cada linha impressa é "CHAVE='valor-com-aspas-escapadas'",
# que o `source` abaixo interpreta como atribuição comum.

LOAD_ENV_FILE="${1:-.env}"

if [ ! -f "$LOAD_ENV_FILE" ]; then
  echo "ERRO: arquivo de ambiente '$LOAD_ENV_FILE' não encontrado." >&2
  exit 1
fi

# Importante: este arquivo é sempre usado via `source`, então roda no mesmo
# shell de quem chamou. Por isso NÃO reusa nomes de variável comuns como
# SCRIPT_DIR/ENV_FILE aqui — isso já quebrou o script que chama (sobrescrevia
# o SCRIPT_DIR do caller com o diretório deste arquivo). O caminho do
# print-env.mjs é calculado inline, sem variável, de propósito.
set -a
# shellcheck disable=SC1090
source <(node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/print-env.mjs" "$LOAD_ENV_FILE")
set +a
unset LOAD_ENV_FILE

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERRO: DATABASE_URL não definida em '${1:-.env}'." >&2
  exit 1
fi
