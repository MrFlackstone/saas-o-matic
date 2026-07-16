# Especificación de validaciones

## Capas de validación (defensa en profundidad)

1. **DTO (borde HTTP)**: `class-validator` con `ValidationPipe` global (`whitelist: true`, `transform: true`) — tipos, rangos, formatos.
2. **Dominio**: algoritmo fiscal español como función pura en `domain/tax-id/` (sin dependencias de framework), invocada por el servicio cuando `countryCode = ES`.
3. **Base de datos**: `UNIQUE` sobre `taxId` normalizado, claves foráneas activadas en SQLite.
4. **Frontend**: espejo con `zod` + `react-hook-form` para feedback inmediato; el servidor sigue siendo la autoridad.

## Normalización del identificador fiscal

Antes de validar y de persistir: `trim` → mayúsculas → eliminar espacios, puntos y guiones. Se persiste normalizado.

## Algoritmo oficial español

La función de dominio clasifica y valida: `validateSpanishTaxId(value) → { valid, kind: 'DNI'|'NIE'|'CIF'|'NIF_ESPECIAL', reason? }`. Nunca lanza excepción.

### DNI (NIF de persona física)

- Formato: `8 dígitos + letra de control` (`^\d{8}[A-Z]$`).
- Letra = `"TRWAGMYFPDXBNJZSQVHLCKE"[número mod 23]`.

### NIE

- Formato: `[XYZ] + 7 dígitos + letra` (`^[XYZ]\d{7}[A-Z]$`).
- Sustituir prefijo: X→0, Y→1, Z→2; aplicar la misma regla mod 23 sobre el número resultante de 8 cifras.

### NIF especiales (K, L, M)

- Formato: `[KLM] + 7 dígitos + letra`.
- Letra de control = regla mod 23 sobre los 7 dígitos.

### CIF (personas jurídicas)

- Formato: `letra de organización + 7 dígitos + control` (`^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$`).
- Cálculo sobre los 7 dígitos (posiciones 1–7):
  - Posiciones **impares** (1ª, 3ª, 5ª, 7ª): multiplicar por 2 y sumar los dígitos del resultado.
  - Posiciones **pares** (2ª, 4ª, 6ª): sumar tal cual.
  - `control = (10 − (suma mod 10)) mod 10`.
- El control puede ser dígito o letra `"JABCDEFGHI"[control]` según la letra inicial:
  - Inicial en `{P, Q, R, S, W}` → control **debe ser letra**.
  - Inicial en `{A, B, E, H}` → control **debe ser dígito**.
  - Resto (`C, D, F, G, J, N, U, V`) → se aceptan ambos.

## Fixtures de test (verificados a mano)

| Entrada                                  | Esperado | Motivo                                        |
| ---------------------------------------- | -------- | --------------------------------------------- |
| `12345678Z`                              | ✅ DNI   | 12345678 mod 23 = 14 → Z                      |
| `00000000T`                              | ✅ DNI   | 0 mod 23 = 0 → T                              |
| `99999999R`                              | ✅ DNI   | 99999999 mod 23 = 1 → R                       |
| `12345678A`                              | ❌       | letra de control incorrecta                   |
| `1234567Z`                               | ❌       | solo 7 dígitos                                |
| `X1234567L`                              | ✅ NIE   | 01234567 mod 23 = 19 → L                      |
| `Y7654321G`                              | ✅ NIE   | 17654321 mod 23 = 4 → G                       |
| `Z0000000M`                              | ✅ NIE   | 20000000 mod 23 = 5 → M                       |
| `X1234567T`                              | ❌       | letra incorrecta                              |
| `B58818501`                              | ✅ CIF   | suma 29 → control 1 (B exige dígito)          |
| `B12345674`                              | ✅ CIF   | suma 26 → control 4                           |
| `Q2818002D`                              | ✅ CIF   | suma 26 → control 4 → letra D (Q exige letra) |
| `B58818500`                              | ❌       | dígito de control incorrecto                  |
| `Q28180024`                              | ❌       | Q exige letra, recibe dígito                  |
| `A5881850J`                              | ❌       | A exige dígito, recibe letra                  |
| `T1234567X`                              | ❌       | letra inicial no válida de CIF                |
| `b58818501`, `B-5881850-1`, ` B58818501` | ✅       | la normalización los convierte al canónico    |

## Validaciones por campo (resto)

| Campo               | Regla                              | Error (`code`)        |
| ------------------- | ---------------------------------- | --------------------- |
| `companyName`       | trim, 2–120 chars                  | `COMPANY_NAME_LENGTH` |
| `email`             | `@IsEmail`, máx. 254               | `EMAIL_INVALID`       |
| `countryCode`       | existe en `countries`              | `COUNTRY_UNKNOWN`     |
| `planCode`          | existe en `plans`                  | `PLAN_UNKNOWN`        |
| `taxId` (ES)        | algoritmo oficial                  | `TAX_ID_INVALID`      |
| `taxId` (≠ES)       | `^[A-Z0-9]{4,20}$` tras normalizar | `TAX_ID_FORMAT`       |
| `taxId` (duplicado) | único global                       | `409 TAX_ID_TAKEN`    |
| `activeUsers`       | entero 1–100.000                   | `ACTIVE_USERS_RANGE`  |
| `storageGb`         | entero 0–1.000.000                 | `STORAGE_RANGE`       |
| `apiCallsMonth`     | entero 0–1.000.000.000             | `API_CALLS_RANGE`     |

## Política de tests

- `domain/tax-id`: 100 % de ramas; toda la tabla de fixtures + normalización + entradas basura (`""`, `null`-safe, emojis, longitud extrema).
- `domain/pricing`: casos dorados de `reglas-de-negocio.md` (límites 1/10/11/50/51) + IVA por país.
- e2e (supertest): un caso feliz + un caso de cada error por endpoint.
