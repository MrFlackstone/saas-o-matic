# Directrices dadas a la IA y configuración del entorno

Trabajo con **Claude Code**. El control de calidad no depende de "pedirle por favor código limpio" en cada prompt: está **institucionalizado en la configuración del repositorio**, de forma que cualquier sesión nueva arranca ya restringida.

## 1. `CLAUDE.md` en la raíz (reglas persistentes)

Claude Code lo carga automáticamente en cada sesión. Contiene las reglas innegociables; las claves:

- **Specs como fuente de verdad**: antes de implementar, leer la spec correspondiente en `ai-workspace/01-specs/`. Prohibido inventar reglas de negocio; ante un hueco, parar y preguntar.
- **Reglas de capas** (de `estructura-carpetas.md`): `domain/` puro, controllers finos, acceso a BD solo desde servicios vía `PrismaService`.
- **Anti archivo-masivo**: soft limit de 250 líneas por archivo; un componente/clase por archivo. Si algo crece, extraer módulo, no seguir añadiendo.
- **Dinero**: solo enteros (céntimos, bps). Float en un cálculo monetario = rechazo automático en revisión.
- **Definition of Done**: `lint + test + build` en verde antes de cada commit; sin `any`, sin `ts-ignore`, sin `console.log` residuales.
- **Dependencias**: no añadir paquetes sin proponerlo y justificarlo primero.

Ver el archivo real: [`../../CLAUDE.md`](../../CLAUDE.md).

## 2. Comandos personalizados (`.claude/commands/`)

Estandarizan el ciclo para que cada fase se ejecute igual:

- **`/nueva-fase N`** — carga `ai-workspace/03-prompts/fase-N…md`, lee sus specs de referencia, presenta el plan y los criterios de aceptación, y solo tras mi confirmación implementa y ejecuta la verificación.
- **`/auditoria`** — pasa el checklist de calidad sobre el diff reciente (capas, tamaños, validaciones, tests, seguridad, duplicación) y registra hallazgos en `04-proceso/auditorias.md`. Lo ejecuto al cerrar cada fase, con la IA como primer revisor y yo como segundo.

## 3. Disciplina de sesión

- **Una fase = una sesión** con contexto limpio (`/clear`): la IA trabaja con la spec y el plan, no con restos de conversaciones anteriores.
- **Plan antes que código**: la IA expone su plan y lo apruebo/corrijo antes de que toque archivos.
- **Verificación obligatoria**: cada plan de fase termina con comandos concretos (`pnpm test`, `pnpm lint`, arranque real) que deben pasar antes de dar la fase por cerrada.
- **Revisión humana**: leo el diff completo. Lo que no entiendo, no se mergea: se pregunta o se rehace. Rechazos documentados en `04-proceso/auditorias.md`.

## Por qué así

El objetivo es que la calidad sea una **propiedad del sistema de trabajo, no del prompt de turno**: specs cerradas antes de codificar, reglas cargadas automáticamente en cada sesión, un ciclo repetible por fase y auditoría con evidencia al final de cada una.
