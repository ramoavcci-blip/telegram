# Coolify ile Telegram Bot Deployment Rehberi

Bu rehber, Telegram Admin & Voting System'i Coolify üzerinden Docker kullanarak deployment yapmak için adım adım talimatlar içerir.

## Coolify Nedir?

Coolify, self-hosted bir deployment platform olup:
- ✅ Otomatik SSL/TLS (Let's Encrypt)
- ✅ Otomatik database backups
- ✅ Zero downtime deployments
- ✅ Monitoring ve logging
- ✅ Web arayüzü ile kolay yönetim
- ✅ Docker compose support

## Ön Koşullar

### 1. VDS Hazırlığı
- Ubuntu 20.04+ veya benzeri Linux
- Root veya sudo erişimi
- Minimum 2GB RAM
- Minimum 10GB disk

### 2. Coolify Kurulumu

VDS'ye bağlan:
```bash
ssh root@VDS_IP
```

Coolify'yi yükle:
```bash
curl -fsSL https://get.coollabs.io/docker-install.sh | sudo bash
```

Coolify başlat:
```bash
wget -q https://get.coollabs.io/coolify-install.sh -O - | sudo bash
```

Coolify Web Arayüzüne Erişim:
```
https://VDS_IP:3000
veya
https://coolify.your-domain.com
```

İlk hesabı oluştur ve giriş yap.

## Adım 1: GitHub Repository Bağlama (Opsiyonel ama Önerilir)

Coolify → Settings → GitHub
- GitHub Personal Access Token oluştur
- Repo'yu Coolify'ye bağla

Bu sayede her git push ile otomatik deployment olacak.

## Adım 2: Telegram Bot Projesini Coolify'ye Ekleme

### Option A: GitHub Repository'den (Önerilen)

1. **Coolify Dashboard'a git**
2. **"Create New Project"** tıkla
3. **Project ayarları:**
   - Name: `Telegram Admin Bot`
   - Description: `Telegram Admin & Voting System`

4. **Repository Seç:**
   - GitHub → Repo seç
   - Branch: `main` veya `production`

5. **"Create"** tıkla

### Option B: Docker Compose'dan (Manuel)

1. **"Create New Project"** → **"Compose"** seç
2. Docker Compose YAML yapıştır (aşağıya bak)

## Adım 3: Backend Service'i Ekle

### Coolify UI'de:

1. Project → **"Add Service"** → **"Docker Compose"**

2. **Aşağıdaki Docker Compose oluştur:**

```yaml
version: '3.8'

services:
  backend:
    image: telegramadmin-backend:latest
    container_name: telegram-admin-backend
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=file:./database/dev.db
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=https://${DOMAIN}
      - API_URL=https://${DOMAIN}/api
    volumes:
      - backend_db:/app/database
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - telegram_network

  frontend:
    image: telegramadmin-frontend:latest
    container_name: telegram-admin-frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
    depends_on:
      - backend
    environment:
      - VITE_API_URL=https://${DOMAIN}/api
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/index.html"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - telegram_network

  nginx:
    image: nginx:alpine
    container_name: telegram-admin-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - telegram_network

volumes:
  backend_db:
    driver: local

networks:
  telegram_network:
    driver: bridge
```

## Adım 4: Environment Variables (Değişkenler) Ayarlama

Coolify Dashboard'da:

### Backend Secrets:

1. **Service → Backend → Settings → Environment**

Aşağıdaki değişkenleri ekle:

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
JWT_SECRET=your_very_secure_random_secret_key_min_32_chars
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./database/dev.db
CORS_ORIGIN=https://your-domain.com
API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com
```

### Frontend Secrets:

```
VITE_API_URL=https://your-domain.com/api
```

## Adım 5: SSL/TLS Sertifikası (Otomatik)

Coolify → Project → Settings:

1. **Domain:** `your-domain.com`
2. **Auto-SSL:** Aktif (Let's Encrypt otomatik)
3. **HTTPS Redirect:** Aktif

Coolify otomatik SSL sertifikası oluşturacak ve yenileyecek.

## Adım 6: Database Migrasyonlarını Çalıştır

Deployment öncesi veya sonrası:

### Coolify Console'dan:

```bash
# Backend container'ına erişim
docker exec -it telegram-admin-backend sh

# Prisma migrasyonlarını çalıştır
npx prisma migrate deploy

# (Opsiyonel) Seed datası
npx prisma db seed

# Exit
exit
```

**VEYA** backend `package.json`'a hook ekle:

```json
{
  "scripts": {
    "start": "npx prisma migrate deploy && node dist/index.js"
  }
}
```

## Adım 7: Ports ve Load Balancing

### Coolify'de Port Ayarları:

**Backend:**
- Internal Port: `3001`
- Mapped Port: `3001` (veya rastgele)

**Frontend:**
- Internal Port: `80`
- Mapped Port: `3000` (veya rastgele)

Coolify otomatik olarak SSL reverse proxy ile yönetir.

## Adım 8: Monitoring ve Logs

### Logs İzleme:

```bash
# Real-time logs
docker logs -f telegram-admin-backend
docker logs -f telegram-admin-frontend

# Veya Coolify UI'den:
Project → Service → Logs
```

### Monitoring:

Coolify Dashboard'da real-time CPU, Memory, Network stats görürsün.

## Adım 9: Backup Ayarlaması

Coolify → Project → Settings → Advanced:

1. **Database Backup:** Aktif
2. **Backup Frequency:** Günlük
3. **Backup Location:** Local disk veya S3
4. **Retention Days:** 30

## Adım 10: Continuous Deployment (CI/CD) Ayarlama

### GitHub Integration:

1. **Coolify → Settings → GitHub**
2. Personal Access Token ekle
3. **Project → Settings → Webhooks**
4. GitHub Actions workflow oluştur:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy via Coolify Webhook
        run: |
          curl -X POST https://your-coolify-instance/api/deploy \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"project": "telegram-admin"}'
```

### Otomatik Deploy:

Her `git push` ile Coolify otomatik deploy edecek.

## Adım 11: Email/Webhook Notifications

Coolify → Project → Notifications:

1. **Deployment Success/Failure:** Email bildir
2. **Health Check Failed:** Alert gönder
3. **Slack Integration:** (Opsiyonel)

## Adım 12: Custom Domain

### DNS Ayarlama:

Registrar'ında:

```
A Record:    your-domain.com    VDS_IP
CNAME:       www.your-domain.com    your-domain.com
```

### Coolify'de:

Project → Settings → Domain:
```
your-domain.com
www.your-domain.com
```

Coolify otomatik olarak:
- SSL sertifikası oluşturur
- HTTP → HTTPS yönlendirir
- Renew işlemini yönetir

## Adım 13: Firewall Ayarlaması

```bash
# UFW varsa
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # Coolify (opsiyonel)
sudo ufw enable
```

## Adım 14: Produksyon Kontrol Listesi

- [ ] Environment variables doğru ayarlanmış mı?
- [ ] `TELEGRAM_BOT_TOKEN` @BotFather'dan alındı mı?
- [ ] Database migrasyonları çalıştırıldı mı?
- [ ] SSL sertifikası aktif mi?
- [ ] Domain DNS'e işaret ediyor mu?
- [ ] Backend ve Frontend logları temiz mi (error yok)?
- [ ] Health checks geçiyor mu?
- [ ] Backup system aktif mi?
- [ ] Telegram bota /start yazıp cevap veriyor mu?
- [ ] CORS hatası yok mu?

## Sorun Giderme

### Backend başlamıyor

```bash
docker logs -f telegram-admin-backend
# Hata mesajını oku
```

Yaygın hatalar:
- `TELEGRAM_BOT_TOKEN` boş/yanlış
- Database migrasyonu başarısız
- Port zaten kullanılıyor

### Frontend boş sayfası gösteriyor

```bash
docker logs -f telegram-admin-frontend
# nginx errors kontrol et

# ve
docker logs -f telegram-admin-backend
# API hatalarını kontrol et
```

Yaygın hatalar:
- `VITE_API_URL` yanlış
- Backend erişilemiyor
- CORS sorunu

### CORS hatası

Backend `.env`'de kontrol et:
```env
CORS_ORIGIN=https://your-domain.com
```

### SSL sertifikası oluştulamıyor

```bash
# Coolify logs
docker logs -f coolify

# DNS doğru mu?
dig your-domain.com

# Port 80/443 açık mı?
sudo netstat -tlnp | grep -E ':80|:443'
```

### Database bağlantı hatası

```bash
docker exec -it telegram-admin-backend bash
cd /app
npx prisma studio
```

Web arayüzü açılırsa database bağlantı ok.

## Güvenlik Best Practices

1. **Secrets Güvenliği:**
   - Coolify Secrets Manager kullan
   - `.env` dosyalarını git'e commit etme
   - `.env.example` örnek dosya oluştur

2. **Network Güvenliği:**
   - Firewall kurallarını sıkı tut
   - SSH key authentication kullan
   - IP whitelisting yap (opsiyonel)

3. **Backup Güvenliği:**
   - Backups şifreli tut
   - Offsite backup yap
   - Regular restore test et

4. **Monitoring:**
   - Uptime monitoring aktif et
   - Alert sistemini konfigure et
   - Regular logları gözden geçir

## İleri Konular

### Scaling (Yatay Genişleme)

```yaml
services:
  backend:
    deploy:
      replicas: 3  # 3 instance çalıştır
      
  frontend:
    deploy:
      replicas: 2
```

Load balancer Coolify tarafından otomatik yönetilir.

### Custom Hooks (Pre/Post Deployment)

```bash
# Backend startup hook
npx prisma migrate deploy
npm run seed-data  # seed script'i çalıştır
```

### Performance Tuning

Backend Dockerfile'da:

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=1024"
```

## Faydalı Komutlar

```bash
# Coolify container'ları listelemek
docker ps | grep telegram

# Specific log'ları görmek
docker logs --tail 100 -f telegram-admin-backend

# Container'a erişim
docker exec -it telegram-admin-backend bash

# Restart
docker restart telegram-admin-backend

# Stats
docker stats telegram-admin-backend
```

## Coolify Komut Satırı

```bash
# Coolify status
sudo docker ps | grep coolify

# Coolify logs
sudo docker logs -f coolify

# Coolify restart
sudo systemctl restart coolify
```

## Resources

- **Coolify Docs:** https://coolify.io/docs
- **Docker Docs:** https://docs.docker.com/
- **Telegram Bot API:** https://core.telegram.org/bots
- **Nginx Docs:** https://nginx.org/
- **Let's Encrypt:** https://letsencrypt.org/

---

## Hızlı Referans

| İşlem | Komut |
|-------|-------|
| Logs İzle | `docker logs -f telegram-admin-backend` |
| Deploy Yap | GitHub push → Coolify otomatik deploy |
| Restart | `docker restart telegram-admin-backend` |
| Shell Erişim | `docker exec -it telegram-admin-backend bash` |
| Migrasyonlar | `npx prisma migrate deploy` |
| Database GUI | `npx prisma studio` |
| Stats | `docker stats` |

---

**✅ Sonraki Adım:** VDS'de Coolify yükle ve GitHub repo'nu bağla!

Başınız ağrıtacak bir yer olursa sorabilirsin 🚀
