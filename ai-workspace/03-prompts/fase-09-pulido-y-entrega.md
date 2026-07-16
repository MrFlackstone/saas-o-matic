# Fase 9 — Pulido, README, CI y auditoría final

## Objetivo

Cerrar la entrega: README sin fricciones (10 % de la nota), CI, barrido de calidad y verificación contra la rúbrica.

## Specs de referencia (leer antes)

- `README.template.md` en la raíz (esqueleto a completar)
- `ai-workspace/00-metodologia.md` (para el mapa del workspace en el README)

## Plan de acción

1. **README.md** (español) desde la plantilla:
   - Requisitos: Node ≥ 20, pnpm.
   - Quickstart exacto de 2 terminales:
     ```bash
     cd backend && pnpm install && pnpm db:setup && pnpm start:dev
     cd frontend && pnpm install && pnpm dev
     ```
   - Tabla de scripts, URL de Swagger (`/docs`), datos demo del seed (decir que ya hay clientes y simulaciones para probar), sección de arquitectura (5 líneas + enlace a `ai-workspace/`), capturas de pantalla, sección "Cómo se construyó con IA" enlazando `ai-workspace/00-metodologia.md`.
2. **CI** `.github/workflows/ci.yml`: dos jobs (backend: install, lint, test, test:e2e; frontend: install, lint, test, build) con pnpm y caché.
3. **Barrido de calidad**:
   - `/auditoria` global final (todo el repo).
   - Buscar y eliminar: `console.log`, `any`, `ts-ignore`, código muerto, comentarios de andamiaje.
   - Cobertura de `domain/` al 100 %; revisar nombres y consistencia de mensajes de error.
4. **Verificación de rúbrica** (checklist en `04-proceso/registro-decisiones.md`):
   - Validación fiscal correcta (fixtures) · cálculo de tramos exacto (casos dorados) · persistencia con snapshot · responsive · estados de carga/error de la API externa · README ≤ 5 comandos.
5. **Opcional si sobra tiempo**: smoke e2e con Playwright (alta → simular → guardar → cambiar divisa) y `docker-compose.yml`; si no, no se empieza.
6. Clon limpio en otra carpeta: seguir el README al pie de la letra y cronometrar. Si algo falla o requiere pasos no escritos, arreglar el README.

## Criterios de aceptación

- [ ] Un clon limpio arranca ambas apps siguiendo solo el README.
- [ ] CI en verde en GitHub.
- [ ] Cero `console.log`/`any`/`ts-ignore` en `src/`.
- [ ] Checklist de rúbrica completo con evidencia enlazada.

## Verificación

```bash
git clone <repo> /tmp/prueba && cd /tmp/prueba   # seguir README literalmente
```

## Al terminar

Commit sugerido: `docs(readme): guía de arranque, capturas y CI`.
