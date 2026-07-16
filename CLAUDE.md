# CLAUDE.md — SaaS-O-Matic

Herramienta interna de simulación y presupuestado de suscripciones SaaS multi-divisa. Monorepo: `backend/` (NestJS + Prisma + SQLite) y `frontend/` (React + Vite + TS). Docs de diseño en `ai-workspace/`.

## Fuente de verdad

- **Antes de implementar cualquier funcionalidad, lee su spec** en `ai-workspace/01-specs/`. Las reglas de negocio, contratos de API y validaciones están cerradas ahí.
- **Prohibido inventar reglas de negocio.** Si la spec no cubre un caso, PARA y pregunta; no rellenes el hueco con una suposición.
- La arquitectura y sus límites están en `ai-workspace/02-arquitectura/`. Cualquier desviación se propone y justifica antes de aplicarla.

## Comandos

| Dónde | Comando | Qué hace |
|---|---|---|
| backend/ | `pnpm start:dev` | API en :3000 (Swagger en /docs) |
| backend/ | `pnpm db:setup` | migrate deploy + seed |
| backend/ | `pnpm test` · `pnpm test:e2e` · `pnpm lint` | unit · e2e · lint |
| frontend/ | `pnpm dev` | dashboard en :5173 |
| frontend/ | `pnpm test` · `pnpm lint` · `pnpm build` | vitest · lint · build |

## Reglas de arquitectura (innegociables)

1. **Capas**: `controller → service → domain/prisma`. Un controller nunca toca Prisma ni contiene lógica.
2. **`src/domain/` es TypeScript puro**: cero imports de Nest, Prisma, HTTP o librerías de infraestructura. La lógica de negocio (pricing, validación fiscal) vive ahí y se testea sin mocks.
3. **Dinero solo en enteros**: céntimos (`Cents`) y puntos básicos (`Bps`). Un float en un cálculo monetario es un bug, no un estilo.
4. **Divisas**: el backend solo conoce EUR. La conversión es presentación (frontend). Nunca persistas un importe convertido.
5. **Anti archivo-masivo**: soft limit 250 líneas por archivo; una clase/componente por archivo. Si crece, extrae módulo.
6. **Validación en el borde**: DTOs con class-validator (`whitelist: true`); errores con el contrato global de `contratos-api.md` (códigos incluidos).
7. **Frontend**: HTTP solo en `src/api/`; importes solo via `lib/money.ts`; toda vista remota implementa loading/error/vacío/éxito.

## Calidad y Definition of Done

- Tests obligatorios en `domain/` (100 % de ramas: casos dorados de pricing y fixtures fiscales de las specs) y e2e por endpoint.
- Antes de dar por cerrada una tarea: `pnpm lint && pnpm test && pnpm build` en verde en lo tocado.
- Prohibido: `any`, `@ts-ignore`, `console.log` residual, código muerto, comentarios de andamiaje.
- No añadas dependencias sin proponerlo con justificación y esperar confirmación.

## Flujo de trabajo

- Las fases de desarrollo están en `ai-workspace/03-prompts/`; se ejecutan con `/nueva-fase N` (una fase por sesión).
- Al cerrar una fase: `/auditoria`, registrar decisiones en `ai-workspace/04-proceso/registro-decisiones.md`.
- Presenta siempre tu plan y espera confirmación antes de modificar archivos.

## Commits

- Conventional commits en español: `tipo(scope): descripción` (ej. `feat(pricing): motor acumulativo por tramos`).
- Un commit por fase o unidad coherente; mensaje describe *qué* y *por qué*.
- Identidad git global del equipo; **sin coautorías ni atribuciones de ninguna herramienta en los mensajes**.
