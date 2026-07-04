#!/usr/bin/env bash
# Pre-deploy smoke test: Postgres + MinIO + API + worker, health check, inline clone.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting Postgres + MinIO"
docker compose up -d postgres minio

echo "==> Waiting for Postgres"
for i in $(seq 1 30); do
  docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 2
done

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/ditto_site}"
npm run db:migrate

echo "==> Building and starting API + worker (profile app)"
docker compose --profile app up -d --build api worker

echo "==> Waiting for API health"
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8787/healthz >/dev/null 2>&1; then
    echo "API healthy"
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    echo "API failed to become healthy" >&2
    docker compose --profile app logs api
    exit 1
  fi
done

echo "==> Pattern catalog endpoint"
PATTERNS=$(curl -sf http://127.0.0.1:8787/v1/patterns)
node -e "const j=JSON.parse(process.argv[1]); if(j.total<100) process.exit(1); console.log('patterns:', j.total, 'v'+j.version);" "$PATTERNS"

echo "==> Enqueue clone job (example.com)"
JOB=$(curl -sf -X POST http://127.0.0.1:8787/v1/clones \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com/","options":{"mode":"single","qualityTier":"draft","verify":false}}')
JOB_ID=$(node -e "console.log(JSON.parse(process.argv[1]).jobId)" "$JOB")
echo "jobId: $JOB_ID"

for i in $(seq 1 120); do
  STATUS=$(curl -sf "http://127.0.0.1:8787/v1/clones/$JOB_ID" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).status))")
  if [ "$STATUS" = "succeeded" ]; then
    echo "Clone succeeded"
    curl -sf "http://127.0.0.1:8787/v1/clones/$JOB_ID/result" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d); console.log('files:', Object.keys(j.files||{}).length);})"
    echo "==> Smoke test passed"
    exit 0
  fi
  if [ "$STATUS" = "failed" ]; then
    echo "Clone failed" >&2
    curl -sf "http://127.0.0.1:8787/v1/clones/$JOB_ID" | head -c 2000
    exit 1
  fi
  sleep 3
done

echo "Clone timed out" >&2
exit 1
