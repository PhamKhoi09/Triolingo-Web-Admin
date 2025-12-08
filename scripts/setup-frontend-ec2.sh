#!/bin/bash

# ============================================
# Script Deploy Frontend Triolingo Web Admin
# ============================================
# Mục đích: Deploy một lần duy nhất lên EC2 Frontend
# Không dùng auto-deploy, chỉ chạy manual khi cần
#
# KIẾN TRÚC: Frontend EC2 → Nginx → proxy to Backend EC2
#
# YÊU CẦU:
# 1. EC2 Backend đã chạy (PM2) và có IP public
# 2. Security Group Backend đã mở port 5001 cho Frontend EC2
# 3. File nginx/triolingo.conf đã cập nhật đúng IP backend

set -e  # Exit nếu có lỗi

BACKEND_IP="98.94.144.216"  # ← CẬP NHẬT IP BACKEND CỦA BẠN Ở ĐÂY

echo "============================================"
echo "Deploy Frontend Triolingo Web Admin"
echo "============================================"
echo ""
echo "Backend IP: $BACKEND_IP:5001"
echo ""

# 1. Install Nginx
echo "[1/8] Cài đặt Nginx..."
if ! command -v nginx &> /dev/null; then
  sudo apt update
  sudo apt install -y nginx
  echo "✓ Nginx đã cài đặt"
else
  echo "✓ Nginx đã có sẵn"
fi

# 2. Install Node.js
echo ""
echo "[2/8] Kiểm tra Node.js và npm..."
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo "Đang cài Node.js 20.x LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "✓ Node.js: $(node -v)"
echo "✓ npm: $(npm -v)"

# 3. Tạo swap (quan trọng cho build)
echo ""
echo "[3/8] Cấu hình swap 2GB..."
if ! swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  echo "✓ Swap 2GB đã tạo"
else
  echo "✓ Swap đã tồn tại"
fi
free -h | grep Swap

# 4. Clone/Update repository
echo ""
echo "[4/8] Clone/Update repository..."
cd ~
if [ -d "Triolingo-Web-Admin" ]; then
  echo "Updating existing repo..."
  cd Triolingo-Web-Admin
  git fetch origin main
  git reset --hard origin/main
  git clean -fd
else
  git clone https://github.com/PhamKhoi09/Triolingo-Web-Admin.git
  cd Triolingo-Web-Admin
fi
echo "✓ Code đã update: $(git log -1 --oneline)"

# 5. Install dependencies + Build
echo ""
echo "[5/8] Installing dependencies..."
npm install --production=false
echo "✓ Dependencies installed"

echo ""
echo "[6/8] Building production (3-5 phút, CPU sẽ cao)..."
NODE_OPTIONS="--max-old-space-size=1536" npm run build
echo "✓ Build completed!"

# 6. Deploy files
echo ""
echo "[7/8] Deploy build files..."
sudo mkdir -p /var/www/triolingo-admin
sudo rm -rf /var/www/triolingo-admin/*
sudo cp -r build/* /var/www/triolingo-admin/
sudo chown -R www-data:www-data /var/www/triolingo-admin
sudo chmod -R 755 /var/www/triolingo-admin
echo "✓ Files deployed to /var/www/triolingo-admin"

# 7. Configure Nginx
echo ""
echo "[8/8] Cấu hình Nginx..."

# Xóa default config
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/default.bak

# Copy nginx config
sudo cp nginx/triolingo.conf /etc/nginx/sites-available/triolingo
sudo rm -f /etc/nginx/sites-enabled/triolingo
sudo ln -s /etc/nginx/sites-available/triolingo /etc/nginx/sites-enabled/triolingo

# Test và restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
echo "✓ Nginx configured và started"

# 8. Verify
echo ""
echo "============================================"
echo "✓ DEPLOYMENT HOÀN TẤT!"
echo "============================================"
FRONTEND_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "Frontend URL: http://$FRONTEND_IP"
echo "Backend API:  http://$BACKEND_IP:5001"
echo ""
echo "--- TEST CONNECTIVITY ---"
echo -n "Backend reachable: "
if curl -s -o /dev/null -w "%{http_code}" http://$BACKEND_IP:5001 2>/dev/null | grep -q "200\|404\|401"; then
  echo "✓ OK"
else
  echo "✗ FAILED (check Security Group!)"
fi
echo ""
echo "--- USEFUL COMMANDS ---"
echo "  Nginx logs:  sudo tail -f /var/log/nginx/triolingo-*.log"
echo "  Restart:     sudo systemctl restart nginx"
echo "  Test config: sudo nginx -t"
echo ""
echo "Mở browser: http://$FRONTEND_IP"
echo ""


