# Monorepo root Dockerfile (isteğe bağlı)
# Genellikle backend ve frontend ayrı deploy edilir

FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm run install-all

RUN cd backend && npx prisma generate

WORKDIR /app/backend

CMD ["npx", "ts-node", "src/index.ts"]
