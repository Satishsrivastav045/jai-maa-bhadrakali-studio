#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/jai-maa-bhadrakali-studio"
ENV_FILE="/etc/jai-maa-studio.env"

sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo mkdir -p "$APP_DIR/backend/data" "$APP_DIR/frontend/assets/uploads"
sudo chown -R "$USER":"$USER" "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  sudo tee "$ENV_FILE" >/dev/null <<'EOF'
PORT=8000
ADMIN_USER=admin
ADMIN_PASSWORD=CHANGE_THIS_TO_A_LONG_RANDOM_PASSWORD
EOF
  sudo chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE. Edit ADMIN_PASSWORD before starting the app."
fi

sudo cp deploy/oracle/jai-maa-studio.service /etc/systemd/system/jai-maa-studio.service
sudo systemctl daemon-reload
sudo systemctl enable jai-maa-studio
sudo systemctl restart jai-maa-studio

echo "Node app is running on 127.0.0.1:8000. Next configure Nginx and HTTPS using deploy/oracle/nginx.conf.template."
