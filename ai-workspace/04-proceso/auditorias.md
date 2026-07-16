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
