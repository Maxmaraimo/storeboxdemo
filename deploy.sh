#!/bin/bash

# ==============================================================================
# STOREBOX AUTO-DEPLOY SCRIPT FOR UBUNTU 24.04 (PYTHON / DJANGO / GUNICORN / NGINX)
# IP: 176.96.243.203
# ==============================================================================

set -e

echo "=========================================="
echo "🚀 Starting StoreBox Production Deployment"
echo "=========================================="

# 1. Detect project path
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$PROJECT_DIR" = "/" ] || [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR="/home/ubuntu/storebox"
fi
echo "📂 Project Directory: $PROJECT_DIR"

# 2. Detect service user
if [ -n "$SUDO_USER" ] && [ "$SUDO_USER" != "root" ]; then
    RUN_USER="$SUDO_USER"
elif [ -d "/home/ubuntu" ]; then
    RUN_USER="ubuntu"
else
    RUN_USER="$(whoami)"
fi
echo "👤 Service Run User: $RUN_USER"

# 3. Update system & install required packages
echo "📦 Installing system packages (Python 3, Nginx, SQLite, build tools)..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    sqlite3 \
    nginx \
    curl \
    git \
    ufw

# 4. Create and activate Python virtual environment
cd "$PROJECT_DIR"

if [ ! -d "venv" ]; then
    echo "🐍 Creating Python 3 virtual environment..."
    python3 -m venv venv
fi

echo "📥 Installing / updating Python dependencies..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# 5. Ensure .env exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating production .env file..."
    cat << 'ENVEOF' > .env
DEBUG=False
SECRET_KEY=django-insecure-0s7_r4)^z7a@68q4r^)ue2%logi%7^s92ltyzcok5^p#t51
PLATFORM_DOMAIN=storebox.uz
CSRF_TRUSTED_ORIGINS=http://176.96.243.203,https://176.96.243.203,http://storebox.uz,https://storebox.uz
ENVEOF
fi

# 6. Apply database migrations & collect static files
echo "🗄️ Applying Django database migrations..."
./venv/bin/python manage.py migrate --noinput

echo "🎨 Collecting static files for Nginx..."
mkdir -p static staticfiles media media/yespos_cache .cache
./venv/bin/python manage.py collectstatic --noinput

# 7. Set correct permissions for SQLite, media & cache
echo "🔒 Configuring filesystem permissions..."
sudo chown -R "$RUN_USER":www-data "$PROJECT_DIR"
sudo chmod 775 "$PROJECT_DIR"
sudo chmod -R 775 "$PROJECT_DIR/media" "$PROJECT_DIR/staticfiles" "$PROJECT_DIR/.cache"
if [ -f "$PROJECT_DIR/db.sqlite3" ]; then
    sudo chmod 664 "$PROJECT_DIR/db.sqlite3"
fi

# 8. Configure Systemd Service for Gunicorn
echo "⚙️ Configuring Gunicorn systemd service..."
sudo bash -c "cat << 'SVCEOF' > /etc/systemd/system/storebox.service
[Unit]
Description=StoreBox Django Gunicorn Web Server
After=network.target

[Service]
User=$RUN_USER
Group=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/venv/bin/gunicorn \\
          --workers 3 \\
          --bind 127.0.0.1:8000 \\
          --timeout 120 \\
          --access-logfile $PROJECT_DIR/gunicorn-access.log \\
          --error-logfile $PROJECT_DIR/gunicorn-error.log \\
          storebox.wsgi:application
Restart=always
RestartSec=3
EnvironmentFile=-$PROJECT_DIR/.env

[Install]
WantedBy=multi-user.target
SVCEOF"

# Optional: Telegram Bot worker service
echo "🤖 Configuring Telegram bot polling service..."
sudo bash -c "cat << 'BOTEOF' > /etc/systemd/system/storebox-bot.service
[Unit]
Description=StoreBox Telegram Bot Polling Worker
After=network.target storebox.service

[Service]
User=$RUN_USER
Group=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/venv/bin/python manage.py run_telegram_bot
Restart=always
RestartSec=5
EnvironmentFile=-$PROJECT_DIR/.env

[Install]
WantedBy=multi-user.target
BOTEOF"

sudo systemctl daemon-reload
sudo systemctl enable storebox
sudo systemctl restart storebox
sudo systemctl enable storebox-bot || true
sudo systemctl restart storebox-bot || true

# 9. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx reverse proxy & media/static routing..."
sudo bash -c "cat << 'NGXEOF' > /etc/nginx/sites-available/storebox
server {
    listen 80;
    server_name 176.96.243.203 storebox.uz *.storebox.uz _;

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Static files
    location /static/ {
        alias $PROJECT_DIR/staticfiles/;
        expires 30d;
        add_header Cache-Control \"public, max-age=2592000\";
        access_log off;
    }

    # Media files (Product photos, category icons, YES POS sync)
    location /media/ {
        alias $PROJECT_DIR/media/;
        expires 30d;
        add_header Cache-Control \"public, max-age=2592000\";
        access_log off;
    }

    # Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_redirect off;
    }
}
NGXEOF"

# Enable site in Nginx
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/storebox /etc/nginx/sites-enabled/storebox

# Test & Restart Nginx
echo "🔍 Validating Nginx configuration..."
sudo nginx -t
sudo systemctl restart nginx

# 10. Configure Firewall
if command -v ufw &> /dev/null; then
    echo "🛡️ Configuring UFW firewall rules..."
    sudo ufw allow 80/tcp || true
    sudo ufw allow 443/tcp || true
    sudo ufw allow 22/tcp || true
fi

echo ""
echo "=========================================================="
echo "🎉 StoreBox successfully deployed to Ubuntu 24.04!"
echo "🌐 Website URL: http://176.96.243.203/"
echo "📊 Web Service: sudo systemctl status storebox"
echo "🤖 Bot Service: sudo systemctl status storebox-bot"
echo "📜 Web Logs:    tail -f $PROJECT_DIR/gunicorn-error.log"
echo "=========================================================="
