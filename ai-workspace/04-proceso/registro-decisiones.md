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
|  |  |  |  |  |

## Checklist final contra la rúbrica (completar en fase 9)

- [ ] Validación fiscal: tabla de fixtures en verde (backend y frontend)
- [ ] Tramos: 8 casos dorados en verde en ambos lados
- [ ] Persistencia con snapshot verificada releyendo histórico
- [ ] Responsive 360 px sin scroll horizontal
- [ ] Estados carga/error/fallback de la API de divisas demostrables
- [ ] README: clon limpio arranca en ≤ 5 comandos (cronometrado)
