FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
COPY prisma ./prisma
# DATABASE_URL dummy para prisma generate (postinstall) - no conecta en build
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else npm i; fi

FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# OpenSSL y Cloud SQL Proxy
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*

ARG CLOUD_SQL_PROXY_VERSION=2.21.0
RUN wget -q https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v${CLOUD_SQL_PROXY_VERSION}/cloud-sql-proxy.linux.amd64 -O /usr/local/bin/cloud-sql-proxy \
  && chmod +x /usr/local/bin/cloud-sql-proxy

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

COPY scripts/start-with-proxy.sh ./
RUN tr -d '\r' < start-with-proxy.sh > start-with-proxy.fix && mv start-with-proxy.fix start-with-proxy.sh \
  && chmod +x start-with-proxy.sh

EXPOSE 8080
ENV PORT=8080
ENV CLOUD_SQL_INSTANCE=foid-487623:southamerica-west1:foid-db
CMD ["sh", "./start-with-proxy.sh"]
