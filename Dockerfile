# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build
# Produce: /build/frontend/dist/


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Dipendenze di sistema minime (per pg native, SSL)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Installa solo le dipendenze di produzione del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copia sorgenti backend
COPY backend/ ./backend/

# Copia il frontend già compilato
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Script di avvio (migrate + server)
COPY backend/start.sh ./start.sh
RUN chmod +x ./start.sh

# Railway usa la variabile PORT
ENV NODE_ENV=production
EXPOSE 3001

# dumb-init gestisce i segnali SIGTERM correttamente
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "/app/start.sh"]
