# syntax=docker/dockerfile:1
#
# Cliente — SSR (Next standalone) (Cloud Run, Render, Fly o cualquier host de contenedores).
# El contexto de build es la RAÍZ del monorepo (no apps/client): se poda el
# monorepo con `turbo prune` para copiar solo lo que @repo/client necesita.
#
#   docker build -f apps/client/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .

### Base
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

### Pruner — monorepo parcial con solo lo necesario para @repo/client
FROM base AS builder
WORKDIR /app
COPY . .
RUN npx --yes turbo@2.5.6 prune @repo/client --docker

### Installer — instala dependencias y compila el build SSR
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci --no-audit

COPY --from=builder /app/out/full/ .

# NEXT_PUBLIC_* se embebe en el bundle del cliente en build time; llega como
# build-arg (no como secreto: es config pública — la misma que apps/client/.env.example).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Sin esta variable el bundle hornearía una URL vacía; mejor fallar el build.
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "ERROR: falta --build-arg NEXT_PUBLIC_API_URL" >&2 && exit 1)

RUN npx turbo build --filter=@repo/client

### Runner — sirve el servidor standalone
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs
USER nextjs

# El output standalone (con outputFileTracingRoot = raíz del repo) deja el
# server en apps/client/server.js; static y public se copian aparte.
COPY --from=installer --chown=nextjs:nodejs /app/apps/client/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/client/.next/static ./apps/client/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/client/public ./apps/client/public

# Cloud Run inyecta PORT; el server de Next lo respeta.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "apps/client/server.js"]
