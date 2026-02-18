#!/usr/bin/env bash
#
# First-time SSL certificate setup with Let's Encrypt.
# Run from the project root directory.
#
# Prerequisites:
#   - DNS A record for your domain pointing to this server's IP
#   - Port 80 reachable from the internet
#   - .env file with DOMAIN set
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f .env ]; then
    echo "ERROR: .env file not found."
    exit 1
fi

source .env

DOMAIN="${DOMAIN:?Set DOMAIN in .env}"
EMAIL="${SUPPORT_EMAIL:-admin@$DOMAIN}"

CERTBOT_DIR="./certbot"
CERT_PATH="$CERTBOT_DIR/conf/live/$DOMAIN"

if [ -f "$CERT_PATH/fullchain.pem" ]; then
    echo "Certificate already exists for $DOMAIN."
    echo "To renew, run: docker compose -f docker-compose.prod.yml exec certbot certbot renew"
    exit 0
fi

echo "=== Obtaining SSL certificate for $DOMAIN ==="

mkdir -p "$CERTBOT_DIR/conf" "$CERTBOT_DIR/www"

# Stop any services using port 80
if docker compose version &>/dev/null 2>&1; then
    DC="docker compose"
else
    DC="docker-compose"
fi
$DC -f docker-compose.prod.yml down 2>/dev/null || true

echo "[1/3] Requesting certificate via standalone mode..."
docker run --rm \
    -p 80:80 \
    -v "$PWD/$CERTBOT_DIR/conf:/etc/letsencrypt" \
    -v "$PWD/$CERTBOT_DIR/www:/var/www/certbot" \
    certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    echo ""
    echo "ERROR: Certificate was not created. Common issues:"
    echo "  - DNS not pointing to this server yet"
    echo "  - Port 80 not reachable (check Security Group / firewall)"
    echo "  - Rate limit hit (wait and retry)"
    exit 1
fi

echo ""
echo "[2/3] Setting permissions..."
chmod -R 755 "$CERTBOT_DIR/conf"

echo "[3/3] Done."
echo ""
echo "=== SSL certificate obtained successfully ==="
echo "  Domain:  $DOMAIN"
echo "  Cert:    $CERT_PATH/fullchain.pem"
echo "  Key:     $CERT_PATH/privkey.pem"
echo ""
echo "Now run: ./scripts/deploy.sh"
