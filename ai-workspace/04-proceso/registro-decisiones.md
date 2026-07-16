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
| 2026-07-16 | 3 | Clasificación fiscal como tabla declarativa `TAX_ID_RULES` (patrón + validador + `reason` por regla) recorrida en orden | Cadena if-else por tipo | Añadir un tipo = añadir una entrada; cada `reason` vive junto a su regla y se reutilizará en el mensaje del 400 `TAX_ID_INVALID` |
| 2026-07-16 | 3 | Fixtures adicionales derivados a mano para ramas sin cobertura en la tabla de la spec: NIF especial (`K1234567L`, `M0000000T`, `K1234567A`), CIF con inicial "ambos" (`N0032484H`/`N00324848`), "solo letra" P (`P2818002D`) y "solo dígito" A válido (`A58818501`) | Limitarse a los 17 fixtures de la spec (dejando ramas sin test) | 100 % de ramas exige ejercitar K/L/M y las tres políticas de control del CIF; los casos son aplicación directa de los algoritmos cerrados en la spec, no reglas nuevas |
| 2026-07-16 | 3 | Fuzz determinista con LCG de semilla fija (500 strings) en vez de `Math.random()` | Fuzz aleatorio por ejecución | Reproducible en CI: un fallo siempre se puede reproducir con la misma semilla |
| 2026-07-16 | 4 | `VALIDATION_ERROR` como código fallback en `details[].code` para constraints sin código en la spec (`taxId` no-string, `page`/`limit` fuera de rango) | Derivar códigos nuevos por campo (`TAX_ID_REQUIRED`, `PAGE_RANGE`…) | La spec solo cierra 10 códigos; inventar más viola "prohibido inventar reglas de negocio". Aprobado por Diego en sesión |
| 2026-07-16 | 4 | El 409 `TAX_ID_TAKEN` viaja sin `details`: el código se documenta solo en la descripción Swagger del 409 | Incluir `details` con el código también en el 409 | El contrato global restringe `details` a errores de validación (400); el 409 es inequívoco por status en este endpoint |
| 2026-07-16 | 4 | `test:e2e` invoca jest via `node --experimental-vm-modules` y añade `--runInBand` | Dependencia nueva (cross-env) o mock del cliente Prisma en e2e | El query compiler WASM de Prisma 7 usa `import()` dinámico, bloqueado por la VM de Jest sin el flag; sin deps nuevas. `--runInBand` evita carreras entre suites e2e |
| 2026-07-16 | 4 | `PrismaService` y `prisma.config.ts` leen `DATABASE_URL` de entorno con fallback a `file:./prisma/dev.db` | URL hardcodeada (estado previo); inyectar config de Nest | Habilita la BD SQLite temporal de los e2e sin tocar dev ni añadir infraestructura de config para un solo valor |
| 2026-07-16 | 4 | Búsqueda de clientes ordenada por `createdAt desc` | Sin `orderBy` (orden de inserción no garantizado) | La spec no fija orden; la paginación exige orden determinista. Detalle de implementación, no regla de negocio |
| 2026-07-16 | 4 | Normalización de `countryCode` (trim → mayúsculas) añadida a `validaciones.md` **antes** de aplicarla en el servicio (hallazgo de auditoría) | Rechazar `"es"` con `COUNTRY_UNKNOWN` (comportamiento previo) | `"es"` y `"ES"` son el mismo país ISO-3166; rechazarlo sería fricción sin valor. Spec-first: la regla se cierra en la spec y luego se implementa, decidido por Diego en la auditoría de fase 4 |

## Checklist final contra la rúbrica (completar en fase 9)

- [ ] Validación fiscal: tabla de fixtures en verde (backend y frontend)
- [ ] Tramos: 8 casos dorados en verde en ambos lados
- [ ] Persistencia con snapshot verificada releyendo histórico
- [ ] Responsive 360 px sin scroll horizontal
- [ ] Estados carga/error/fallback de la API de divisas demostrables
- [ ] README: clon limpio arranca en ≤ 5 comandos (cronometrado)
