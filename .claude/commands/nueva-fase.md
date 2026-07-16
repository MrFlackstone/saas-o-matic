---
description: Ejecuta el plan de acción de una fase del ai-workspace (uso: /nueva-fase 04)
---

Vas a ejecutar la fase **$ARGUMENTS** del plan de desarrollo.

1. Localiza y lee `ai-workspace/03-prompts/fase-$ARGUMENTS*.md`.
2. Lee TODAS las specs listadas en su sección "Specs de referencia". Son la fuente de verdad; no implementes de memoria.
3. Presenta un resumen de: objetivo, plan de acción paso a paso y criterios de aceptación. **Espera mi confirmación antes de tocar ningún archivo.**
4. Tras mi OK, implementa paso a paso respetando las restricciones de la fase y las reglas de `CLAUDE.md`.
5. Ejecuta la sección "Verificación" de la fase y muestra la salida real (no la resumas si hay fallos: enséñalos y corrígelos).
6. Cierra con: lista de archivos tocados, decisiones tomadas dignas de registro (propón la entrada para `ai-workspace/04-proceso/registro-decisiones.md`) y el commit sugerido de la fase.

Si algún criterio de aceptación no se puede cumplir, dilo explícitamente en vez de darlo por bueno.
