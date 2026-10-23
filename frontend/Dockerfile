FROM node:26.12.1-bookworm-slim

# Node 25+ ya no incluye corepack: pnpm se instala con npm, fijado a la versión del lockfile.
RUN npm install -g pnpm@10.31.0

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
