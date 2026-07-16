---
description: Audita el código reciente con el checklist de calidad del proyecto (uso: /auditoria [ruta opcional])
---

Audita $ARGUMENTS (si está vacío: el diff desde el último commit; si tampoco hay, los últimos archivos modificados).

Checklist obligatorio:

1. **Capas**: ¿algún controller con lógica o acceso directo a Prisma? ¿`domain/` importa framework?
2. **Tamaño y cohesión**: archivos > 250 líneas o con más de una responsabilidad.
3. **Tipado**: `any`, `@ts-ignore`, tipos "a ojo" que no coinciden con `contratos-api.md`.
4. **Dinero**: cualquier float en cálculo monetario; conversiones fuera de `lib/money.ts`.
5. **Validación y errores**: DTOs completos vs. `validaciones.md`; respuestas de error fuera del contrato global.
6. **Tests**: ¿cubren los casos dorados/fixtures de las specs o solo el happy path? ¿Algún test que no afirma nada?
7. **Seguridad**: inyección (queries crudas), secretos hardcodeados, datos sin sanear en render.
8. **Higiene**: `console.log`, código muerto, duplicación evitable, comentarios de andamiaje.

Salida:

- Tabla de hallazgos: severidad (alta/media/baja) · archivo:línea · descripción · fix propuesto.
- **No apliques ningún cambio sin mi confirmación.**
- Propón la entrada correspondiente para `ai-workspace/04-proceso/auditorias.md` (incluida la sección "propuestas rechazadas" si aplica).
