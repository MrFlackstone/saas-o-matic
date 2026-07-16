# Fase 6 — Frontend base: rutas, cliente API y divisas

## Objetivo

Infraestructura del dashboard: routing, cliente HTTP tipado, integración con la API de tipos de cambio y selector de divisa global con degradación especificada.

## Specs de referencia (leer antes)

- `ai-workspace/01-specs/spec-frontend.md` (selector de divisa + estados de la API externa — tabla completa)
- `ai-workspace/01-specs/contratos-api.md` (shapes para `src/api/types.ts`)

## Restricciones

- Todo importe visible pasa por `lib/money.ts` (`formatMoney(cents, currency, rate)` con `Intl.NumberFormat`); céntimos→unidades solo ahí.
- Acceso HTTP solo desde `src/api/`; componentes consumen hooks de TanStack Query.
- Sin `any`; tipos de API transcritos de la spec, no inferidos "a ojo".

## Plan de acción

1. `router.tsx`: `/`, `/clientes/nuevo`, `/clientes/:id` con layout común (header: título + `CurrencyPicker`).
2. `api/client.ts`: wrapper de `fetch` con base `VITE_API_URL`, parseo del contrato de error (`ApiError` con `details`), y `api/customers.ts` / `api/simulations.ts` tipados.
3. `api/exchange.ts` + `hooks/useExchangeRates.ts`: `GET https://open.er-api.com/v6/latest/EUR` con TanStack Query — `staleTime` 12 h, `gcTime` 24 h, `retry: 2`; persistir última respuesta buena en `localStorage`; exponer `{ status: 'loading' | 'live' | 'stale' | 'unavailable', rates, updatedAt }`.
4. `providers/CurrencyProvider.tsx`: divisa activa (persistida), `rate` derivada de `useExchangeRates`, divisas curadas EUR/USD/GBP/CHF/JPY/MXN.
5. `components/CurrencyPicker.tsx`: los 4 estados de la tabla de la spec (deshabilitado+spinner, activo, banner "tasas del <fecha>", forzado EUR + reintentar).
6. `lib/money.ts` + test unitario (formateo EUR/JPY — JPY sin decimales via `Intl`).
7. `domain/pricing/` en frontend: replicar la función pura de tramos (ADR-08) + `pricing.spec.ts` con los casos dorados de RN-01 (Vitest).

## Criterios de aceptación

- [ ] Cambiar divisa re-renderiza importes (demostrable en fase 7).
- [ ] Con red cortada al proveedor de tasas y caché previa: banner de "tasas antiguas"; sin caché: forzado a EUR con aviso (simular con DevTools offline).
- [ ] Casos dorados del pricing cliente en verde (misma tabla que backend).
- [ ] `pnpm build` y `pnpm lint` verdes.

## Verificación

```bash
cd frontend && pnpm lint && pnpm test && pnpm build && pnpm dev
```

## Al terminar

Commit sugerido: `feat(front): base de rutas, cliente API tipado y divisas con degradación`.
