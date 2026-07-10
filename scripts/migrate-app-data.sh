#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DIRECT_URL:?SUPABASE_DIRECT_URL is required}"
: "${DATABASE_URL_DIRECT:?DATABASE_URL_DIRECT is required}"

dump_file="$(mktemp -t dynasty-app-data.XXXXXX.dump)"
trap 'rm -f "$dump_file"' EXIT

pg_dump \
  --data-only \
  --format=custom \
  --no-owner \
  --no-privileges \
  --table=public.leads \
  --table=public.app_settings \
  --table=public.email_suppressions \
  --dbname="$SUPABASE_DIRECT_URL" \
  --file="$dump_file"

psql "$DATABASE_URL_DIRECT" \
  --set=ON_ERROR_STOP=1 \
  --command='TRUNCATE TABLE public.leads, public.app_settings, public.email_suppressions;'

pg_restore \
  --data-only \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  --dbname="$DATABASE_URL_DIRECT" \
  "$dump_file"

echo "Application-table data copy completed. Run: pnpm db:reconcile"
