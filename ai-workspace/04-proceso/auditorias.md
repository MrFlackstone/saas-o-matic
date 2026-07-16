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
