FROM node:20-alpine

WORKDIR /app

# Dependencies'leri yükle
COPY package*.json ./
RUN npm ci

# Prisma schema'sı
COPY prisma ./prisma
RUN npx prisma generate

# Source code
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Database dizini
RUN mkdir -p /app/database

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --skip-generate && node dist/index.js"]
