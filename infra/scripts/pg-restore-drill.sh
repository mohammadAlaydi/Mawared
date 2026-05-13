#!/usr/bin/env bash
# =====================================================================
# Mawared Postgres restore drill.
#
# Pulls the most recent backup from R2/S3, restores it into a clean
# scratch database, runs sanity checks (row counts, latest order date).
#
# Run quarterly. CI workflow `infra/scripts/pg-restore-drill.yml` (M4+)
# can run this against a Postgres service container.
#
# Usage:
#   SCRATCH_DATABASE_URL=postgresql://... \  # empty DB to restore INTO
#   S3_ENDPOINT=... S3_BUCKET=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... \
#   ./infra/scripts/pg-restore-drill.sh
# =====================================================================

set -euo pipefail

: "${SCRATCH_DATABASE_URL:?must set SCRATCH_DATABASE_URL}"
: "${S3_ENDPOINT:?must set S3_ENDPOINT}"
: "${S3_BUCKET:?must set S3_BUCKET}"

ENV_LABEL="${ENV_LABEL:-prod}"
export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="${S3_REGION:-auto}"

echo "[restore] discovering latest backup for env=${ENV_LABEL}"
LATEST=$(aws s3 ls "s3://${S3_BUCKET}/postgres/${ENV_LABEL}/" \
  --endpoint-url "$S3_ENDPOINT" \
  | awk '{print $4}' \
  | sort \
  | tail -1)
if [ -z "$LATEST" ]; then
  echo "[restore] no backups found"
  exit 1
fi
echo "[restore] latest: ${LATEST}"

TMP="/tmp/restore-${LATEST}"
aws s3 cp "s3://${S3_BUCKET}/postgres/${ENV_LABEL}/${LATEST}" "$TMP" \
  --endpoint-url "$S3_ENDPOINT" \
  --no-progress

echo "[restore] decompressing + restoring → SCRATCH_DATABASE_URL"
gunzip -c "$TMP" | pg_restore --clean --if-exists --no-owner --no-acl \
  --dbname="$SCRATCH_DATABASE_URL"

echo "[restore] sanity checks"
psql "$SCRATCH_DATABASE_URL" <<'SQL'
\timing off
\pset format aligned
SELECT
  (SELECT COUNT(*) FROM "User")        AS users,
  (SELECT COUNT(*) FROM "Worker")      AS workers,
  (SELECT COUNT(*) FROM "Order")       AS orders,
  (SELECT COUNT(*) FROM "Contract")    AS contracts,
  (SELECT MAX("createdAt") FROM "Order") AS latest_order;
SQL

rm -f "$TMP"
echo "[restore] drill complete — review row counts above"
