# Metodología de trabajo con IA

Este workspace documenta cómo he diseñado, planificado y construido **SaaS-O-Matic** trabajando con Claude Code como copiloto, manteniendo yo el control de arquitectura, calidad y seguridad.

## Ciclo de trabajo

Cada funcionalidad sigue el mismo ciclo:

```
Spec ──▶ Plan de acción ──▶ Sesión con IA ──▶ Auditoría ──▶ Commit
 │            │                   │                │
 01-specs   03-prompts      una fase = una      04-proceso
                            sesión aislada      (hallazgos y decisiones)
```

1. **Spec primero** (`01-specs/`): reglas de negocio, contratos de API y validaciones cerradas *antes* de escribir código. Las ambigüedades del enunciado se resuelven y justifican por escrito.
2. **Plan de acción** (`03-prompts/`): cada fase de desarrollo tiene un prompt estructurado con objetivo, specs de referencia, restricciones, pasos, criterios de aceptación y comandos de verificación.
3. **Sesión con IA**: una fase por sesión (contexto limpio). La IA propone, yo reviso todo el diff antes de aceptar.
4. **Auditoría** (`04-proceso/`): revisión del código generado con checklist (capas, tamaño de archivos, validaciones, tests). Las propuestas subóptimas rechazadas quedan registradas.
5. **Commit atómico** una vez pasan lint + tests + build.

## Cómo guío a la IA

Tres mecanismos (detalle en `02-arquitectura/directrices-ia.md`):

- **`CLAUDE.md`** en la raíz: reglas persistentes de arquitectura y calidad que la IA carga en cada sesión.
- **Comandos personalizados** (`.claude/commands/`): `/nueva-fase N` ejecuta el plan de la fase N; `/auditoria` pasa el checklist de calidad sobre el diff.
- **Specs como fuente de verdad**: la IA tiene prohibido inventar reglas de negocio; si la spec no cubre un caso, se detiene y pregunta.

## Mapa del workspace

| Carpeta | Contenido | Dimensión evaluada |
|---|---|---|
| `01-specs/` | Reglas de negocio, contratos API, validaciones, spec frontend | Planificación y specs |
| `02-arquitectura/` | Decisiones (ADRs), esquema BD, estructura de carpetas, directrices IA | Definición de arquitectura |
| `03-prompts/` | 10 planes de acción (fase 0 a 9) usados para guiar a la IA | Planificación y specs |
| `04-proceso/` | Registro de decisiones, auditorías, capturas de sesiones reales | Vibe coding y control de calidad |
