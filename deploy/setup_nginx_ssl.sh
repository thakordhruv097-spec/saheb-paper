#!/bin/bash
# ==============================================================================
# Saheb Paper ERP: VPS Automated Nginx & Certbot SSL Setup Script
# Target OS: Ubuntu 22.04 / 24.04 LTS (Hostinger KVM VPS)
# ==============================================================================

set -e

echo "🚀 Starting Saheb Paper ERP Nginx & HTTPS Setup..."

# 1. Update packages and install Nginx & Certbot
echo "📦 Installing Nginx and Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx ufw

# 2. Configure Firewall
echo "🛡️ Configuring Firewall..."
sudo ufw allow 'OpenSSH'
sudo ufw allow 'Nginx Full' # Allows both Port 80 (HTTP) and Port 443 (HTTPS)
sudo ufw --force enable

# 3. Create Web Root Directory
echo "📁 Setting up /var/www/saheb-paper..."
sudo mkdir -p /var/www/saheb-paper/dist
sudo chown -R $USER:$USER /var/www/saheb-paper

# 4. Copy Nginx Configuration
if [ -f "./deploy/nginx.conf" ]; then
    echo "⚙️ Copying Nginx configuration..."
    sudo cp ./deploy/nginx.conf /etc/nginx/sites-available/saheb-paper
    sudo ln -sf /etc/nginx/sites-available/saheb-paper /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
else
    echo "⚠️ ./deploy/nginx.conf not found. Please place the nginx config in /etc/nginx/sites-available/saheb-paper."
fi

# 5. Test Nginx Configuration
echo "🔍 Testing Nginx syntax..."
sudo nginx -t

# 6. Restart Nginx
echo "🔄 Reloading Nginx service..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=================================================================="
echo "✅ Nginx is now running and reverse proxying to Port 8000!"
echo ""
echo "👉 Next: To generate free Let's Encrypt SSL certificate, run:"
echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo "=================================================================="
