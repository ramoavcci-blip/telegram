# Build aşaması
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılıkları yükle
COPY package*.json ./
RUN npm ci

# Prisma client oluştur
COPY prisma ./prisma
RUN npx prisma generate

# TypeScript'i derle
COPY tsconfig.json ./
COPY src ./src
RUN npm run build || npx tsc

# Production aşaması
FROM node:20-alpine

WORKDIR /app

# Production bağımlılıkları yükle
COPY package*.json ./
RUN npm ci --only=production

# Prisma client'i kopyala
COPY prisma ./prisma
RUN npx prisma generate

# Build edilen JS dosyalarını kopyala
COPY --from=builder /app/dist ./dist

# Database dizini oluştur
RUN mkdir -p /app/database

# Port'u expose et
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Uygulamayı başlat
CMD ["node", "dist/index.js"]
