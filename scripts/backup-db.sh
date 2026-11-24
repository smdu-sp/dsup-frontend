#!/usr/bin/env bash
# Gera um backup (mysqldump + gzip) do banco apontado por DATABASE_URL.
#
# Uso: bash scripts/backup-db.sh [arquivo_env] [diretorio_backup]
#   arquivo_env:      padrão ".env"
#   diretorio_backup: padrão "backups"
#
# Ao final, grava o caminho do arquivo gerado em "<diretorio_backup>/.last-backup"
# e também o imprime em stdout (última linha), para outros scripts consumirem.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

ENV_FILE="${1:-.env}"
BACKUP_DIR="${2:-backups}"

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "ERRO: 'mysqldump' não encontrado no PATH. Instale o pacote mysql-client (ou equivalente) antes de continuar." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$SCRIPT_DIR/lib/load-env.sh" "$ENV_FILE"
# shellcheck disable=SC1090
source <(node "$SCRIPT_DIR/lib/db-url-parts.mjs")

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "==> Gerando backup de '$DB_NAME' ($DB_HOST:$DB_PORT) em $BACKUP_FILE" >&2
MYSQL_PWD="$DB_PASS" mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

# Validações básicas: o arquivo não pode ficar vazio, o gzip tem que ser
# válido, e o conteúdo tem que de fato parecer um dump do MySQL — qualquer
# uma dessas falhas indica um backup inútil e a migration não deve seguir.
if [ ! -s "$BACKUP_FILE" ]; then
  echo "ERRO: o backup gerado está vazio. Abortando." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "ERRO: o arquivo de backup está corrompido (gzip inválido)." >&2
  exit 1
fi

if ! zgrep -q -- "-- MySQL dump" "$BACKUP_FILE"; then
  echo "ERRO: o conteúdo do backup não parece ser um dump válido do MySQL." >&2
  exit 1
fi

echo "$BACKUP_FILE" > "$BACKUP_DIR/.last-backup"
echo "==> Backup OK: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))" >&2
echo "$BACKUP_FILE"
