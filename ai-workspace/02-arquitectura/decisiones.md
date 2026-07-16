# Decisiones de arquitectura (ADRs)

Formato corto: contexto → decisión → alternativas descartadas → consecuencias.

## ADR-01 — Backend con NestJS (TypeScript)

- **Contexto**: el enunciado prefiere Node.js (TS) o Python; se evalúa modularidad y código limpio.
- **Decisión**: NestJS con módulos por contexto (`customers`, `simulations`) + capa de dominio pura.
- **Alternativas**: Express (más control, más boilerplate para lograr la misma disciplina), Fastify (validación por JSON-schema pero menos estructura de proyecto), FastAPI (stack distinto al del frontend).
- **Consecuencias**: DI, DTOs con `class-validator`, pipes/filters globales y testing integrado.

## ADR-02 — Prisma como ORM sobre SQLite

- **Contexto**: SQLite es requisito; quiero migraciones versionadas y tipado end-to-end.
- **Decisión**: Prisma (schema declarativo, `prisma migrate`, cliente tipado, seed integrado).
- **Alternativas**: TypeORM (migraciones más frágiles, decoradores acoplados a entidades), `better-sqlite3` a pelo (SQL manual, sin migraciones gestionadas).
- **Consecuencias**: el esquema vive en `prisma/schema.prisma` (documentación viva); las migraciones commiteadas permiten `migrate deploy` reproducibles.

## ADR-03 — Dinero en céntimos (`Int`) e IVA en puntos básicos

- **Contexto**: cálculos monetarios; el float acumula error binario.
- **Decisión**: importes en céntimos enteros; tipos de IVA en bps (2100 = 21 %); redondeo _half-up_ documentado en RN-02.
- **Alternativas**: `Decimal` (Prisma lo mapea a string en SQLite, fricción), float (descartado por corrección).
- **Consecuencias**: aritmética exacta con enteros; el formateo a unidades es responsabilidad exclusiva de la capa de presentación.

## ADR-04 — EUR canónico; conversión de divisa solo en presentación

- **Contexto**: el dashboard permite cambiar divisa en tiempo real con una API externa.
- **Decisión**: backend calcula y persiste solo EUR; el frontend convierte para mostrar (RN-03).
- **Alternativas**: convertir en backend (acopla la persistencia a un dato volátil, rompe el histórico), persistir importes convertidos (duplica fuentes de verdad).
- **Consecuencias**: histórico estable e independiente de tasas; la API externa puede caer sin afectar a los datos.

## ADR-05 — Capa de dominio pura (sin framework)

- **Contexto**: las dos piezas con más riesgo (pricing por tramos y validación fiscal) deben ser auditables y testeables al 100 %.
- **Decisión**: `src/domain/` contiene solo TypeScript puro: sin imports de Nest, Prisma ni HTTP. Los servicios de Nest orquestan; el dominio decide.
- **Alternativas**: lógica en servicios de Nest (acopla negocio a infraestructura y complica los tests).
- **Consecuencias**: tests unitarios instantáneos sin mocks; la regla "domain no importa framework" es verificable en revisión y está en `CLAUDE.md`.

## ADR-06 — Snapshot del desglose en cada simulación

- **Contexto**: tarifas e IVA pueden cambiar; el histórico es un presupuesto entregado a un cliente.
- **Decisión**: persistir por simulación el desglose por tramos, `vatRateBps` aplicado y totales (RN-05).
- **Alternativas**: recalcular al leer (el histórico mutaría al cambiar tarifas).
- **Consecuencias**: columna JSON (`breakdown`); auditabilidad de cualquier presupuesto pasado.

## ADR-07 — Motor de precios composable

- **Contexto**: el enunciado registra almacenamiento y llamadas API sin tarifa (ambigüedad A2); es previsible que se tarifiquen.
- **Decisión**: el motor recibe una lista de componentes de coste; v1 incluye solo `UserTiersComponent`. Añadir `StorageComponent` es añadir un elemento, no reescribir.
- **Consecuencias**: extensión sin tocar el cálculo existente (OCP); la decisión de no tarificar queda documentada, no implícita.

## ADR-08 — Función de pricing replicada en frontend

- **Contexto**: el simulador exige proyección en tiempo real al mover el slider; llamar a la API en cada tick añade latencia y carga.
- **Decisión**: replicar la función pura de tramos en el cliente para la vista previa; el `POST /simulations` recalcula en servidor, que es la única fuente autoritativa de lo persistido.
- **Alternativas**: endpoint de cálculo con debounce (UX peor, red innecesaria), paquete compartido en monorepo con workspaces (tooling extra no justificado para ~40 líneas).
- **Consecuencias**: duplicación controlada — ambas copias se validan contra la **misma tabla de casos dorados** de RN-01; cualquier divergencia rompe los tests de uno de los dos lados.

## ADR-09 — Monorepo simple: `backend/` + `frontend/` independientes

- **Contexto**: la entrega es un único repositorio que debe levantarse "en pocos pasos y sin fricciones".
- **Decisión**: dos aplicaciones autocontenidas con sus propios `package.json`.
- **Consecuencias**: quickstart de dos terminales sin tooling previo; el coste es la duplicación asumida en ADR-08.
