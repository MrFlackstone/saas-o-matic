# Estructura de la base de datos

SQLite gestionada con Prisma (migraciones versionadas y commiteadas).

## Diagrama entidad-relación

```mermaid
erDiagram
    COUNTRY ||--o{ CUSTOMER : "tiene"
    PLAN ||--o{ CUSTOMER : "tiene"
    CUSTOMER ||--o{ SIMULATION : "registra"

    COUNTRY {
        string code PK "ISO-3166 alpha-2"
        string name
        int vatRateBps "2100 = 21%"
    }
    PLAN {
        string id PK
        string code UK "STARTER|PRO|ENTERPRISE"
        string name
    }
    CUSTOMER {
        string id PK "cuid"
        string companyName
        string taxId UK "normalizado"
        string email
        string countryCode FK
        string planId FK
        datetime createdAt
    }
    SIMULATION {
        string id PK "cuid"
        string customerId FK
        int activeUsers
        int storageGb
        int apiCallsMonth
        int baseCents
        int vatRateBps "snapshot"
        int taxCents
        int totalCents
        string breakdown "JSON snapshot tramos"
        datetime createdAt
    }
```

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Country {
  code      String     @id
  name      String
  vatRateBps Int
  customers Customer[]
}

model Plan {
  id        String     @id @default(cuid())
  code      String     @unique
  name      String
  customers Customer[]
}

model Customer {
  id          String       @id @default(cuid())
  companyName String
  taxId       String       @unique
  email       String
  countryCode String
  planId      String
  country     Country      @relation(fields: [countryCode], references: [code])
  plan        Plan         @relation(fields: [planId], references: [id])
  simulations Simulation[]
  createdAt   DateTime     @default(now())

  @@index([companyName])
}

model Simulation {
  id            String   @id @default(cuid())
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  activeUsers   Int
  storageGb     Int
  apiCallsMonth Int
  baseCents     Int
  vatRateBps    Int
  taxCents      Int
  totalCents    Int
  breakdown     String
  createdAt     DateTime @default(now())

  @@index([customerId, createdAt])
}
```

## Notas de diseño

- **`taxId` único y normalizado** (RN-04): la unicidad se garantiza en BD, no solo en la aplicación.
- **`breakdown` como `String` JSON**: SQLite no tiene tipo JSON nativo en Prisma; se serializa/deserializa en el servicio con tipo `TierLine[]` del dominio. Es un snapshot inmutable (ADR-06), no se consulta por dentro → no necesita columnas propias.
- **`vatRateBps` duplicado en `Simulation`**: snapshot intencionado del tipo aplicado (el de `Country` puede cambiar).
- **Sin `DELETE` en el alcance**: no se exponen borrados; las FKs quedan con el comportamiento restrictivo por defecto.
- **Índices**: búsqueda por nombre (`companyName`) e histórico por cliente ordenado (`customerId, createdAt`).

## Seed (`prisma/seed.ts`)

Idempotente (upserts), ejecutable con `pnpm db:seed`:

1. 10 países de RN-02 con su IVA en bps.
2. 3 planes: `STARTER`, `PRO`, `ENTERPRISE`.
3. **Datos demo para el evaluador**: 3 clientes (ES con CIF válido `B58818501`, PT, US) y 4–5 simulaciones variadas (una con 15 usuarios → 140 € base, el ejemplo del enunciado).
