# Spec del frontend (Dashboard Comercial)

Stack: React 18 + Vite + TypeScript estricto, Tailwind CSS, shadcn/ui, TanStack Query, react-router, react-hook-form + zod.

## Rutas

| Ruta              | Vista                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| `/`               | Dashboard: buscador + resultados                                              |
| `/clientes/nuevo` | Alta de cliente                                                               |
| `/clientes/:id`   | Detalle: cards de cliente + histórico de simulaciones + simulador interactivo |

## Selector de divisa (global)

- En el header. Opciones: EUR, USD, GBP, CHF, JPY, MXN (obtenidas de la respuesta de `open.er-api.com/v6/latest/EUR`).
- Estado global en `CurrencyContext` (código + tasa). Persistido en `localStorage`.
- **Regla**: todo importe visible pasa por `formatMoney(cents, currency, rate)` → `Intl.NumberFormat`. Cambiar divisa re-renderiza todos los importes (dashboard, histórico, simulador) en tiempo real.
- Tipos de cambio con TanStack Query: `staleTime` 12 h, `gcTime` 24 h, `retry: 2`, última respuesta buena persistida en `localStorage`.

**Estados de la API externa** (criterio de evaluación explícito):

| Estado                 | Comportamiento                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Cargando               | Selector deshabilitado con spinner; importes en EUR                                                     |
| OK                     | Selector activo, conversión en vivo                                                                     |
| Error con caché previa | Se usa la última tasa conocida + banner "Tipos de cambio del `<fecha>` (sin conexión con el proveedor)" |
| Error sin caché        | Forzado a EUR + banner de aviso; botón reintentar                                                       |

## Vista: Dashboard (buscador)

- Input con debounce 300 ms → `GET /customers?search=`.
- Estados: **skeleton** (cargando), **vacío** ("Sin resultados para «X»" + botón alta), **error** (mensaje + botón reintentar), **éxito** (grid de cards responsive: 1 col móvil / 2 tablet / 3 escritorio).
- Card de resultado: nombre, `taxId`, país (bandera/código), plan (badge), fecha de alta → click navega a detalle.
- Botón de "Nuevo cliente".

## Vista: Alta de cliente

- Formulario `react-hook-form` + zod espejo de `validaciones.md` (incluido algoritmo DNI/NIE/CIF en cliente para feedback inmediato — el servidor revalida).
- Errores de campo inline; error 409 del servidor mapeado al campo `taxId`.
- Éxito → toast + redirección al detalle.

## Vista: Detalle de cliente

1. **Card de datos**: nombre, `taxId`, email, país + IVA aplicable, plan.
2. **Histórico de simulaciones**: lista descendente; cada entrada muestra usuarios/almacenamiento/llamadas y total en la **divisa seleccionada** (con desglose expandible: tramos, base, IVA). Estados vacío/cargando/error propios.
3. **Simulador interactivo** (misma página, card destacada):
   - Slider de usuarios 1–500 sincronizado con input numérico (el input permite hasta 100.000).
   - Inputs de almacenamiento (GB) y llamadas API/mes.
   - **Panel de proyección en vivo**: desglose por tramos, base, IVA del país del cliente y total — recalculado en cada movimiento con la **función pura de pricing replicada en cliente** (misma spec y mismos casos dorados que el backend; trade-off documentado en ADR-08) y convertido a la divisa activa.
   - Botón "Guardar simulación" → `POST /simulations` → invalida query del histórico + toast. Estado `loading` en el botón; error → toast destructivo.

## Reglas transversales

- Responsive primero: breakpoints Tailwind estándar; sin scroll horizontal en 360 px.
- Accesibilidad: labels reales en inputs, slider operable por teclado, contraste AA, `aria-live="polite"` en el panel de proyección.
- Sin `any`; los shapes de la API tipados en `src/api/types.ts` (fuente: `contratos-api.md`).
- Los céntimos nunca se manipulan en float: conversión `cents/100` solo dentro de `formatMoney`.

## Casos dorados del cálculo en cliente

Mismos que RN-01 (`reglas-de-negocio.md`), testeados con Vitest: 1→10 €, 10→100 €, 11→108 €, 15→140 €, 50→420 €, 51→425 €, 100→670 €, 200→1.170 €. Con IVA ES 21 %: 15 usuarios → 169,40 €.
