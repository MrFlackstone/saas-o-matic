# Registro de decisiones

Diario de decisiones tomadas durante el desarrollo (las de arquitectura "grandes" están en `02-arquitectura/decisiones.md`; aquí va el día a día con la IA).

Formato: fecha · fase · decisión · alternativas · por qué.

## Fase de planificación (previa al código)

| Fecha | Fase | Decisión | Alternativas consideradas | Por qué |
|---|---|---|---|---|
| — | Plan | NestJS + Prisma + SQLite / React + Vite | Express, Fastify, FastAPI / Next.js, Angular | Ver ADR-01/02; estructura modular reconocible y quickstart sin fricción |
| — | Plan | Resolver ambigüedades del enunciado por escrito antes de codificar | Improvisar durante el desarrollo | Las 6 ambigüedades (A1–A6) quedaron decididas y justificadas en `reglas-de-negocio.md`; la IA no improvisa reglas de negocio |
| — | Plan | Desarrollo en 10 fases, una sesión de IA por fase | Una única sesión larga | Contexto limpio por fase → menos deriva; cada fase con criterios de aceptación y verificación propios |

## Durante el desarrollo

<!-- Añadir una fila (o entrada breve) por decisión relevante: -->

| Fecha | Fase | Decisión | Alternativas | Por qué |
|---|---|---|---|---|
| 2026-07-16 | 0 | shadcn init con `-b radix -p nova` (CLI 4.x ya no acepta base color); se aceptan las deps que instala el propio CLI (radix-ui, cva, clsx, tailwind-merge, lucide-react, sonner, next-themes, tw-animate-css, @fontsource-variable/geist) | Fijar shadcn a versión anterior con flag `-b neutral` | Interfaz actual del CLI; sus deps son parte integral de shadcn, no deps nuevas del proyecto |
| 2026-07-16 | 0 | Mantener oxlint + TypeScript 6 del template Vite actual (`pnpm lint` ejecuta oxlint) | Migrar a ESLint | Default del template; se migrará solo si hace falta paridad de reglas con el backend |
| 2026-07-16 | 0 | `pnpm.onlyBuiltDependencies` (prisma, @prisma/client, @prisma/engines) en `backend/package.json` | Ejecutar `pnpm approve-builds` manualmente en cada clon | pnpm 10 bloquea postinstall por defecto; sin ello el schema-engine no se instala y `prisma migrate` fallaría en fase 1. Verificado con `pnpm prisma --version` |
| 2026-07-16 | 0 | Sustituir los flags sueltos del scaffold Nest (`strictNullChecks`, `noImplicitAny`…) por `strict: true` | Dejar los flags del scaffold | Criterio de aceptación de la fase; `strict` los engloba y añade el resto |
| 2026-07-16 | 0 | Tipar `VITE_API_URL` augmentando `ImportMetaEnv` en `src/vite-env.d.ts` | Acceso sin tipar (`any` implícito) | Cumple la prohibición de `any` con TS estricto |
| 2026-07-16 | 1 | Adoptar Prisma 7 actualizando la spec `base-de-datos.md` antes de implementar (spec-first): URL del datasource y seed en `prisma.config.ts`, driver adapter `@prisma/adapter-better-sqlite3` obligatorio en `PrismaClient` (P2038 sin él), `better-sqlite3` añadido a `onlyBuiltDependencies` | Downgrade a Prisma 6 para mantener la spec original | El backend ya traía Prisma 7.8 instalado; actualizar la spec primero evita desviación spec↔código y mantiene el stack en la versión soportada |
| 2026-07-16 | 1 | Generator `prisma-client` (canónico v7) con `moduleFormat="cjs"` e `importFileExtension=""`, emitiendo TS en `src/generated/prisma/` (ignorado por git/eslint/prettier); `db:setup` incluye `prisma generate` | Provider legacy `prisma-client-js`; commitear el cliente generado | El provider v7 emite TypeScript fuente; con extensiones `.js` en imports ts-node fallaba (MODULE_NOT_FOUND) — imports sin extensión funcionan en CJS. Cliente no commiteado → un clon limpio lo regenera en `db:setup` |
| 2026-07-16 | 2 | `CostComponent` modelado como tipo función pura `(input: PricingInput) => TierLine[]`; el motor recibe `components: readonly CostComponent[]` con default `[userTiersComponent]` y `baseCents` = suma de `amountCents` de todas las líneas | Interfaz/clase con método `compute()` | Una función basta en TS puro (ADR-05/07); añadir `StorageComponent` = añadir una función al array (OCP), y derivar el total de las líneas hace imposible desincronizar desglose y base. Test dedicado prueba la extensión con un componente sintético |
| 2026-07-16 | 2 | Verificación con `--testPathPatterns` (plural) en lugar del `--testPathPattern` que indica la fase | Downgrade a Jest 29 | Jest 30 renombró el flag (breaking change); con el flag viejo no encuentra tests. La sección Verificación de `fase-02-motor-pricing.md` queda desactualizada a propósito de registro |
| 2026-07-16 | 2 | Guard fail-fast en `computeUserTierLines`: `activeUsers` no entero lanza `Error` de dominio (hallazgo de auditoría; caso no cubierto por spec, decidido en revisión) | `Math.trunc` defensivo; confiar solo en el DTO | La invariante "dinero solo enteros" se defiende donde vive el dinero (ADR-05); trunc ocultaría el bug y persistiría un snapshot corrupto e inmutable (RN-05). El DTO sigue siendo la validación de usuario (400); el guard detecta bugs internos |

## Checklist final contra la rúbrica (completar en fase 9)

- [ ] Validación fiscal: tabla de fixtures en verde (backend y frontend)
- [ ] Tramos: 8 casos dorados en verde en ambos lados
- [ ] Persistencia con snapshot verificada releyendo histórico
- [ ] Responsive 360 px sin scroll horizontal
- [ ] Estados carga/error/fallback de la API de divisas demostrables
- [ ] README: clon limpio arranca en ≤ 5 comandos (cronometrado)
