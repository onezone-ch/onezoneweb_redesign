# syntax=docker/dockerfile:1

# OneZone Web — Next.js 16 (App Router, standalone) per deploy su Coolify.
# Build pack Coolify: Dockerfile. Porta esposta: 3000.

# ---- 1. Dipendenze ----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
# Install deterministico dal lockfile (solo file necessari → cache layer stabile).
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2. Build ---------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Le variabili NEXT_PUBLIC_* sono inlined a build-time: vanno passate come ARG
# se si vuole sovrascrivere i default. In Coolify aggiungerle come "Build Variable".
ARG NEXT_PUBLIC_BROKERSTAR_API_URL
ARG NEXT_PUBLIC_AUTOMATION_SCRAPERS
ARG NEXT_PUBLIC_SWISSCARINFO_BRANDS_URL
ENV NEXT_PUBLIC_BROKERSTAR_API_URL=${NEXT_PUBLIC_BROKERSTAR_API_URL}
ENV NEXT_PUBLIC_AUTOMATION_SCRAPERS=${NEXT_PUBLIC_AUTOMATION_SCRAPERS}
ENV NEXT_PUBLIC_SWISSCARINFO_BRANDS_URL=${NEXT_PUBLIC_SWISSCARINFO_BRANDS_URL}

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- 3. Runner (immagine finale) -------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Utente non-root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Asset statici + output standalone. Lo standalone NON include public/ e
# .next/static: vanno copiati esplicitamente.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# server.js è generato dall'output standalone di Next.
CMD ["node", "server.js"]
