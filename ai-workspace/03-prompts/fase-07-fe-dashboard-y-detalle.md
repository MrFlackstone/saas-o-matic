# Fase 7 — Dashboard, alta y detalle de cliente

## Objetivo

Vistas obligatorias: buscador con estados completos, formulario de alta con validación espejo y detalle con cards + histórico de simulaciones.

## Specs de referencia (leer antes)

- `ai-workspace/01-specs/spec-frontend.md` (vistas, estados, accesibilidad)
- `ai-workspace/01-specs/validaciones.md` (reglas espejo para zod, incluido el algoritmo fiscal en cliente)

## Restricciones

- Cada fuente de datos remota renderiza sus 4 estados: loading (skeleton), error (mensaje + reintentar), vacío, éxito. Sin estados en blanco.
- Validación zod espejo de la spec; el 409 del servidor se mapea al campo `taxId`.
- Componentes de página en `features/`, reutilizables en `components/`; ninguno >250 líneas.

## Plan de acción

1. **Dashboard (`features/dashboard/`)**: input con `useDebounce` 300 ms → `GET /customers?search=`; grid responsive 1/2/3 columnas de `CustomerCard` (nombre, taxId, país, badge de plan, fecha); estados vacío/cargando/error; CTA "Nuevo cliente".
2. **Alta (`features/customers/NewCustomerPage`)**: `react-hook-form` + zod (companyName 2–120, email, país de un `select` alimentado por la lista sembrada — hardcodear las 10 de RN-02 en `lib/countries.ts` con nombre/código, plan select); validación fiscal española en cliente reutilizando un `validateSpanishTaxId` portado a `src/domain/tax-id/` con los mismos fixtures (test Vitest); submit → toast éxito → navegar a detalle; errores de API mapeados por campo.
3. **Detalle (`features/customers/CustomerDetailPage`)**: card de datos del cliente (incluye IVA del país); `SimulationHistory` con `GET /customers/:id/simulations` — cada fila: fecha, usuarios/GB/llamadas, total en **divisa activa**, desglose expandible (líneas de tramo + base + IVA); estados completos; botón que hace scroll/focus al simulador (fase 8 lo añade).
4. Accesibilidad: labels, focus visible, contraste AA, navegación por teclado en cards.

## Criterios de aceptación

- [ ] Búsqueda por nombre y por CIF del seed encuentra al cliente demo.
- [ ] Alta con `B58818500` muestra error inline sin llegar al servidor; con `B58818501` duplicado muestra el 409 en el campo.
- [ ] Histórico muestra la simulación demo de 140 € base y cambia al vuelo con el selector de divisa.
- [ ] 360 px de ancho sin scroll horizontal.
- [ ] `pnpm test` (fixtures fiscales cliente) y `pnpm build` verdes.

## Verificación

```bash
cd frontend && pnpm lint && pnpm test && pnpm build && pnpm dev
# backend levantado: recorrer búsqueda → alta → detalle manualmente
```

## Al terminar

`/auditoria`. Commit sugerido: `feat(front): dashboard con buscador, alta validada y detalle con histórico`.
