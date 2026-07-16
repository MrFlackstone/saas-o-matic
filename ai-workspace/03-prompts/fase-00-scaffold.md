# Fase 0 — Scaffold del monorepo

## Objetivo

Dejar `backend/` y `frontend/` arrancando en local con tooling de calidad configurado, sin lógica de negocio todavía.

## Specs de referencia (leer antes)

- `ai-workspace/02-arquitectura/estructura-carpetas.md`
- `ai-workspace/02-arquitectura/decisiones.md` (ADR-01, ADR-09)

## Restricciones

- Gestor de paquetes: **pnpm** en ambas apps (independientes, sin workspaces — ADR-09).
- TypeScript **estricto** (`strict: true`) en ambas apps.
- No añadir dependencias fuera de las listadas sin proponerlo antes.

## Plan de acción

1. **Backend**: `pnpm dlx @nestjs/cli new backend` (strict, pnpm). Añadir: `prisma`, `@prisma/client`, `class-validator`, `class-transformer`, `@nestjs/swagger`.
2. En `main.ts`: `ValidationPipe` global (`whitelist: true, transform: true`), CORS habilitado para `http://localhost:5173`, Swagger montado en `/docs`, puerto 3000.
3. Crear esqueleto de carpetas: `src/common/`, `src/domain/`, `src/prisma/` (vacías con `.gitkeep` o archivos mínimos).
4. Endpoint `GET /health` → `{ "status": "ok" }`.
5. **Frontend**: `pnpm create vite frontend --template react-ts`. Añadir: `tailwindcss`, `shadcn/ui` (init + button, card, input, select, slider, skeleton, badge, sonner), `@tanstack/react-query`, `react-router-dom`, `react-hook-form`, `zod`, `@hookform/resolvers`.
6. Esqueleto: `src/api/`, `src/domain/pricing/`, `src/providers/`, `src/hooks/`, `src/lib/`, `src/features/`, layout base con header vacío.
7. `.env` no necesario: URL del API por `VITE_API_URL` con default `http://localhost:3000` en un único módulo `src/lib/config.ts`.
8. Raíz: `.gitignore` (node_modules, dist, *.db, coverage), `README.md` placeholder.

## Criterios de aceptación

- [ ] `cd backend && pnpm start:dev` levanta y `GET /health` responde 200.
- [ ] `GET /docs` muestra Swagger UI.
- [ ] `cd frontend && pnpm dev` levanta en 5173 y renderiza el layout.
- [ ] `pnpm lint` verde en ambas apps; `strict: true` en ambos `tsconfig`.
- [ ] Estructura de carpetas coincide con `estructura-carpetas.md`.

## Verificación

```bash
cd backend && pnpm lint && pnpm test && pnpm start:dev   # + curl http://localhost:3000/health
cd frontend && pnpm lint && pnpm build
```

## Al terminar

Resume qué se creó y por qué. Anota en `ai-workspace/04-proceso/registro-decisiones.md` cualquier desviación. Commit sugerido: `chore(scaffold): estructura inicial backend NestJS y frontend Vite`.
