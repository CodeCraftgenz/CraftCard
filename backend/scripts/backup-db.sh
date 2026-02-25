#!/bin/bash
# Database backup script for CraftCard
# Usage: DB_USER=xxx DB_PASS=xxx ./scripts/backup-db.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

DB_HOST="${DB_HOST:-srv1889.hstgr.io}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-u984096926_db_cardCraft}"
DB_USER="${DB_USER:?DB_USER is required}"
DB_PASS="${DB_PASS:?DB_PASS is required}"

BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

echo "[backup] Starting backup of ${DB_NAME} at $(date)"
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
  --single-transaction --routines --triggers \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[backup] Done: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
echo "[backup] Cleanup complete, keeping last 7 backups"
