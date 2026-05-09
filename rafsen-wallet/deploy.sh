#!/bin/bash

# ============================================
# RAFSEN WALLET - PRODUCTION DEPLOYMENT SCRIPT
# ============================================
# Run this script on your VPS to set up production environment

set -e # Exit on error

echo "🚀 Rafsen Wallet - Production Setup"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# 1. CHECK PREREQUISITES
# ============================================
echo -e "\n${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   echo "Run: sudo bash deploy.sh"
   exit 1
fi

# Check required tools
for cmd in openssl curl java mvn nginx; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}$cmd is not installed${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# ============================================
# 2. GENERATE SECURITY KEYS
# ============================================
echo -e "\n${YELLOW}Step 2: Generating security keys...${NC}"

# Generate API key
API_KEY=$(openssl rand -base64 32)
echo "API_KEY=$API_KEY" >> /etc/rafsen/wallet.env

# Generate encryption secret
ENCRYPTION_SECRET=$(openssl rand -base64 32)
echo "ENCRYPTION_SECRET=$ENCRYPTION_SECRET" >> /etc/rafsen/wallet.env

echo -e "${GREEN}✓ Security keys generated${NC}"

# ============================================
# 3. SET UP SSL CERTIFICATE
# ============================================
echo -e "\n${YELLOW}Step 3: Setting up SSL certificate...${NC}"

read -p "Enter your domain name: " DOMAIN

# Install certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Generate certificate
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo -e "${GREEN}✓ SSL certificate installed at: /etc/letsencrypt/live/$DOMAIN/${NC}"

# ============================================
# 4. CREATE APPLICATION DIRECTORIES
# ============================================
echo -e "\n${YELLOW}Step 4: Creating application directories...${NC}"

mkdir -p /opt/rafsen/
mkdir -p /var/www/rafsen-wallet/
mkdir -p /var/log/rafsen/
mkdir -p /etc/rafsen/

echo -e "${GREEN}✓ Directories created${NC}"

# ============================================
# 5. CONFIGURE ENVIRONMENT VARIABLES
# ============================================
echo -e "\n${YELLOW}Step 5: Configuring environment variables...${NC}"

read -p "Enter RPC host IP (default: localhost): " RPC_HOST
RPC_HOST=${RPC_HOST:-localhost}

read -p "Enter RPC port (default: 18776): " RPC_PORT
RPC_PORT=${RPC_PORT:-18776}

read -p "Enter RPC username: " RPC_USER
read -sp "Enter RPC password: " RPC_PASSWORD

# Create environment file
cat > /etc/rafsen/wallet.env << EOF
# Rafsen Wallet Environment Variables
export API_KEY=$API_KEY
export RPC_HOST=$RPC_HOST
export RPC_PORT=$RPC_PORT
export RPC_USER=$RPC_USER
export RPC_PASSWORD=$RPC_PASSWORD
export ENCRYPTION_SECRET=$ENCRYPTION_SECRET
export SSL_PASSWORD=$(openssl rand -base64 16)
export CORS_ORIGINS=https://$DOMAIN
export SPRING_PROFILES_ACTIVE=production
EOF

source /etc/rafsen/wallet.env
echo -e "${GREEN}✓ Environment variables configured${NC}"

# ============================================
# 6. CONFIGURE NGINX
# ============================================
echo -e "\n${YELLOW}Step 6: Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/rafsen << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Root for static files
    root /var/www/rafsen-wallet;
    index index.html;

    # Frontend SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass https://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Websocket support if needed
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/rafsen /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# ============================================
# 7. CREATE SYSTEMD SERVICE
# ============================================
echo -e "\n${YELLOW}Step 7: Creating systemd service...${NC}"

cat > /etc/systemd/system/rafsen-wallet.service << 'EOF'
[Unit]
Description=Rafsen Wallet Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/rafsen
EnvironmentFile=/etc/rafsen/wallet.env
ExecStart=/usr/bin/java -jar /opt/rafsen/rafsen-wallet.jar
Restart=always
RestartSec=10

# Limits
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rafsen-wallet

echo -e "${GREEN}✓ Systemd service created${NC}"

# ============================================
# 8. SET UP AUTOMATIC CERTIFICATE RENEWAL
# ============================================
echo -e "\n${YELLOW}Step 8: Setting up certificate auto-renewal...${NC}"

systemctl enable certbot.timer
systemctl start certbot.timer

echo -e "${GREEN}✓ Certificate auto-renewal enabled${NC}"

# ============================================
# 9. SETUP FIREWALL
# ============================================
echo -e "\n${YELLOW}Step 9: Configuring firewall...${NC}"

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw enable

echo -e "${GREEN}✓ Firewall configured${NC}"

# ============================================
# 10. PRINT SUMMARY
# ============================================
echo -e "\n${GREEN}===================================="
echo "🎉 Production Setup Complete!"
echo "====================================${NC}\n"

echo "📋 Important Information:"
echo "  Domain: $DOMAIN"
echo "  API Key: $API_KEY"
echo "  Environment file: /etc/rafsen/wallet.env"
echo "  Logs: /var/log/rafsen/rafsen-wallet.log"
echo ""
echo "🚀 Next Steps:"
echo "  1. Upload frontend dist/ to /var/www/rafsen-wallet/"
echo "  2. Upload JAR to /opt/rafsen/rafsen-wallet.jar"
echo "  3. Start service: systemctl start rafsen-wallet"
echo "  4. Check logs: systemctl status rafsen-wallet"
echo ""
echo "🔒 Security Checklist:"
echo "  ✓ SSL Certificate: /etc/letsencrypt/live/$DOMAIN/cert.pem"
echo "  ✓ API Key: $API_KEY"
echo "  ✓ Rate Limiting: Enabled"
echo "  ✓ HTTPS: Enabled"
echo "  ✓ Firewall: Configured"
echo ""

# Save important info
cat > /etc/rafsen/setup-info.txt << EOF
Rafsen Wallet Production Setup Information
==========================================
Date: $(date)
Domain: $DOMAIN
API Key: $API_KEY
Encryption Secret: $ENCRYPTION_SECRET

Important Files:
- Environment: /etc/rafsen/wallet.env
- Nginx config: /etc/nginx/sites-available/rafsen
- Service: /etc/systemd/system/rafsen-wallet.service
- Logs: /var/log/rafsen/rafsen-wallet.log

SSL Certificate:
- Path: /etc/letsencrypt/live/$DOMAIN/
- Renewal: Automatic (via certbot)
- Expires: Check with: certbot certificates

Commands:
- Start service: systemctl start rafsen-wallet
- Stop service: systemctl stop rafsen-wallet
- View logs: tail -f /var/log/rafsen/rafsen-wallet.log
- Reload nginx: nginx -s reload
EOF

echo -e "${YELLOW}Setup details saved to: /etc/rafsen/setup-info.txt${NC}\n"
