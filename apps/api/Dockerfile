# syntax=docker/dockerfile:1
#
# API — NestJS para Cloud Run. Mismo patrón que apps/client/Dockerfile:
# `turbo prune` desde la raíz del monorepo para copiar solo lo que @repo/api
# necesita, después install + build de producción.
#
#   docker build -f apps/api/Dockerfile -t api .
#
# El stage `migrator` corre las migraciones de Drizzle como Cloud Run Job
# (ver cloudbuild.yaml): reutiliza el install completo — con `tsx` y
# `drizzle-orm`, que ya están en package.json — en vez de armar una segunda
# imagen de producción sin devDependencies solo para un job de vida corta.
#
#   docker build -f apps/api/Dockerfile --target migrator -t api-migrator .

### Base
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

### Pruner — monorepo parcial con solo lo necesario para @repo/api
FROM base AS builder
WORKDIR /app
COPY . .
RUN npx --yes turbo@2.5.6 prune @repo/api --docker

### Installer — instala dependencias y compila Nest
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci --no-audit

COPY --from=builder /app/out/full/ .
RUN npx turbo build --filter=@repo/api

### Migrator — `npm run db:migrate` (tsx sobre las migraciones de Drizzle)
FROM installer AS migrator
WORKDIR /app/apps/api
CMD ["npm", "run", "db:migrate"]

### Runner — sirve la API compilada
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nestjs
USER nestjs

# `dist/` compilado + node_modules (raíz y del workspace, por el hoisting de
# npm) es lo único que el server compilado necesita en runtime.
COPY --from=installer --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json

# `@repo/schemas` (y su propia dependencia `@repo/utils`) llegan a runtime por
# el symlink de npm workspaces en node_modules/@repo/* — que ya viajó con
# ./node_modules de arriba — pero ese symlink apunta a ../../packages/*, así
# que el paquete real también tiene que estar en la imagen.
COPY --from=installer --chown=nestjs:nodejs /app/packages/schemas/package.json ./packages/schemas/package.json
COPY --from=installer --chown=nestjs:nodejs /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=installer --chown=nestjs:nodejs /app/packages/utils/package.json ./packages/utils/package.json
COPY --from=installer --chown=nestjs:nodejs /app/packages/utils/dist ./packages/utils/dist

# Cloud Run inyecta PORT; main.ts lo respeta (default 8080 en local).
ENV PORT=8080
EXPOSE 8080

# La versión que reporta /health (CheckHealthUseCase). Va horneada en la imagen,
# no como env var del servicio: la imagen es lo único que el build posee (ver
# apps/api/cloudbuild.yaml), así que un `--update-env-vars` acá lo borraría el
# siguiente `pulumi up`, que declara el set completo de env vars. Última capa a
# propósito: cambia en cada commit y invalidaría el cache de todo lo de arriba.
ARG APP_VERSION=0.0.0
ENV APP_VERSION=${APP_VERSION}

CMD ["node", "apps/api/dist/main.js"]
