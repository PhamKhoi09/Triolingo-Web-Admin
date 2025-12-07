#!/bin/bash

# Script để setup Frontend Triolingo Web Admin trên EC2 RIÊNG BIỆT
# Chạy script này MỘT LẦN đầu tiên khi setup frontend lên EC2 MỚI
# 
# KIẾN TRÚC: Frontend EC2 (này) → Nginx proxy → Backend EC2 (khác)
# 
# YÊU CẦU TRƯỚC KHI CHẠY:
# 1. EC2 Backend đã chạy và accessible qua IP public:port
# 2. Security Group của Backend EC2 đã mở port 5001 cho Frontend EC2
# 3. Đã cập nhật IP backend trong file nginx/triolingo.conf

set -e  # Exit nếu có lỗi

echo "========================================="
echo "Setup Frontend Triolingo Web Admin"
echo "Trên EC2 Riêng Biệt (Tách khỏi Backend)"
echo "========================================="
echo ""

# Không cần kiểm tra PM2 vì backend ở EC2 khác
echo "ℹ️  Lưu ý: Script này dành cho EC2 frontend riêng biệt"
echo "   Backend phải chạy trên EC2 khác và accessible qua network"
echo ""

# Install Nginx nếu chưa có
echo "Cài đặt Nginx..."
if ! command -v nginx &> /dev/null; then
  sudo apt update
  sudo apt install -y nginx
  echo "✓ Nginx đã được cài đặt"
else
  echo "✓ Nginx đã có sẵn"
fi

# Verify Node.js và npm đã được cài đặt
echo ""
echo "Kiểm tra Node.js và npm..."
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo "Node.js/npm chưa có, đang cài đặt..."
  
  # Install Node.js 20.x LTS
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  
  echo "✓ Node.js version: $(node -v)"
  echo "✓ NPM version: $(npm -v)"
else
  echo "✓ Node.js version: $(node -v)"
  echo "✓ NPM version: $(npm -v)"
fi

# Tạo swap để tránh OOM khi build (quan trọng cho t2.micro)
echo ""
echo "Cấu hình swap memory (2GB)..."
if ! swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  
  # Làm swap permanent
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  fi
  
  echo "✓ Swap 2GB đã được tạo"
else
  echo "✓ Swap đã tồn tại"
fi

# Clone hoặc update repository
echo ""
echo "Clone/Update repository..."
cd ~
if [ -d "Triolingo-Web-Admin" ]; then
  echo "Directory Triolingo-Web-Admin đã tồn tại, pulling latest..."
  cd Triolingo-Web-Admin
  git fetch origin main
  git reset --hard origin/main
  git clean -fd
else
  git clone https://github.com/PhamKhoi09/Triolingo-Web-Admin.git
  cd Triolingo-Web-Admin
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Build production với memory limit (phù hợp t2.micro)
echo ""
echo "Building production bundle (có thể mất 3-5 phút)..."
NODE_OPTIONS="--max-old-space-size=1536" npm run build

# Tạo thư mục cho web root
echo ""
echo "Chuẩn bị web root directory..."
sudo mkdir -p /var/www/triolingo-admin

# Copy build files đến web root
echo "Copying build files..."
sudo rm -rf /var/www/triolingo-admin/*
sudo cp -r build/* /var/www/triolingo-admin/

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/triolingo-admin
sudo chmod -R 755 /var/www/triolingo-admin

# Backup nginx default config nếu có
echo ""
echo "Configuring Nginx..."
if [ -f /etc/nginx/sites-enabled/default ]; then
  echo "Backing up default nginx config..."
  sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak 2>/dev/null || true
fi

# Kiểm tra IP backend trong nginx config
echo ""
echo "⚠️  QUAN TRỌNG: Kiểm tra cấu hình Backend IP..."
if grep -q "server 98.94.144.216:5001" nginx/triolingo.conf; then
  echo "✓ Phát hiện backend IP: 98.94.144.216:5001"
  echo "  Nếu đây KHÔNG phải IP backend của bạn, hãy dừng lại và sửa file:"
  echo "  nginx/triolingo.conf → upstream backend_server"
  echo ""
  read -p "Backend IP có đúng không? (y để tiếp tục, n để dừng) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Hãy sửa file nginx/triolingo.conf rồi chạy lại script này!"
    exit 1
  fi
fi

# Copy nginx config
echo "Installing Nginx configuration..."
sudo cp nginx/triolingo.conf /etc/nginx/sites-available/triolingo

# Tạo symlink
if [ -L /etc/nginx/sites-enabled/triolingo ]; then
  echo "Nginx symlink đã tồn tại, removing old..."
  sudo rm /etc/nginx/sites-enabled/triolingo
fi
sudo ln -s /etc/nginx/sites-available/triolingo /etc/nginx/sites-enabled/triolingo

# Test nginx configuration
echo ""
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Enable nginx to start on boot
echo "Enabling Nginx to start on boot..."
sudo systemctl enable nginx

# Kiểm tra status
echo ""
echo "Checking services status..."
echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l || true

echo ""
echo "========================================="
echo "✓ Setup Frontend hoàn tất!"
echo "========================================="
echo ""
echo "Thông tin triển khai:"
echo "  - Frontend EC2: Máy này"
echo "  - Frontend URL: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_FRONTEND_EC2_IP')"
echo "  - Backend EC2: Máy khác (được proxy qua /api)"
echo "  - Nginx config: /etc/nginx/sites-available/triolingo"
echo "  - Web root: /var/www/triolingo-admin"
echo ""
echo "Các lệnh hữu ích:"
echo "  - Xem Nginx logs: sudo tail -f /var/log/nginx/triolingo-*.log"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo "  - Test Nginx config: sudo nginx -t"
echo "  - Test backend connectivity: curl http://BACKEND_IP:5001/api/health"
echo ""
echo "⚠️  CẦN LÀM TIẾP:"
echo "1. Mở port 80 trong Security Group của Frontend EC2 này"
echo "2. Mở port 5001 trong Security Group của Backend EC2 (cho Frontend EC2)"
echo "3. Test backend: curl http://BACKEND_IP:5001/api/health"
echo "4. Truy cập frontend qua browser để kiểm tra"
echo ""
