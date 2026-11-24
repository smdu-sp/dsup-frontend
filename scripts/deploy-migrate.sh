#!/usr/bin/env bash
# Orquestra um deploy seguro de migrations do Prisma:
#   1. Backup do banco (mysqldump + gzip, validado)
#   2. npx prisma migrate deploy
#   3. Confirma que o schema ficou "up to date"
#   4. Roda checagens de integridade dos dados (scripts/verify-migration.mjs)
#
# Se qualquer etapa falhar, o script para imediatamente (set -e) e imprime
# o caminho do backup para restauração manual (scripts/restore-db.sh).
#
# Uso: bash scripts/deploy-migrate.sh [arquivo_env]
#   arquivo_env: padrão ".env"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

ENV_FILE="${1:-.env}"
BACKUP_DIR="backups"

echo "==> [1/4] Backup do banco"
BACKUP_FILE="$(bash "$SCRIPT_DIR/backup-db.sh" "$ENV_FILE" "$BACKUP_DIR")"

# A partir daqui o restante do script também precisa de DATABASE_URL no
# ambiente (prisma migrate deploy/status e verify-migration.mjs a usam).
# shellcheck disable=SC1090
source "$SCRIPT_DIR/lib/load-env.sh" "$ENV_FILE"

echo "==> [2/4] Aplicando migrations pendentes (prisma migrate deploy)"
if ! npx prisma migrate deploy; then
  echo "" >&2
  echo "ERRO: 'prisma migrate deploy' falhou." >&2
  echo "MySQL não garante DDL transacional — é possível que parte da migration" >&2
  echo "tenha sido aplicada. Se precisar reverter, use:" >&2
  echo "  bash scripts/restore-db.sh '$BACKUP_FILE' '$ENV_FILE'" >&2
  exit 1
fi

echo "==> [3/4] Confirmando status das migrations"
STATUS_OUTPUT="$(npx prisma migrate status)"
echo "$STATUS_OUTPUT"
if ! echo "$STATUS_OUTPUT" | grep -q "Database schema is up to date"; then
  echo "" >&2
  echo "ERRO: 'prisma migrate status' não confirmou que o schema está atualizado." >&2
  echo "Backup disponível em: $BACKUP_FILE" >&2
  exit 1
fi

echo "==> [4/4] Verificações de integridade dos dados"
if ! node "$SCRIPT_DIR/verify-migration.mjs"; then
  echo "" >&2
  echo "ERRO: verificações pós-migration falharam." >&2
  echo "Backup disponível em: $BACKUP_FILE" >&2
  echo "Para restaurar: bash scripts/restore-db.sh '$BACKUP_FILE' '$ENV_FILE'" >&2
  exit 1
fi

echo ""
echo "==> Deploy concluído com sucesso."
echo "    Backup salvo em: $BACKUP_FILE"
