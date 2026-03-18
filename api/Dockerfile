# ── Estágio 1: dependências ──────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Estágio 2: imagem final ───────────────────────────────────────────────────
FROM node:20-alpine

LABEL maintainer="Portal SERPRO"
LABEL description="API REST do Portal SERPRO"

# Cria usuário sem privilégios de root (boa prática de segurança)
RUN addgroup -S serpro && adduser -S serpro -G serpro

WORKDIR /app

# Copia dependências instaladas no estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia código-fonte
COPY --chown=serpro:serpro . .

USER serpro

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
