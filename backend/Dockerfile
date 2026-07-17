FROM node:20-bookworm-slim

# better-sqlite3 compila con node-gyp al instalar (no hay prebuild para esta
# combinación), así que el toolchain es obligatorio, no opcional.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# pnpm fijado: corepack sin pin activa la última (v11), que no arranca en Node 20.
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate && pnpm build

ENV DATABASE_URL=file:/data/dev.db
EXPOSE 3000

# La BD vive en el volumen, así que migraciones y seed se aplican al arrancar.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed && node dist/main"]
