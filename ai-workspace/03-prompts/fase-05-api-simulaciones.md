# Fase 5 — API de simulaciones

## Objetivo

Módulo `simulations`: cálculo autoritativo en servidor con el motor de la fase 2, persistencia con snapshot e histórico por cliente.

## Specs de referencia (leer antes)

- `ai-workspace/01-specs/contratos-api.md` (`POST /simulations`, `GET /customers/:id/simulations`)
- `ai-workspace/01-specs/reglas-de-negocio.md` (RN-01, RN-02, RN-05)
- `ai-workspace/02-arquitectura/decisiones.md` (ADR-06)

## Restricciones

- El cálculo lo hace **exclusivamente** `domain/pricing` (fase 2); el servicio no contiene aritmética propia.
- Persistir snapshot completo: `breakdown` serializado, `vatRateBps` aplicado, `baseCents/taxCents/totalCents` (RN-05/ADR-06).
- Ningún importe convertido a otra divisa entra o sale del backend (RN-03).

## Plan de acción

1. `dto/create-simulation.dto.ts`: `customerId`, `activeUsers` (1–100.000), `storageGb` (0–1.000.000), `apiCallsMonth` (0–1.000.000.000) — enteros, con `@ApiProperty`.
2. `simulations.service.ts`:
   - Cargar cliente con su país → si no existe, 404.
   - `calculateSimulationCost({ activeUsers }, country.vatRateBps)`.
   - Persistir con `breakdown: JSON.stringify(lines)`; responder con `breakdown` ya parseado (tipado `TierLine[]`).
3. `simulations.controller.ts`: `POST /simulations` (201) con Swagger.
4. En `customers.controller.ts`: `GET /customers/:id/simulations` (orden `createdAt desc`, 404 si el cliente no existe) — el servicio vive en `simulations` y se importa el módulo.
5. e2e: caso dorado del enunciado (cliente ES + 15 usuarios → `baseCents 14000, taxCents 2940, totalCents 16940`, breakdown con 2 líneas), cliente US (tax 0), `customerId` inexistente → 404, `activeUsers: 0` → 400, histórico ordenado.

## Criterios de aceptación

- [ ] Respuesta 201 idéntica al contrato, incluido el desglose por tramos.
- [ ] La simulación queda en BD con snapshot completo (verificable releyendo el histórico).
- [ ] Casos dorados e2e en verde.
- [ ] Swagger actualizado con ejemplos de request/response.

## Verificación

```bash
cd backend && pnpm lint && pnpm test && pnpm test:e2e
curl -s -X POST localhost:3000/simulations -H "Content-Type: application/json" \
  -d '{"customerId":"<id-seed>","activeUsers":15,"storageGb":500,"apiCallsMonth":1000000}'
```

## Al terminar

`/auditoria`. Commit sugerido: `feat(simulations): cálculo por tramos persistido con snapshot e histórico`.
