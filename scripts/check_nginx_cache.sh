#!/usr/bin/env bash
# Verify SPA cache headers: HTML/index must revalidate; hashed /assets/* stay
# immutable; security headers survive nested add_header.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROD="$ROOT/frontend/nginx.prod.conf"
DEV="$ROOT/frontend/nginx.conf"

fail() { echo "FAIL: $*" >&2; exit 1; }

for conf in "$PROD" "$DEV"; do
  grep -q 'location = /index.html' "$conf" || fail "$conf missing location = /index.html"
  grep -q 'location \^~ /assets/' "$conf" || fail "$conf missing location ^~ /assets/"
  grep -q 'Cache-Control "no-cache, must-revalidate"' "$conf" || fail "$conf missing HTML no-cache"
  grep -q 'Cache-Control "public, max-age=31536000, immutable"' "$conf" || fail "$conf missing hashed-asset immutable cache"
done

# Prod must keep HSTS + CSP in the HTML and /assets/ locations (includes).
grep -q 'include /etc/nginx/hsts.conf' "$PROD" || fail "prod missing HSTS include"
grep -q 'include /etc/nginx/security-headers.conf' "$PROD" || fail "prod missing security-headers include"

echo "Config text checks passed."

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not available — skip live curl check."
  echo "Verify by hand after deploy:"
  echo "  curl -sI https://mandarinflash.com/"
  echo "  curl -sI https://mandarinflash.com/index.html"
  echo "  curl -sI https://mandarinflash.com/review"
  echo "  curl -sI https://mandarinflash.com/assets/<hashed>.js"
  exit 0
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
mkdir -p "$WORKDIR/html/assets" "$WORKDIR/conf"
cp "$DEV" "$WORKDIR/conf/nginx.conf"
cp "$ROOT/frontend/nginx-includes/security-headers-http.conf" "$WORKDIR/conf/"
printf '<!doctype html><title>spa</title>' > "$WORKDIR/html/index.html"
printf 'console.log(1)' > "$WORKDIR/html/assets/x.js"

# nginx:alpine image already has mime.types at /etc/nginx/mime.types.
# Mount our config as the main file and the include next to it.
CID="$(docker run -d --rm \
  -v "$WORKDIR/conf/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$WORKDIR/conf/security-headers-http.conf:/etc/nginx/security-headers-http.conf:ro" \
  -v "$WORKDIR/html:/usr/share/nginx/html:ro" \
  -p 18080:80 \
  nginx:alpine)"

cleanup_docker() {
  docker rm -f "$CID" >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup_docker EXIT

for i in $(seq 1 20); do
  if curl -sf -o /dev/null http://127.0.0.1:18080/health 2>/dev/null || curl -sf -o /dev/null http://127.0.0.1:18080/ >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

check_headers() {
  local path="$1"
  local expect_cache="$2"
  local headers
  headers="$(curl -sI "http://127.0.0.1:18080$path")"
  echo "---- $path ----"
  echo "$headers"
  echo "$headers" | grep -qi "cache-control: ${expect_cache}" \
    || fail "$path missing Cache-Control: $expect_cache"
  echo "$headers" | grep -qi "content-security-policy:" \
    || fail "$path missing Content-Security-Policy"
  echo "$headers" | grep -qi "x-content-type-options: nosniff" \
    || fail "$path missing X-Content-Type-Options"
  echo "$headers" | grep -qi "referrer-policy: strict-origin-when-cross-origin" \
    || fail "$path missing Referrer-Policy"
}

check_headers "/" "no-cache, must-revalidate"
check_headers "/index.html" "no-cache, must-revalidate"
check_headers "/some/spa/route" "no-cache, must-revalidate"
check_headers "/assets/x.js" "public, max-age=31536000, immutable"

echo "✅ nginx cache + security header checks passed."
