# Auditorías de código generado por IA

Al cerrar cada fase ejecuto `/auditoria` (checklist: capas, tamaño de archivos, `any`/`ts-ignore`, validaciones, contrato de errores, tests significativos, seguridad, duplicación) y reviso el diff completo a mano. Aquí queda el resultado.

Formato por fase:

```
## Fase N — <nombre>  ·  <fecha>

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| alta/media/baja | ruta | descripción | corregido en <commit> / aceptado con justificación |

### Propuestas de la IA rechazadas o corregidas
- **Propuso**: <qué generó la IA>
  **Rechazado/corregido porque**: <criterio técnico>
  **Solución final**: <qué se hizo>
```

> Nota de método: registro las correcciones **reales** conforme ocurren (con captura si es ilustrativa en `capturas/`). Un desarrollo con IA sin ninguna corrección humana no es señal de calidad, sino de revisión inexistente.

---

<!-- Entradas por fase a partir de aquí -->

## Fase 0 — Scaffold  ·  2026-07-16

Alcance: todo el diff de la fase (scaffold backend NestJS + frontend Vite, sin commit previo). Sin `any`/`@ts-ignore`/`console.log`; capas correctas; archivos < 250 líneas; CORS restringido; tests con aserciones reales. Dinero y DTOs: N/A en esta fase.

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| alta | backend/eslint.config.mjs | Scaffold Nest trae `no-explicit-any: off`, contradice el estándar del proyecto | corregido: `error` (commit de fase 0) |
| media | backend/eslint.config.mjs | `no-floating-promises` / `no-unsafe-argument` en warn no bloquean lint | corregido: ambas a `error` |
| media | frontend/.oxlintrc.json | oxlint sin regla contra `any` (no viene en el default) | corregido: `typescript/no-explicit-any: error` |
| baja | frontend/public/icons.svg | Asset muerto del template Vite | corregido: eliminado |
| baja | backend/README.md | README boilerplate de Nest sin adaptar | corregido con otro criterio (ver abajo) |

Lint re-ejecutado en verde en ambas apps tras elevar las reglas.

### Propuestas de la IA rechazadas o corregidas
- **Propuso**: sustituir `backend/README.md` por un README breve del servicio (o diferirlo a fase 9).
  **Rechazado/corregido porque**: se prefiere un único README global en la raíz; READMEs por app duplican documentación.
  **Solución final**: eliminados `backend/README.md` y `frontend/README.md`; la documentación de arranque vive solo en `README.md` raíz.

## Fase 1 — Base de datos y seed  ·  2026-07-16

Alcance: diff de la fase (Prisma 7: schema + migración init, `prisma.config.ts`, `PrismaModule`/`PrismaService`, seed idempotente, specs actualizadas). Capas correctas (nada de Prisma fuera de `src/prisma/`; `domain/` puro); sin `any`/`@ts-ignore`; solo enteros en importes (casos dorados verificados contra RN-01/RN-02); sin queries crudas ni secretos. Tests y DTOs: N/A en esta fase (el DoD aplica a `domain/` y endpoints, que nacen en fases 2+).

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | backend/package.json | rtk `pnpm lint` no cubría `prisma/seed.ts` | corregido: patrón ampliado a `{src,apps,libs,test,prisma}` |
| media | prisma.config.ts / prisma.service.ts / seed.ts | URL `file:./prisma/dev.db` duplicada ×3 | aceptado como excepción DRY documentada: compartir constante acoplaría el config del CLI con código de `src/` |
| baja | backend/package.json | `collectCoverageFrom` incluiría `src/generated/` (ruido en fase 2) | corregido: exclusión `!generated/**` |
| baja | backend/prisma/seed.ts | `TierLine` duplicado localmente (el tipo canónico era de fase 2) | corregido: creado `src/domain/pricing/types.ts` y el seed lo importa |
| baja | backend/prisma/seed.ts | Comentarios "caso dorado" y `console.error` en catch | mantenidos: documentan restricción de spec / salida legítima de script CLI |

rtk `pnpm lint && pnpm test && pnpm build && pnpm db:seed` re-ejecutados en verde tras los fixes (lint reformateó el seed al entrar en el patrón).

### Propuestas de la IA rechazadas o corregidas
- **Propuso**: diferir a fase 2 la exclusión de cobertura y el tipo `TierLine` en `domain/`.
  **Corregido porque**: se prefirió cerrarlos dentro de la propia fase 1 en lugar de arrastrar deuda.
  **Solución final**: ambos aplicados ahora; `src/domain/pricing/types.ts` queda creado y fase 2 lo reutiliza.

## Fase 2 — Motor de pricing  ·  2026-07-16

Alcance: diff de la fase (`domain/pricing/`: types ampliado, `tiers.ts`, `pricing-engine.ts`, suite con 8 casos dorados + IVA + half-up + extensión ADR-07). Dominio 100 % puro (grep sin `@nestjs`/`@prisma`/`express`); solo aritmética entera; cobertura 100 % de ramas; sin `any`/`@ts-ignore`/`console.log`; archivos < 250 líneas. DTOs/seguridad: N/A en esta fase.

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | pricing-engine.ts | `activeUsers` no entero produciría céntimos fraccionales; el DTO (fase 3) restringe el rango pero el dominio no defendía su propia invariante | corregido: guard fail-fast `Number.isInteger` → `Error` de dominio (+2 tests: 5.5 y NaN). Descartado `Math.trunc` por corrección silenciosa; con snapshot inmutable (RN-05) un bug ruidoso es preferible a persistir un presupuesto corrupto |
| baja | tiers.ts | Invariante estructural de `PRICING_TIERS` (contigüidad, último tramo abierto, numeración) sin test propio: una edición futura de tarifas mal hecha solo fallaría vía casos dorados | corregido: `tiers.spec.ts` con 3 tests de invariantes |
| baja | types.ts | `PricingInput` omite `storageGb`/`apiCallsMonth` del contrato de simulación | aceptado: deliberado (A2/ADR-07), se amplía cuando esos componentes se tarifiquen |

rtk `jest --coverage` re-ejecutado tras los fixes: 23/23 en verde, 100 % ramas se mantiene; lint y build en verde.

### Propuestas de la IA rechazadas o corregidas
- Ninguna en esta fase: los tres hallazgos se resolvieron según lo propuesto (guard A elegido entre 3 opciones analizadas: guard fail-fast, trunc defensivo, aceptar sin cambio).

## Fase 3 — Validador fiscal  ·  2026-07-16

Alcance: diff de la fase (`domain/tax-id/`: normalize, types, spanish-tax-id, validate-spanish-tax-id + spec con 57 tests). Dominio 100 % puro (cero imports); tabla de fixtures completa de la spec en verde con `kind` correcto; cobertura 100 % de ramas; archivos < 65 líneas; sin `any`/`@ts-ignore`/`console.log`. Dinero/seguridad: N/A (funciones puras sobre strings).

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | validate-spanish-tax-id.ts | Firma `(value: string)` no cumplía la política "basura `null`-safe" de `validaciones.md`: un `null` runtime (bug del servicio antes del DTO) lanzaría `TypeError` en `trim()`, rompiendo el contrato "nunca lanza" | corregido: firma `(value: unknown)` + guard `typeof !== 'string'` → `{ valid: false, reason }` (+5 tests: `null`, `undefined`, `123`, `{}`, array) |
| baja | types.ts | `kind?` opcional frente a la firma literal de la spec (sin `?`) | aceptado: desviación consciente — la basura no clasificable no tiene tipo asignable |
| baja | validate-spanish-tax-id.ts | Se devuelve `kind` también con `valid: false` cuando el formato se reconoce pero falla el control | aceptado: la spec no lo prohíbe y alimenta el mensaje del 400 `TAX_ID_INVALID` |

`jest --coverage` re-ejecutado tras el fix: 57/57 en verde, 100 % ramas se mantiene; lint y build en verde. Fixtures extra derivados a mano (K/L/M, políticas de control del CIF) registrados en `registro-decisiones.md`.

### Propuestas de la IA rechazadas o corregidas
- Ninguna en esta fase: el hallazgo medio se corrigió según lo propuesto; los dos bajos se aceptaron con justificación.

## Fase 4 — API de clientes  ·  2026-07-16

Alcance: diff de la fase (`common/` filtro global de excepciones + exceptionFactory con códigos por campo, `customers/` módulo completo con DTOs/servicio/controller/Swagger, e2e con BD SQLite temporal; `test:e2e` con `--experimental-vm-modules` por el compilador WASM de Prisma 7). Capas ✔ (controller fino, dominio consumido desde el servicio, sin Prisma en controllers); shapes y códigos verificados contra `contratos-api.md`/`validaciones.md` por 17 e2e + 15 unit del servicio; fixtures dorados de la spec (`B58818501`, `B58818500`, `B12345674`, `Q2818002D`, `12345678Z`); sin `any`/`@ts-ignore`/`console.log`; queries parametrizadas via Prisma.

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | http-exception.filter.ts | El catch-all producía el 500 con contrato pero sin log: stack trace del bug perdido (fallo silencioso) | corregido: `Logger.error` solo para excepciones no-HTTP (+test que verifica que las HTTP no se loguean) |
| baja | http-exception.filter.ts | Ramas payload-string / message-array / no-HttpException sin test unitario | corregido: `http-exception.filter.spec.ts` con 4 tests (host mockeado, spy sobre `Logger`) |
| baja | customers/dto/* | Literal `'VALIDATION_ERROR'` duplicado 8 veces teniendo `FALLBACK_VALIDATION_CODE` exportada | corregido: los DTOs importan la constante de `common/` |
| baja | customers.service.ts | `countryCode` sensible a mayúsculas: `"es"` → 400 `COUNTRY_UNKNOWN`; la spec no cubría la normalización del país | corregido **spec-first**: regla añadida a `validaciones.md` (trim → mayúsculas antes de consultar `countries`) y aplicada en el servicio (+test) |
| baja | customers.e2e-spec.ts | 387 líneas > soft limit 250 | aceptado: archivo de test cohesivo de un solo grupo de endpoints; partirlo duplicaría el setup sin ganancia |

Verificación re-ejecutada tras los fixes: lint ✔ · unit 100/100 ✔ · e2e 19/19 ✔ · build ✔.

### Propuestas de la IA rechazadas o corregidas
- Ninguna en esta fase: los cuatro primeros hallazgos se corrigieron según lo propuesto (el de `countryCode` con actualización previa de la spec por decisión de Diego); el quinto se aceptó con justificación.
