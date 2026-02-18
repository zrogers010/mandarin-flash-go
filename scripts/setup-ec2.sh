#!/usr/bin/env bash
#
# One-time EC2 server provisioning for MandarinFlash.
# Run as root (or with sudo) on a fresh Ubuntu 22.04 / Amazon Linux 2023 instance.
#
set -euo pipefail

echo "=== MandarinFlash EC2 Setup ==="

# ---------- Detect distro ----------
if command -v apt-get &>/dev/null; then
    PKG_MGR="apt"
elif command -v dnf &>/dev/null; then
    PKG_MGR="dnf"
else
    echo "Unsupported package manager. Use Ubuntu 22.04 or Amazon Linux 2023."
    exit 1
fi

# ---------- System updates ----------
echo "[1/6] Updating system packages..."
if [ "$PKG_MGR" = "apt" ]; then
    apt-get update -y && apt-get upgrade -y
else
    dnf update -y
fi

# ---------- Install Docker ----------
echo "[2/6] Installing Docker..."
if ! command -v docker &>/dev/null; then
    if [ "$PKG_MGR" = "apt" ]; then
        apt-get install -y ca-certificates curl gnupg
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
          https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
          > /etc/apt/sources.list.d/docker.list
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    else
        dnf install -y docker
        systemctl start docker
    fi
    systemctl enable docker
    echo "  Docker installed."
else
    echo "  Docker already installed."
fi

# ---------- Install Docker Compose (standalone, if plugin not available) ----------
echo "[3/6] Verifying Docker Compose..."
if docker compose version &>/dev/null; then
    echo "  Docker Compose plugin available."
elif command -v docker-compose &>/dev/null; then
    echo "  docker-compose standalone available."
else
    echo "  Installing Docker Compose standalone..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d'"' -f4)
    curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "  Docker Compose ${COMPOSE_VERSION} installed."
fi

# ---------- Create deploy user ----------
echo "[4/6] Creating deploy user..."
if ! id -u deploy &>/dev/null 2>&1; then
    useradd -m -s /bin/bash -G docker deploy
    mkdir -p /home/deploy/.ssh
    if [ -f /root/.ssh/authorized_keys ]; then
        cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
    elif [ -f /home/ubuntu/.ssh/authorized_keys ]; then
        cp /home/ubuntu/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
    elif [ -f /home/ec2-user/.ssh/authorized_keys ]; then
        cp /home/ec2-user/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
    fi
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
    echo "  User 'deploy' created and added to docker group."
else
    usermod -aG docker deploy 2>/dev/null || true
    echo "  User 'deploy' already exists."
fi

# ---------- Firewall ----------
echo "[5/6] Configuring firewall..."
if command -v ufw &>/dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp comment "SSH"
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    ufw --force enable
    echo "  UFW configured (22, 80, 443 open)."
elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo "  firewalld configured (SSH, HTTP, HTTPS open)."
else
    echo "  No firewall tool found. Ensure AWS Security Group allows only 22, 80, 443."
fi

# ---------- Docker log rotation ----------
echo "[6/6] Configuring Docker log rotation..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

# ---------- Create app directory ----------
APP_DIR="/home/deploy/mandarinflash"
mkdir -p "$APP_DIR"
chown deploy:deploy "$APP_DIR"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. SSH in as the deploy user:  ssh deploy@<your-ip>"
echo "  2. Clone the repo:  cd ~/mandarinflash && git clone <repo-url> ."
echo "  3. Create .env file with production values"
echo "  4. Run scripts/init-ssl.sh to obtain SSL certificate"
echo "  5. Run scripts/deploy.sh to build and start the app"
