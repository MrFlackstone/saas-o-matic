FROM node:26.12.1-bookworm-slim

# better-sqlite3 compila con node-gyp al instalar (no hay prebuild para esta
# combinación), así que el toolchain es obligatorio, no opcional.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Node 25+ ya no incluye corepack: pnpm se instala con npm, fijado a la versión del lockfile.
RUN npm install -g pnpm@10.31.0

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate && pnpm build

ENV DATABASE_URL=file:/data/dev.db
EXPOSE 3000

# La BD vive en el volumen, así que migraciones y seed se aplican al arrancar.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed && node dist/main"]
