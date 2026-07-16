# Fase 2 — Motor de precios por tramos (dominio puro)

## Objetivo

Implementar en `backend/src/domain/pricing/` el cálculo acumulativo por tramos + impuesto, con **TDD** y cobertura total. Sin tocar HTTP ni BD.

## Specs de referencia (leer antes)

- `ai-workspace/01-specs/reglas-de-negocio.md` (RN-01, RN-02 — tabla de casos dorados)
- `ai-workspace/02-arquitectura/decisiones.md` (ADR-03, ADR-05, ADR-07)

## Restricciones

- **TS puro**: prohibido importar Nest, Prisma o cualquier cosa fuera de `domain/`.
- Solo aritmética entera (céntimos, bps). Ningún float en cálculos.
- **Tests primero**: escribir la suite con los casos dorados antes de implementar.

## Plan de acción

1. `types.ts`: `TierLine { tier, fromUser, toUser, users, unitCents, amountCents }`, `PricingResult { lines, baseCents, vatRateBps, taxCents, totalCents }`.
2. `tiers.ts`: constante `PRICING_TIERS` = [1–10 → 1000 cts, 11–50 → 800 cts, 51–∞ → 500 cts].
3. `pricing-engine.ts`:
   - `computeUserTierLines(activeUsers): TierLine[]` — reparto acumulativo.
   - `applyVat(baseCents, vatRateBps)` — `Math.round` half-up documentado (RN-02).
   - `calculateSimulationCost(input, vatRateBps): PricingResult` — orquesta componentes de coste; v1 solo tramos de usuarios, diseñado para añadir componentes (ADR-07: array de funciones `CostComponent`, no switch).
4. `pricing-engine.spec.ts`: tabla completa de casos dorados (1, 10, 11, 15, 50, 51, 100, 200 usuarios), IVA de varios países (ES 21 %, US 0 %), entrada 0 usuarios → base 0 (el rango lo restringe el DTO, el dominio no revienta).

## Criterios de aceptación

- [ ] Los 8 casos dorados pasan, incluido 15 usuarios → 14000 cts base (ejemplo del enunciado).
- [ ] 15 usuarios + ES → tax 2940, total 16940.
- [ ] Cobertura 100 % de ramas en `domain/pricing`.
- [ ] `grep` de imports en `domain/`: cero referencias a `@nestjs`, `@prisma`, `express`.

## Verificación

```bash
cd backend && pnpm test -- --coverage --testPathPattern=domain/pricing
```

## Al terminar

Registra en `04-proceso/registro-decisiones.md` cómo quedó modelado `CostComponent`. Commit sugerido: `feat(pricing): motor acumulativo por tramos con IVA por país`.
