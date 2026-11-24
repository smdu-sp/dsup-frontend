#!/usr/bin/env bash
# Restaura o banco a partir de um backup gerado por backup-db.sh/deploy-migrate.sh.
# Isso SOBRESCREVE todo o conteúdo atual do banco de destino.
#
# Uso: bash scripts/restore-db.sh <arquivo_backup.sql.gz> [arquivo_env] [--yes]
#   --yes (ou FORCE=1 no ambiente): pula a confirmação interativa.
#
# Sem argumento de arquivo, usa o último backup registrado em backups/.last-backup.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

FORCE="${FORCE:-0}"
ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--yes" ]; then
    FORCE=1
  else
    ARGS+=("$arg")
  fi
done

BACKUP_FILE="${ARGS[0]:-}"
ENV_FILE="${ARGS[1]:-.env}"

if [ -z "$BACKUP_FILE" ]; then
  if [ -f "backups/.last-backup" ]; then
    BACKUP_FILE="$(cat backups/.last-backup)"
    echo "Nenhum arquivo informado — usando o último backup: $BACKUP_FILE"
  else
    echo "ERRO: informe o arquivo de backup. Uso: bash scripts/restore-db.sh <arquivo.sql.gz> [arquivo_env] [--yes]" >&2
    exit 1
  fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERRO: backup '$BACKUP_FILE' não encontrado." >&2
  exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "ERRO: cliente 'mysql' não encontrado no PATH." >&2
  exit 1
fi

if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "ERRO: arquivo de backup corrompido (gzip inválido): $BACKUP_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$SCRIPT_DIR/lib/load-env.sh" "$ENV_FILE"
# shellcheck disable=SC1090
source <(node "$SCRIPT_DIR/lib/db-url-parts.mjs")

echo "!!! ATENÇÃO !!!"
echo "Isso vai SOBRESCREVER todo o conteúdo do banco '$DB_NAME' em $DB_HOST:$DB_PORT"
echo "com o backup: $BACKUP_FILE"
echo "Todos os dados atuais desse banco (gravados depois do backup) serão perdidos."
echo ""

if [ "$FORCE" != "1" ]; then
  read -r -p "Digite 'confirmo' para continuar: " resposta
  if [ "$resposta" != "confirmo" ]; then
    echo "Cancelado. Nenhuma alteração foi feita."
    exit 1
  fi
fi

echo "==> Restaurando $DB_NAME a partir de $BACKUP_FILE ..."
gunzip -c "$BACKUP_FILE" | MYSQL_PWD="$DB_PASS" mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  "$DB_NAME"

echo "==> Restauração concluída. Status das migrations após restaurar:"
npx prisma migrate status || true

echo ""
echo "Banco '$DB_NAME' restaurado a partir de: $BACKUP_FILE"
echo "Se o código já implantado espera um schema mais novo que o do backup,"
echo "faça o rollback do deploy da aplicação também (voltar para a versão"
echo "do código compatível com este backup) antes de liberar o tráfego."
