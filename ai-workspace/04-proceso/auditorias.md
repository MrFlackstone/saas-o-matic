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

## Fase 5 — API de simulaciones  ·  2026-07-16

Alcance: diff de la fase (módulo `simulations`: DTOs + service + controller + module, endpoint de histórico en `customers.controller`, e2e con caso dorado). Capas correctas (controller sin lógica; el servicio no contiene aritmética — todo importe sale de `calculateSimulationCost`); snapshot completo persistido (RN-05/ADR-06); sin `any`/`@ts-ignore`/`console.log`; solo enteros; errores por el contrato global.

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | simulations.e2e-spec.ts | Test "cliente sin simulaciones" pasaba vacuamente: el cliente US ya tenía una simulación de un test anterior y la aserción por `vatRateBps` no probaba el histórico vacío | corregido: tercer cliente sin simulaciones + `toEqual([])` |
| baja | simulations.e2e-spec.ts | Aserción tautológica en el test de whitelist (`not.toHaveProperty` sobre una respuesta que nunca eco-aría el campo) | corregido: se afirma el conjunto exacto de claves de la respuesta |
| baja | simulations.e2e-spec.ts | Cotas superiores de `activeUsers`/`apiCallsMonth` sin caso 400 | corregido: e2e añadido para `activeUsers: 100001` (los tres campos comparten decoradores; un caso por cota superior basta) |
| baja | simulations.service.ts | `JSON.parse(breakdown)` sin validación estructural | aceptado: el snapshot lo escribe solo este servicio (RN-05); fila corrupta = bug interno que debe ser ruidoso (500 con log del filtro) |
| baja | dto/tier-line.dto.ts | `TierLineDto` duplica estructuralmente el `TierLine` del dominio | aceptado: metadatos Swagger no pueden vivir en `domain/` (ADR-05); el tipado cruzado (`TierLine[]` → `TierLineDto[]`) detecta divergencias en compilación |
| baja | simulations.e2e-spec.ts | ~300 líneas > soft limit 250 | aceptado: mismo criterio que fase 4 (suite cohesiva; partirla duplica setup) |

Durante la fase (previo a la auditoría): un e2e asumía 400 para campos desconocidos (`forbidNonWhitelisted`); el pipe global solo hace strip y la spec no exige rechazo → test corregido y decisión registrada en `registro-decisiones.md`.

Verificación re-ejecutada tras los fixes: lint ✔ · unit 106/106 ✔ · e2e 30/30 ✔ · build ✔. Curl manual del caso dorado contra el seed verificado (14000/2940/16940, breakdown 2 líneas, histórico desc).

### Propuestas de la IA rechazadas o corregidas
- Ninguna en esta fase: los tres hallazgos accionables se corrigieron según lo propuesto; los tres restantes se aceptaron con justificación.

## Fase 6 — Frontend base y divisas  ·  2026-07-16

Alcance: diff completo de la fase (19 archivos en `frontend/`: dominio replicado, `lib/money`, capa `api/`, hook de tasas, providers, `CurrencyPicker`, layout, router y placeholders de páginas). Capas correctas (HTTP solo en `api/`, `domain/pricing` puro); sin `any`/`@ts-ignore`/`console.log`; float solo en `formatMoney` (conversión de presentación permitida por spec); tipos de `api/types.ts` transcritos de `contratos-api.md`; archivos ≤ ~70 líneas.

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | api/exchange.ts | `readCachedRates` confiaba en el shape de la caché de localStorage (cast sin validar); caché corrupta → "Invalid Date" en el banner y filtrado de divisas impredecible | corregido: guard `isSnapshot` que degrada a `null` (= sin caché); 6 tests nuevos con stub de localStorage |
| media | domain/pricing/pricing.spec.ts | La réplica no cubría el redondeo half-up (RN-02): los casos dorados no producen medias unidades y `applyVat` podía divergir del backend sin romper tests | corregido: test espejo (`applyVat(50, 2100) → 11`, `applyVat(25, 2100) → 5`) |
| baja | lib/money.spec.ts | NBSP literal (U+00A0) invisible en `const NBSP` — trampa de edición | corregido: escape `'\u00a0'` |
| baja | components/CurrencyPicker.tsx | Spinner de carga solo visual, sin texto accesible | corregido: `role="status"` + `sr-only` "Cargando tipos de cambio…" |

Verificación re-ejecutada tras los fixes: lint ✔ (solo warnings preexistentes de shadcn) · unit 22/22 ✔ · build ✔. Estados live/loading/stale/unavailable verificados en navegador con Playwright (proveedor bloqueado con y sin caché).

### Propuestas de la IA rechazadas o corregidas
- Unificar `SimulationTierLine` (api) con `TierLine` (dominio): rechazada — duplicación deliberada; el primero transcribe `contratos-api.md` (regla "tipos de la spec, no inferidos"), el segundo pertenece a la réplica de dominio (ADR-08). Unificarlos acoplaría dominio↔API.

## Fase 7 — Dashboard, alta y detalle  ·  2026-07-16

Alcance: diff completo de la fase (10 archivos en `frontend/`: `domain/tax-id/` portado, `lib/countries.ts`, `useDebounce`, `CustomerCard`, las tres páginas y `SimulationHistory`). Capas correctas (HTTP solo en `api/`, `domain/tax-id` TypeScript puro sin imports de framework); sin `any`/`@ts-ignore`/`console.log` ni código muerto; importes solo via `lib/money.ts`; archivos ≤ 190 líneas.

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | features/customers/customer-form-schema.ts | El espejo zod no tenía tests propios: la rama ES vs ≠ES, la normalización previa y los límites de `companyName`/`email` solo se verificaban a mano; los 57 tests de `domain/tax-id` no cubren el cableado del schema | corregido: `customer-form-schema.spec.ts` con 47 tests (fixture fiscal por rama, normalización, cotas 1/2/120/121 y 254, país/plan fuera de lista) |
| media | features/customers/SimulationHistory.tsx | Dos componentes en un archivo: `SimulationRow` (~85 líneas, con estado propio) junto a `SimulationHistory` — viola "una clase/componente por archivo" | corregido: `SimulationRow.tsx` extraído |
| baja | features/customers/NewCustomerPage.tsx | `detail.field as (typeof formFields)[number]` tras el `filter` — seguro pero es cast, no estrechamiento | corregido: type guard `isFormField` |
| baja | features/customers/NewCustomerPage.tsx | `aria-describedby="X-error"` apuntaba a un id inexistente mientras no hay error (`FieldError` devuelve `null`): referencia colgante, inválida en ARIA | corregido: `aria-describedby` condicional al error (+ `aria-invalid` en los dos `SelectTrigger`, que no lo tenían) |
| baja | SimulationHistory.tsx + CustomerDetailPage.tsx | Formateo bps→`21 %` duplicado en dos archivos | corregido: `formatVatRate(bps)` centralizado en `lib/money.ts` |
| baja | CustomerCard.tsx + SimulationHistory.tsx + CurrencyPicker.tsx | Tres formateadores de fecha ad-hoc (`formatDate`, `formatDateTime`, `formatUpdatedAt`) | corregido: `lib/dates.ts` con `formatDate`/`formatDateTime` compartidos |
| baja | features/customers/CustomerDetailPage.tsx | `const { id = '' } = useParams()` — con `id` vacío haría `GET /customers/` (shape de lista ≠ `CustomerResponse`); inalcanzable con las rutas actuales, pero el fallback silencioso ocultaba el invariante | corregido: `enabled: id !== ''` + render de error explícito |

Aceptado sin cambio: los helpers presentacionales sin estado y de menos de 15 líneas conviven con su página (`ResultsSkeleton` en `DashboardPage`, `FieldError` en `NewCustomerPage`) — el límite "un componente por archivo" se aplica a componentes con estado o lógica; extraerlos sería fragmentación sin valor. Skeleton en cada cambio de búsqueda: la spec pide skeleton en carga y no menciona `placeholderData`.

Verificación re-ejecutada tras los fixes: lint ✔ (solo los 2 warnings preexistentes de fast-refresh en shadcn) · unit 126/126 ✔ · build ✔. Recorrido live con Playwright contra el backend sembrado: histórico de Acme con `SimulationRow` ya extraído (tramo 1: 10 × 11,45 US$ = 114,49 US$; tramo 2: 5 × 9,16 US$ = 45,80 US$; base 160,29 US$, IVA (21 %) 33,66 US$, total 193,95 US$ — idéntico a la verificación previa a la extracción) y formulario de alta sin referencias ARIA colgantes ni en reposo ni con los cinco campos en error.

### Propuestas de la IA rechazadas o corregidas
- Ninguna en esta fase: los siete hallazgos accionables se corrigieron según lo propuesto.

## Fase 8 — Simulador interactivo  ·  2026-07-16

Alcance: diff de la fase (`features/simulator/`, `CostBreakdownTable` extraído de `SimulationRow`, `lib/number-format.ts`, infraestructura de test de componentes). Capas correctas (`domain/pricing` sigue puro; HTTP solo en `api/`); sin `any`/`@ts-ignore`/`console.log` ni código muerto; cero aritmética monetaria en componentes (toda conversión via `lib/money.ts`; `toSliderPosition` opera sobre usuarios, no importes); `simulator-form-schema` cuadra 1:1 con `validaciones.md` (líneas 82–84).

### Hallazgos
| Severidad | Archivo | Hallazgo | Acción |
|---|---|---|---|
| media | features/simulator/SimulatorCard.tsx | Los tres campos numéricos repetían el mismo bloque `Controller`+`Input`+`FieldError` (formato de miles y parseo idénticos ×3); el archivo llegaba a 207 líneas con dos responsabilidades | corregido: cableado común en `numeric-input.ts` + `NumericField.tsx` (campos simples) y `UsersField.tsx` (layout inline + slider). `SimulatorCard` 207 → 109 líneas |
| media | features/simulator/SimulatorCard.tsx + features/customers/NewCustomerPage.tsx | `FieldError` duplicado **literalmente** en dos archivos | corregido: `components/FieldError.tsx` compartido. Revierte la excepción aceptada en la auditoría de fase 7 ("helpers presentacionales < 15 líneas conviven con su página"): esa excepción se justificaba con un único uso; con dos copias el criterio que manda es DRY |
| baja | features/simulator/SimulatorCard.tsx | `error.details[0]?.message` descartaba en silencio el resto de `details[]` del contrato: con >1 error de campo el usuario solo veía el primero | corregido: `error-message.ts` con `toErrorMessage` (concatena todos los detalles; `error.message` como fallback del 404) + 3 tests |
| baja | features/simulator/ | Sin test automatizado de `SimulatorCard`: sincronía slider↔input, clamp >500 y guard de doble submit solo cubiertos por la verificación manual de la sesión. La fase solo exigía el test del panel, así que no era incumplimiento, pero era la parte sin red de seguridad | corregido: `SimulatorCard.spec.tsx` (6 tests: teclado, clamp a 500, retirada de la proyección fuera de rango, un solo envío con doble click, submit bloqueado si el form es inválido, reset tras guardar) |
| baja | features/simulator/SimulatorCard.tsx | Exportar `toErrorMessage` junto al componente introdujo un warning nuevo de oxlint (`only-export-components`) — el mismo que la fase 6 decidió mantener acotado a los shadcn generados | corregido: función movida a `error-message.ts`; el lint vuelve a los 2 warnings preexistentes |

Detectado durante la fase (previo a la auditoría): `parseIntegerInput` compactaba con `replace(/\D/g, '')`, lo que convertía `"1,5"` en `15` — cambio silencioso de magnitud en un campo persistido. Su propio test lo cazó antes de integrarse; la función pasa a rechazar en vez de compactar (decisión registrada).

Aceptado sin cambio: `role="status"` + `aria-live="polite"` es técnicamente redundante, pero `spec-frontend.md:55` exige `aria-live` de forma explícita y la spec manda sobre la optimización.

Verificación re-ejecutada tras los fixes: lint ✔ (solo los 2 warnings preexistentes de shadcn) · unit 161/161 ✔ · build ✔. Recorrido live con Playwright contra el backend sembrado, repetido **después** del refactor: caso dorado en EUR (tramo 1: 10 × 10,00 € = 100,00 €; tramo 2: 5 × 8,00 € = 40,00 €; base 140,00 €, IVA (21 %) 29,40 €, total 169,40 €), cero peticiones de red al mover el slider (lista de requests idéntica antes y después), paridad exacta proyección↔fila persistida al expandir el desglose, conversión coherente de panel e histórico a GBP, un único POST con doble click, toast destructivo real con el backend caído (`ERR_CONNECTION_REFUSED`) y botón deshabilitado con spinner en vuelo, y 360 px sin scroll horizontal (`scrollWidth === clientWidth`). Alta de cliente revalidada tras extraer `FieldError`: errores inline y `aria-describedby` resolviendo a elementos reales.

### Propuestas de la IA rechazadas o corregidas
- Unificar `CostBreakdownLine` con `SimulationTierLine` (api) o `TierLine` (dominio): rechazada — es el contrato de props del componente; acoplarlo a cualquiera de los dos invertiría la dependencia y contradiría lo ya decidido en la auditoría de fase 6.
- Mapear los `details[]` del error a los campos con `setError` (patrón del alta): rechazada — la fase 8 exige "toast destructivo con mensaje del contrato de error"; el mapeo silencioso a campos incumpliría el criterio. Se conserva el toast y se concatenan los detalles.
