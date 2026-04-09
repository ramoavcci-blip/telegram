# Docker Kurulumu ve Çalışması (Local)

Bu dosya, Docker Compose kullanarak uygulamayı lokalde test etmek için talimatlar içerir.

## Ön Koşullar

1. **Docker Engine:** https://docs.docker.com/engine/install/
2. **Docker Compose:** Genellikle Docker Engine ile birlikte gelir

Sürüm kontrol:
```bash
docker --version
docker compose --version
```

## Local Test - Docker Compose ile

### 1. Environment Dosyalarını Hazırla

```bash
# Backend .env oluştur
cp backend/.env.example backend/.env

# Frontend .env oluştur
cp frontend/.env.example frontend/.env
```

### 2. .env Dosyalarını Düzenle

#### backend/.env
```env
DATABASE_URL="file:./database/dev.db"
PORT=3001
NODE_ENV=production
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
JWT_SECRET="your-secret-key-min-32-chars"
CORS_ORIGIN="http://localhost:3000"
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
```

#### frontend/.env
```env
VITE_API_URL="http://localhost:3001/api"
```

### 3. Docker Compose'u Başlat

```bash
# Build ve başlat
docker compose up -d

# İlk kez üç container başlayacak: backend, frontend, database
```

### 4. Logları İzle

```bash
# Tüm service'lerin loglarını görmek
docker compose logs -f

# Sadece backend
docker compose logs -f backend

# Sadece frontend
docker compose logs -f frontend
```

### 5. Database Migrasyonlarını Çalıştır

```bash
# Backend container'ında
docker exec telegram-admin-backend npx prisma migrate deploy

# veya seed datası
docker exec telegram-admin-backend npx prisma db seed
```

### 6. Uygulamaya Erişim

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Test:** http://localhost:3001/

### 7. İlk Container'dan Çıkış

```bash
# Tüm container'ları kapat ama silme
docker compose down

# Container'ları sil
docker compose down -v

# Yeniden başlat
docker compose up -d
```

## Manual Docker Build ve Çalıştırma

### Backend Docker Image Oluşturma

```bash
cd backend

# Image oluştur
docker build -t telegramadmin-backend:1.0 .

# Container'ı çalıştır
docker run -d \
  --name telegram-backend \
  -p 3001:3001 \
  -e TELEGRAM_BOT_TOKEN="your_token" \
  -e JWT_SECRET="your_secret" \
  -v $(pwd)/database:/app/database \
  telegramadmin-backend:1.0

# Logları görmek
docker logs -f telegram-backend

# Stop
docker stop telegram-backend

# Sil
docker rm telegram-backend
```

### Frontend Docker Image Oluşturma

```bash
cd frontend

# Image oluştur
docker build -t telegramadmin-frontend:1.0 .

# Container'ı çalıştır
docker run -d \
  --name telegram-frontend \
  -p 3000:80 \
  telegramadmin-frontend:1.0

# Kontrol
docker logs -f telegram-frontend
```

## Sorun Giderme

### Build Başarısız

```bash
# Docker build log'larını detaylı görmek
docker compose build --no-cache --progress=plain

# Veya specific service
docker compose build --no-cache backend
```

### Container Başlamıyor

```bash
# Detaylı log'ları görmek
docker compose logs backend

# Container'a shell erişim
docker exec -it telegram-admin-backend sh

# Container'ında komut çalıştırma
docker exec telegram-admin-backend npm list
```

### Port Zaten Kullanılıyor

```bash
# Port 3001'i kullanan işlemi bulmak
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# docker-compose.yml'de ports değiştir
# Örneğin backend 3001:3001 yerine 3002:3001
```

### Image Diskten Çok Yer Kaplamış

```bash
# Dangling images sil
docker image prune

# Tüm unused images sil
docker image prune -a
```

### Database Permissions Hatası

```bash
# Linux'ta
sudo chmod 777 backend/database

# Windows PowerShell (admin modda)
icacls "backend\database" /grant Users:F /T
```

## Production Ready Commands

```bash
# Multi-stage build test et
docker build --target builder -t test-build .

# Image boyutunu kontrol et
docker images telegramadmin-backend

# Network inspect
docker network inspect telegramadmin_telegram-admin-network

# Volume inspect
docker volume inspect telegramadmin_backend_db
```

## Faydalı Docker Commands

```bash
# Container'lar
docker ps                          # Çalışan container'lar
docker ps -a                       # Tüm container'lar
docker inspect <container>         # Container detayları

# Images
docker images                      # Local images
docker image rm <image>           # Image sil
docker image prune                # Unused images sil

# Logs
docker logs -f <container>        # Follow mode
docker logs --tail 100 <container> # Son 100 satır
docker logs --since 10m <container> # Son 10 dakika

# Exec
docker exec -it <container> sh    # Shell erişim
docker exec <container> <command> # Komut çalıştır

# Network
docker network ls                 # Networkler
docker network inspect <network>  # Network detayları

# Volume
docker volume ls                  # Volumes
docker volume inspect <volume>    # Volume detayları
docker volume rm <volume>         # Volume sil
```

## Docker Compose Referans

```bash
# Build (images oluştur)
docker compose build

# Build ve başlat
docker compose up -d

# Başlat (image'lar varsa)
docker compose start

# Durdur
docker compose stop

# Yeniden başlat
docker compose restart

# İndir (container'ları sil ama image'ları koru)
docker compose down

# Tamamen temizle (image'ları da sil)
docker compose down --rmi all --volumes

# Logs
docker compose logs -f

# Status
docker compose ps

# Scale (replika)
docker compose up -d --scale backend=3
```

## Performance Monitoring

```bash
# CPU, Memory, Network stats
docker stats

# Specific container
docker stats telegram-admin-backend
```

## Temizlik Scriptleri

### Linux/macOS

```bash
#!/bin/bash
# cleanup.sh

# Dangling containers sil
docker container prune -f

# Dangling images sil
docker image prune -f

# Dangling volumes sil
docker volume prune -f

# İşaret yapılmamış containers
docker ps -q -a --filter "status=exited" | xargs -r docker rm
```

Çalışabilir yap ve çalıştır:
```bash
chmod +x cleanup.sh
./cleanup.sh
```

### Windows PowerShell

```powershell
# Cleanup.ps1
docker container prune -f
docker image prune -f
docker volume prune -f
docker ps -q -a --filter "status=exited" | ForEach-Object { docker rm $_ }
```

Çalıştır:
```powershell
.\Cleanup.ps1
```

---

**Docker kaynakları:**
- Docker Docs: https://docs.docker.com/
- Docker Compose Docs: https://docs.docker.com/compose/
- Best Practices: https://docs.docker.com/develop/dev-best-practices/

**Sorular?** Logları kontrol et ve detaylı hata mesajı gönder! 🐳
