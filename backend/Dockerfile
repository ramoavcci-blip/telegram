FROM node:20

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Database
RUN mkdir -p /app/database

EXPOSE 3001

# Migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy --skip-generate 2>/dev/null || true && node dist/index.js"]
