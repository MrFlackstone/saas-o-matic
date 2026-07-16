# Contratos de API

## Convenciones

- Base URL local: `http://localhost:3000`. Prefijo: sin versión (herramienta interna; versionado documentado como extensión).
- `Content-Type: application/json` en ambos sentidos.
- Importes siempre en **céntimos de EUR** con sufijo `Cents`; tipos de IVA en **puntos básicos** con sufijo `Bps` (2100 = 21,00 %).
- Fechas en ISO-8601 UTC.
- Documentación viva: Swagger UI en `GET /docs` (generada con `@nestjs/swagger`).

## Contrato de error (global)

Todas las respuestas de error comparten formato (filtro de excepciones global):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validación fallida",
  "details": [
    { "field": "taxId", "code": "TAX_ID_INVALID", "message": "El identificador fiscal no supera el algoritmo de control (letra esperada: Z)" }
  ],
  "timestamp": "2026-07-20T10:30:00.000Z",
  "path": "/customers"
}
```

`details` solo aparece en errores de validación (400).

---

## POST /customers

Registra un cliente corporativo.

**Request**

```json
{
  "companyName": "Acme Ibérica SL",
  "taxId": "B58818501",
  "email": "finanzas@acme.es",
  "countryCode": "ES",
  "planCode": "PRO"
}
```

| Campo | Reglas |
|---|---|
| `companyName` | string, trim, 2–120 caracteres |
| `taxId` | string, se normaliza (mayúsculas, sin espacios/guiones); si `countryCode = ES` → algoritmo oficial DNI/NIE/CIF; resto: 4–20 alfanuméricos |
| `email` | formato email válido, máx. 254 |
| `countryCode` | debe existir en tabla `countries` |
| `planCode` | debe existir en tabla `plans` |

**Responses**

- `201 Created`

```json
{
  "id": "cm5x…",
  "companyName": "Acme Ibérica SL",
  "taxId": "B58818501",
  "email": "finanzas@acme.es",
  "country": { "code": "ES", "name": "España", "vatRateBps": 2100 },
  "plan": { "code": "PRO", "name": "Pro" },
  "createdAt": "2026-07-20T10:30:00.000Z"
}
```

- `400` validación (contrato de error con `details` por campo).
- `409` `taxId` ya registrado.

---

## GET /customers?search=&page=&limit=

Búsqueda por nombre de empresa **o** identificador fiscal (subcadena, sin distinción de mayúsculas).

| Query | Reglas |
|---|---|
| `search` | opcional; sin él lista todos |
| `page` | opcional, entero ≥ 1, por defecto 1 |
| `limit` | opcional, entero 1–50, por defecto 10 |

- `200 OK`

```json
{
  "items": [ { "id": "…", "companyName": "…", "taxId": "…", "country": { … }, "plan": { … }, "createdAt": "…" } ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

---

## GET /customers/:id

- `200 OK`: mismo shape que el item de la lista.
- `404` si no existe.

---

## GET /customers/:id/simulations

Histórico de simulaciones del cliente, ordenado por `createdAt` descendente.

- `200 OK`

```json
{
  "items": [
    {
      "id": "…",
      "activeUsers": 15,
      "storageGb": 500,
      "apiCallsMonth": 1000000,
      "baseCents": 14000,
      "vatRateBps": 2100,
      "taxCents": 2940,
      "totalCents": 16940,
      "breakdown": [
        { "tier": 1, "fromUser": 1, "toUser": 10, "users": 10, "unitCents": 1000, "amountCents": 10000 },
        { "tier": 2, "fromUser": 11, "toUser": 15, "users": 5, "unitCents": 800, "amountCents": 4000 }
      ],
      "createdAt": "…"
    }
  ]
}
```

- `404` si el cliente no existe.

---

## POST /simulations

Calcula **en servidor** (fuente autoritativa) y persiste una simulación.

**Request**

```json
{ "customerId": "cm5x…", "activeUsers": 15, "storageGb": 500, "apiCallsMonth": 1000000 }
```

| Campo | Reglas |
|---|---|
| `customerId` | debe existir → si no, `404` |
| `activeUsers` | entero, 1–100.000 |
| `storageGb` | entero, 0–1.000.000 |
| `apiCallsMonth` | entero, 0–1.000.000.000 |

**Responses**

- `201 Created`: mismo shape que el item del histórico (incluye `breakdown` completo).
- `400` validación · `404` cliente inexistente.

---

## GET /health

`200 OK` → `{ "status": "ok" }`. Para el README y CI.

---

## API externa (consumida por el frontend)

`GET https://open.er-api.com/v6/latest/EUR` → `{ "result": "success", "base_code": "EUR", "rates": { "USD": 1.08, "GBP": 0.85, … } }`

- El backend **no** interviene: la conversión es presentación pura (RN-03).
- Manejo de fallo especificado en `spec-frontend.md` (fallback a última tasa conocida + aviso, o EUR).
