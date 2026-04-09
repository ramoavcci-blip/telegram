# Telegram Bot - VDS Deployment Rehberi

Bu rehber, Telegram Admin & Voting System'i kendi VDS'nize (Virtual Dedicated Server) deployment yapmak için adım adım talimatlar içerir.

## 1. VDS Ön Koşulları

### Sistem Gereksinimleri
- **İşletim Sistemi**: Ubuntu 20.04 / 22.04 (veya benzeri Linux)
- **RAM**: Minimum 2GB
- **Disk**: Minimum 20GB
- **CPU**: 1 vCore yeterli
- **Root veya sudo erişimi**: Gerekli

## 2. VDS'de Uzak Bağlantı Kurma

### SSH Bağlantısı
```bash
ssh root@VDS_IP_ADRESI
# Parola ile giriş yap veya SSH key kullan
```

## 3. Sistem Paketlerini Güncelleme

```bash
sudo apt update
sudo apt upgrade -y
```

## 4. Node.js ve npm Kurulumu

```bash
# Node.js kurulumu (v18+ önerilir)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Versiyonları kontrol et
node --version
npm --version
```

## 5. Git Kurulumu ve Projeyi Klonlama

```bash
sudo apt install -y git

# Projelerinizin bulunacağı dizini oluştur
mkdir -p /var/www
cd /var/www

# Repository'i klonla (HTTPS veya SSH)
git clone https://github.com/YOUR_REPO/telegramadmin.git
cd telegramadmin
```

## 6. Node.js Bağımlılıklarını Kurma

```bash
# Ana dizin bağımlılıkları
npm install

# Backend ve frontend bağımlılıkları
npm run install-all

# veya manuel olarak:
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## 7. Veritabanı Kurulumu (SQLite)

```bash
cd backend

# Prisma migrasyonlarını çalıştır ve database oluştur
npx prisma migrate deploy

# veya ilk kurulumda:
npx prisma migrate dev --name init

# (opsiyonel) Seed datası ekle
npx prisma db seed

cd ..
```

## 8. Environment Değişkenlerini Ayarlama

### Backend .env Dosyası Oluşturma

```bash
nano backend/.env
```

Aşağıdaki içeriği ekle:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001
NODE_ENV=production

# Telegram Bot
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"

# API
API_URL="http://localhost:3001"
FRONTEND_URL="https://your-domain.com"

# JWT
JWT_SECRET="your_very_secure_secret_key_here_change_this"

# CORS
CORS_ORIGIN="https://your-domain.com"
```

**Önemli**: 
- `TELEGRAM_BOT_TOKEN`: @BotFather'dan alınan token
- `JWT_SECRET`: Güçlü ve rastgele bir şifre oluştur
- `CORS_ORIGIN`: Frontend domain'iniz

`Ctrl+X` → `Y` → `Enter` ile kaydet.

### Frontend .env Dosyası Oluşturma

```bash
nano frontend/.env
```

Aşağıdaki içeriği ekle:

```env
VITE_API_URL="https://your-domain.com/api"
```

`Ctrl+X` → `Y` → `Enter` ile kaydet.

## 9. Production Build Oluşturma

```bash
# Backend TypeScript'i derle
cd backend
npx tsc
cd ..

# Frontend build
cd frontend
npm run build
cd ..
```

## 10. PM2 ile Process Yönetimi Kurulumu

PM2, uygulamanızı arka planda çalışır durumda tutacak ve otomatik restart sağlayacak.

```bash
sudo npm install -g pm2

# Backend için PM2 başlat
cd backend
pm2 start "npx ts-node src/index.ts" --name "telegram-bot-backend" --env production

# PM2'yi sistem başlangıcında otomatik başlat
pm2 startup
pm2 save

# PM2 durumunu kontrol et
pm2 status
pm2 logs telegram-bot-backend
```

## 11. Nginx Reverse Proxy Kurulumu

### Nginx Kurulması

```bash
sudo apt install -y nginx
```

### Nginx Konfigürasyonu

```bash
sudo nano /etc/nginx/sites-available/telegramadmin
```

Aşağıdaki içeriği yapıştır (domain'i kendi domain'iniz ile değiştir):

```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # HTTP'den HTTPS'ye yönlendir
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Sertifikaları (Let's Encrypt kullanıyorsan çalış adım 12'ye)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket desteği
        proxy_set_header Connection "upgrade";
    }

    # Frontend Static Files
    location / {
        root /var/www/telegramadmin/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
}
```

Dosyayı kaydet: `Ctrl+X` → `Y` → `Enter`

```bash
# Konfigürasyonu etkinleştir
sudo ln -s /etc/nginx/sites-available/telegramadmin /etc/nginx/sites-enabled/

# Varsayılan siteyi devre dışı bırak (opsiyonel)
sudo rm /etc/nginx/sites-enabled/default

# Nginx syntaks kontrolü
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

## 12. SSL Sertifikası Kurulumu (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# Otomatik SSL sertifikası oluştur
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Otomatik yenileme
sudo systemctl enable certbot.timer
```

## 13. Firewall Ayarlaması (UFW)

```bash
# UFW etkinleştir (eğer açık değilse)
sudo ufw enable

# SSH erişini aç
sudo ufw allow 22/tcp

# HTTP/HTTPS erişini aç
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Durum kontrol et
sudo ufw status
```

## 14. Veritabanı Yedeklemesi (Backup)

### Otomatik Backup Script'i Oluşturma

```bash
sudo nano /usr/local/bin/backup-telegram-bot.sh
```

Aşağıdaki içeriği yapıştır:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/telegram-bot"
DB_FILE="/var/www/telegramadmin/backend/dev.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database yedekle
cp $DB_FILE "$BACKUP_DIR/dev_$TIMESTAMP.db"

# 7 günden eski yedekleri sil
find $BACKUP_DIR -name "dev_*.db" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/dev_$TIMESTAMP.db"
```

Dosyayı kaydet ve çalıştırılabilir yap:

```bash
sudo chmod +x /usr/local/bin/backup-telegram-bot.sh

# Cron ile günlük 2:00 AM'de backup çalşsın
sudo crontab -e
```

Aşağıdaki satırı ekle:
```
0 2 * * * /usr/local/bin/backup-telegram-bot.sh
```

## 15. Uygulama Durumunu Kontrol Etme

```bash
# PM2 prozesleri kontrol et
pm2 status

# Backend loglarını görüntüle
pm2 logs telegram-bot-backend

# Nginx durumu kontrol et
sudo systemctl status nginx

# Port 3001'in açık olup olmadığını kontrol et
sudo netstat -tlnp | grep 3001

# URL test et
curl http://localhost:3001/
curl https://your-domain.com/api/auth/status
```

## 16. Güvenlik İyileştirmeleri

### Fail2Ban Kurulumu (SSH Brute Force Koruması)

```bash
sudo apt install -y fail2ban

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates

```bash
# Otomatik updates etkinleştir
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 17. Monitoring ve Logging

### Log Dosyalarını İzleme

```bash
# Backend logs
pm2 logs telegram-bot-backend

# Nginx error logs
tail -f /var/log/nginx/error.log

# Nginx access logs
tail -f /var/log/nginx/access.log

# Sistem logs
journalctl -u nginx -f
```

## 18. DNS Ayarlaması

Domain registrar'ında A record'u VDS IP'sine işaret ettir:

```
your-domain.com  A  VDS_IP_ADRESI
www.your-domain.com  CNAME  your-domain.com
```

## 19. İlk Kullanım Sonrası Kontrol Listesi

- [ ] SSH key ile güvenli bağlantı konfigüre et
- [ ] Firewall kurallarını kontrol et
- [ ] SSL sertifikası aktif ve geçerli mi kontrol et
- [ ] Telegram bot token'ı doğru ayarlanmış mı kontrol et
- [ ] Database migrasyonları çalıştırıldı mı kontrol et
- [ ] PM2 prozesleri otomatik başlamaya ayarlandı mı kontrol et
- [ ] CORS ve domain ayarlarını kontrol et
- [ ] Backup script'i çalışıyor mu kontrol et
- [ ] Monitoring ve logging kurulum kontrol et

## 20. Sorun Giderme

### Backend başlamıyor
```bash
pm2 logs telegram-bot-backend
# Logları inceleyip hatayı bul
```

### Database bağlantı hatası
```bash
cd backend
npx prisma studio
# Veritabanı durumunu kontrol et
```

### CORS hatası
- `backend/.env` dosyasında `CORS_ORIGIN` doğru ayarlanmış mı kontrol et
- Nginx konfigürasyonunda header'ları kontrol et

### SSL sertifikası hatası
```bash
sudo certbot renew --dry-run
```

### Port çakışması
```bash
sudo netstat -tlnp | grep 3001
# Başka bir servis port kullanıyorsa değiştir
```

## 21. Update ve Deployment Dosyası (Otomatik Deploy Script)

```bash
nano /var/www/telegramadmin/deploy.sh
```

Aşağıdaki içeriği yapıştır:

```bash
#!/bin/bash

cd /var/www/telegramadmin

# Git'ten en son kodu çek
git pull origin main

# Bağımlılıkları güncelle
npm run install-all

# Frontend build
cd frontend
npm run build
cd ..

# PM2 restart
pm2 restart telegram-bot-backend

echo "Deployment completed!"
```

Dosyayı çalıştırılabilir yap:
```bash
chmod +x /var/www/telegramadmin/deploy.sh
```

Deploy etmek için:
```bash
/var/www/telegramadmin/deploy.sh
```

---

## Hızlı Referans Komutlar

```bash
# Servis yönetimi
pm2 status                          # Durumu kontrol et
pm2 restart telegram-bot-backend    # Backend'i restart et
pm2 stop telegram-bot-backend       # Backend'i durdur
pm2 start telegram-bot-backend      # Backend'i başlat
pm2 delete telegram-bot-backend     # Backend'i kaldır

# Log görüntüleme
pm2 logs                            # Tüm logları göster
pm2 logs telegram-bot-backend -f    # Tail mod

# Nginx
sudo systemctl restart nginx        # Nginx'i restart et
sudo nginx -t                       # Nginx syntaks kontrol
sudo systemctl status nginx         # Nginx durumu

# Database
cd backend && npx prisma studio    # Web arayüzü ile DB yönet

# System
htop                               # Sistem kaynakları
df -h                              # Disk kullanımı
```

---

## Destek ve Kaynaklar

- Telegram Bot API: https://core.telegram.org/bots/api
- Telegraf.js Dokümantasyonu: https://telegraf.js.org/
- Prisma ORM: https://www.prisma.io/
- Nginx: https://nginx.org/
- Let's Encrypt: https://letsencrypt.org/

---

**Not**: `your-domain.com` ve `YOUR_BOT_TOKEN_HERE` kısımlarını kendi değerleriniz ile değiştirmeyi unutmayın!
