# Fase 1 — Base de datos y seed

## Objetivo

Esquema Prisma completo, migración inicial commiteada y seed idempotente con datos de referencia + demo.

## Specs de referencia (leer antes)

- `ai-workspace/02-arquitectura/base-de-datos.md` (esquema exacto — copiarlo, no reinventarlo)
- `ai-workspace/01-specs/reglas-de-negocio.md` (RN-02: tabla de países; RN-04, RN-05)

## Restricciones

- El esquema debe ser **exactamente** el de `base-de-datos.md`; cualquier cambio se propone antes.
- Seed idempotente: upserts, ejecutable N veces sin error ni duplicados.
- `PrismaService` es la única puerta a la BD (nada de clientes sueltos).

## Plan de acción

1. `prisma init` con datasource sqlite `file:./dev.db`; pegar el esquema de la spec.
2. `pnpm prisma migrate dev --name init` (migración queda commiteada).
3. `PrismaModule` global + `PrismaService` (conexión en `onModuleInit`, cierre limpio).
4. `prisma/seed.ts`:
   - 10 países de RN-02 (código, nombre, `vatRateBps`).
   - Planes `STARTER`/`PRO`/`ENTERPRISE`.
   - Demo: 3 clientes — `B58818501` (ES/PRO), uno PT, uno US — y 4 simulaciones con desglose realista (incluida una de 15 usuarios: base 14000, IVA ES 2940, total 16940; `breakdown` JSON con los dos tramos).
5. Scripts en `package.json`: `db:seed` (`prisma db seed`), `db:setup` (`prisma migrate deploy && prisma db seed`).

## Criterios de aceptación

- [ ] `pnpm db:setup` en un clon limpio deja la BD lista sin prompts interactivos.
- [ ] Ejecutar el seed dos veces seguidas no falla ni duplica filas.
- [ ] `dev.db` está en `.gitignore`; `prisma/migrations/` commiteado.
- [ ] Los datos demo del seed cuadran con los casos dorados de RN-01.

## Verificación

```bash
cd backend && pnpm db:setup && pnpm db:seed
pnpm prisma studio   # inspección visual rápida (o consulta con sqlite3)
```

## Al terminar

Commit sugerido: `feat(db): esquema Prisma, migración inicial y seed con datos demo`.
