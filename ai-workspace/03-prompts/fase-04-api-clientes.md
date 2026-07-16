# Fase 4 — API de clientes

## Objetivo

Módulo `customers` completo: alta con validación fiscal, búsqueda paginada y detalle, con el contrato de error global y documentación Swagger.

## Specs de referencia (leer antes)

- `ai-workspace/01-specs/contratos-api.md` (shapes exactos de request/response/error)
- `ai-workspace/01-specs/validaciones.md` (reglas por campo y códigos de error)
- `ai-workspace/02-arquitectura/estructura-carpetas.md` (reglas de capas)

## Restricciones

- Controller fino: sin lógica, solo HTTP ↔ servicio + decoradores Swagger.
- La validación fiscal española se invoca desde el **servicio** usando `domain/tax-id` (es una regla cruzada país+taxId, no cabe en un decorador de campo simple).
- Respuestas y errores **exactamente** como el contrato; los códigos (`TAX_ID_INVALID`, etc.) salen de la spec.

## Plan de acción

1. `common/`: filtro global de excepciones que produce el contrato de error (statusCode, error, message, details?, timestamp, path). `exceptionFactory` del `ValidationPipe` para transformar errores de class-validator en `details[{ field, code, message }]`.
2. `dto/create-customer.dto.ts`: class-validator según la tabla de la spec (longitudes, email, campos requeridos) + `@ApiProperty`.
3. `customers.service.ts`:
   - Normalizar `taxId` (dominio) antes de todo.
   - `countryCode`/`planCode` existen (consulta) → si no, 400 con código correspondiente.
   - Si país ES → `validateSpanishTaxId`; inválido → 400 `TAX_ID_INVALID` con el `reason` del dominio.
   - Unicidad: capturar `P2002` de Prisma → 409 `TAX_ID_TAKEN` (no pre-consultar: evita la carrera).
   - Búsqueda: `contains` sobre `companyName` y `taxId` (en SQLite `LIKE` ya es case-insensitive para ASCII; buscar el término también normalizado en mayúsculas para el `taxId`). Paginación `page/limit` con `total`.
4. `customers.controller.ts`: `POST /customers`, `GET /customers`, `GET /customers/:id` (+ 404), decoradores Swagger completos con ejemplos.
5. e2e (`test/customers.e2e-spec.ts`, supertest + BD temporal): alta feliz ES y US, `taxId` inválido ES, duplicado → 409, país desconocido, búsqueda por nombre y por `taxId`, paginación, 404 detalle.

## Criterios de aceptación

- [ ] Todos los shapes coinciden con `contratos-api.md` (campos, códigos de estado, formato de error).
- [ ] `B58818501` con ES entra; `B58818500` devuelve 400 con `details[0].code = TAX_ID_INVALID`.
- [ ] Alta duplicada devuelve 409 aunque se envíe con guiones/minúsculas (normalización previa).
- [ ] Swagger `/docs` refleja los tres endpoints con ejemplos.
- [ ] e2e en verde; unit del servicio para las ramas de error.

## Verificación

```bash
cd backend && pnpm lint && pnpm test && pnpm test:e2e
```

## Al terminar

`/auditoria` sobre el diff. Commit sugerido: `feat(customers): alta con validación fiscal, búsqueda y detalle`.
