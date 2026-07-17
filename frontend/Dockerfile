FROM node:20-bookworm-slim

# pnpm fijado: corepack sin pin activa la última (v11), que no arranca en Node 20.
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# El navegador (no el contenedor) es quien llama a la API, así que la URL del
# host es la correcta. Vite la hornea en el bundle durante el build. El default
# es explícito: un ARG vacío llegaría como '' y `'' ?? fallback` devuelve ''.
ARG VITE_API_URL=http://localhost:3000
RUN pnpm build

EXPOSE 5173
CMD ["pnpm", "exec", "vite", "preview", "--host", "--port", "5173"]
