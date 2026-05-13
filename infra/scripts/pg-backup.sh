#!/usr/bin/env bash
# =====================================================================
# Mawared Postgres backup → R2/S3.
#
# Usage:
#   DATABASE_URL=postgresql://... \
#   S3_ENDPOINT=https://<acct>.r2.cloudflarestorage.com \
#   S3_BUCKET=mawared-prod-backups \
#   S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... \
#   ./infra/scripts/pg-backup.sh
#
# Output: pg_<env>_<UTC-timestamp>.dump.gz under s3://$S3_BUCKET/postgres/
# Schedule daily via Railway cron / GitHub Actions / k8s CronJob.
#
# Retention: keep 14 dailies + 8 weeklies + 12 monthlies via S3 lifecycle.
# =====================================================================

set -euo pipefail

: "${DATABASE_URL:?must set DATABASE_URL}"
: "${S3_ENDPOINT:?must set S3_ENDPOINT}"
: "${S3_BUCKET:?must set S3_BUCKET}"
: "${S3_ACCESS_KEY_ID:?must set S3_ACCESS_KEY_ID}"
: "${S3_SECRET_ACCESS_KEY:?must set S3_SECRET_ACCESS_KEY}"

ENV_LABEL="${ENV_LABEL:-prod}"
TS=$(date -u +%Y%m%dT%H%M%SZ)
FILE="pg_${ENV_LABEL}_${TS}.dump.gz"
TMP="/tmp/${FILE}"

echo "[backup] dumping → ${TMP}"
pg_dump --format=custom --compress=0 --no-owner --no-acl "$DATABASE_URL" \
  | gzip --fast --rsyncable \
  > "$TMP"

SIZE=$(stat -c %s "$TMP" 2>/dev/null || stat -f %z "$TMP")
echo "[backup] size: $SIZE bytes"

if [ "$SIZE" -lt 4096 ]; then
  echo "[backup] dump suspiciously small (<4KB) — aborting upload"
  rm -f "$TMP"
  exit 1
fi

# AWS CLI works against R2 with explicit endpoint-url.
export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="${S3_REGION:-auto}"

KEY="postgres/${ENV_LABEL}/${FILE}"
echo "[backup] uploading → s3://${S3_BUCKET}/${KEY}"
aws s3 cp "$TMP" "s3://${S3_BUCKET}/${KEY}" \
  --endpoint-url "$S3_ENDPOINT" \
  --no-progress \
  --metadata "env=${ENV_LABEL},timestamp=${TS}"

rm -f "$TMP"
echo "[backup] done"
