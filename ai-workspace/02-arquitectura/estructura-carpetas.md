# Organización de carpetas

## Raíz del repositorio

```
saas-o-matic/
├── backend/            # API NestJS + Prisma + SQLite
├── frontend/           # Dashboard React + Vite
├── ai-workspace/       # Este workspace (specs, arquitectura, prompts, proceso)
├── CLAUDE.md           # Directrices persistentes para la IA
├── .claude/commands/   # Comandos personalizados (/nueva-fase, /auditoria)
├── .github/workflows/  # CI (lint + tests de ambas apps)
└── README.md
```

## Backend

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/          # commiteadas → reproducible con migrate deploy
│   └── seed.ts
├── src/
│   ├── main.ts              # bootstrap: ValidationPipe global, filtro de errores, CORS, Swagger
│   ├── app.module.ts
│   ├── common/              # transversal: exception filter (contrato de error), helpers HTTP
│   ├── prisma/              # PrismaModule + PrismaService (única puerta a BD)
│   ├── domain/              # ⚠️ TS PURO: prohibido importar Nest/Prisma/HTTP
│   │   ├── pricing/         #    motor de tramos + impuesto (ADR-05, ADR-07) + tests
│   │   └── tax-id/          #    DNI/NIE/CIF: normalización + validación + tests
│   ├── customers/
│   │   ├── customers.module.ts
│   │   ├── customers.controller.ts   # fino: HTTP ↔ servicio, decoradores Swagger
│   │   ├── customers.service.ts      # orquesta dominio + Prisma
│   │   └── dto/                      # class-validator + tipos de respuesta
│   └── simulations/         # misma estructura
└── test/                    # e2e con supertest (app real + SQLite temporal)
```

**Reglas de dependencia** (verificables en revisión; también en `CLAUDE.md`):

1. `controller → service → domain/prisma`. Nunca al revés; nunca controller → Prisma directo.
2. `domain/` no importa nada fuera de `domain/`.
3. Un archivo = una responsabilidad; **soft limit 250 líneas** — superarlo exige justificación o extracción.
4. Los tests viven junto al código (`*.spec.ts`) salvo e2e (`test/`).

## Frontend

```
frontend/src/
├── api/            # client.ts (fetch tipado + errores), customers.ts, simulations.ts, exchange.ts, types.ts
├── domain/pricing/ # función pura de tramos replicada (ADR-08) + tests de casos dorados
├── providers/      # QueryClientProvider, CurrencyProvider
├── hooks/          # useExchangeRates, useDebounce
├── lib/            # money.ts (formatMoney, céntimos→divisa), utils
├── components/
│   ├── ui/         # shadcn/ui generados
│   └── …           # CustomerCard, SimulationHistory, CurrencyPicker, EmptyState, ErrorState
├── features/
│   ├── dashboard/  # página de búsqueda
│   ├── customers/  # alta + detalle
│   └── simulator/  # formulario + panel de proyección en vivo
└── App.tsx · main.tsx · router.tsx
```

**Reglas**: componentes de página en `features/`, reutilizables en `components/`; acceso HTTP solo desde `api/`; importes solo via `lib/money.ts`; sin `any`.
