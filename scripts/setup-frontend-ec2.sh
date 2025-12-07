#!/bin/bash

# Script để setup Frontend Triolingo Web Admin trên EC2
# Chạy script này MỘT LẦN đầu tiên khi setup frontend lên EC2
# Yêu cầu: Backend đã được setup trước đó và đang chạy trên port 5001

set -e  # Exit nếu có lỗi

echo "========================================="
echo "Setup Frontend Triolingo Web Admin trên EC2"
echo "========================================="
echo ""

# Kiểm tra xem backend đã chạy chưa
echo "Kiểm tra backend đang chạy..."
if pm2 describe back-end-nt118 > /dev/null 2>&1; then
  echo "✓ Backend đã chạy trên PM2"
else
  echo "⚠ WARNING: Backend chưa chạy hoặc chưa được setup với PM2!"
  echo "Vui lòng setup backend trước khi tiếp tục."
  read -p "Bạn có muốn tiếp tục không? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Install Nginx nếu chưa có
echo ""
echo "Cài đặt Nginx..."
if ! command -v nginx &> /dev/null; then
  sudo apt update
  sudo apt install -y nginx
  echo "✓ Nginx đã được cài đặt"
else
  echo "✓ Nginx đã có sẵn"
fi

# Verify Node.js và npm đã được cài đặt (từ backend setup)
echo ""
echo "Kiểm tra Node.js và npm..."
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo "ERROR: Node.js hoặc npm chưa được cài đặt!"
  echo "Vui lòng chạy backend setup script trước."
  exit 1
fi
echo "✓ Node.js version: $(node -v)"
echo "✓ NPM version: $(npm -v)"

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

# Build production
echo ""
echo "Building production bundle..."
npm run build

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
  sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
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
echo "=== PM2 Status (Backend) ==="
pm2 status || true

echo ""
echo "========================================="
echo "✓ Setup Frontend hoàn tất!"
echo "========================================="
echo ""
echo "Thông tin triển khai:"
echo "  - Frontend URL: http://98.94.144.216"
echo "  - Backend API: http://98.94.144.216/api/*"
echo "  - Nginx config: /etc/nginx/sites-available/triolingo"
echo "  - Web root: /var/www/triolingo-admin"
echo ""
echo "Các lệnh hữu ích:"
echo "  - Xem Nginx logs: sudo tail -f /var/log/nginx/triolingo-*.log"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo "  - Test Nginx config: sudo nginx -t"
echo "  - Xem Backend logs: pm2 logs back-end-nt118"
echo "  - Xem Backend status: pm2 status"
echo ""
echo "Lưu ý: Đảm bảo Security Group của EC2 đã mở port 80 (HTTP)"
echo ""
