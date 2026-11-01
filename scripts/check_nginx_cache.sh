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

# Probe from inside the container so CI does not depend on published ports.
# wget -S prints response headers on stderr.
docker run --rm \
  --add-host backend:127.0.0.1 \
  -v "$WORKDIR/conf/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$WORKDIR/conf/security-headers-http.conf:/etc/nginx/security-headers-http.conf:ro" \
  -v "$WORKDIR/html:/usr/share/nginx/html:ro" \
  nginx:alpine \
  sh -c '
    set -eu
    nginx -t
    nginx
    sleep 0.3
    fetch() {
      if command -v wget >/dev/null 2>&1; then
        wget -S -O /dev/null "$1" 2>&1 || true
      else
        apk add --no-cache curl >/dev/null
        curl -sI "$1"
      fi
    }
    check() {
      path="$1"
      expect="$2"
      echo "---- $path ----"
      headers="$(fetch "http://127.0.0.1$path")"
      echo "$headers"
      echo "$headers" | grep -qi "Cache-Control: $expect" || {
        echo "FAIL: $path missing Cache-Control: $expect" >&2
        exit 1
      }
      echo "$headers" | grep -qi "Content-Security-Policy:" || {
        echo "FAIL: $path missing Content-Security-Policy" >&2
        exit 1
      }
      echo "$headers" | grep -qi "X-Content-Type-Options: nosniff" || {
        echo "FAIL: $path missing X-Content-Type-Options" >&2
        exit 1
      }
      echo "$headers" | grep -qi "Referrer-Policy: strict-origin-when-cross-origin" || {
        echo "FAIL: $path missing Referrer-Policy" >&2
        exit 1
      }
    }
    check "/" "no-cache, must-revalidate"
    check "/index.html" "no-cache, must-revalidate"
    check "/some/spa/route" "no-cache, must-revalidate"
    check "/assets/x.js" "public, max-age=31536000, immutable"
  '

echo "✅ nginx cache + security header checks passed."
