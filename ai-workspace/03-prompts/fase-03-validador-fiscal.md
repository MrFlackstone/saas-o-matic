# Fase 3 — Validador de identificador fiscal español (dominio puro)

## Objetivo

Implementar en `backend/src/domain/tax-id/` la normalización y validación algorítmica de DNI/NIE/CIF (y NIF especiales K/L/M), con TDD sobre la tabla de fixtures de la spec.

## Specs de referencia (leer antes)

- `ai-workspace/01-specs/validaciones.md` (algoritmos exactos + tabla de fixtures — es la fuente de verdad, no la memoria del modelo)

## Restricciones

- TS puro (mismas reglas que fase 2).
- La función **nunca lanza**: devuelve `{ valid, kind?, reason? }` para cualquier entrada, incluida basura.
- Tests primero, copiando la tabla de fixtures completa de la spec.

## Plan de acción

1. `normalize.ts`: `normalizeTaxId(raw)` → trim, mayúsculas, sin espacios/puntos/guiones.
2. `spanish-tax-id.ts`:
   - `DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE"`; `CIF_LETTERS = "JABCDEFGHI"`.
   - Clasificación por regex: DNI `^\d{8}[A-Z]$`, NIE `^[XYZ]\d{7}[A-Z]$`, NIF especial `^[KLM]\d{7}[A-Z]$`, CIF `^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$`.
   - DNI: letra = `DNI_LETTERS[numero % 23]`. NIE: X→0/Y→1/Z→2 y misma regla. K/L/M: regla mod 23 sobre los 7 dígitos.
   - CIF: posiciones impares ×2 con suma de dígitos, pares directas, `control = (10 − suma % 10) % 10`; iniciales `PQRSW` → letra obligatoria, `ABEH` → dígito obligatorio, resto ambos.
3. `validate-spanish-tax-id.ts`: función pública que normaliza, clasifica, valida y devuelve `reason` legible (se usa en el mensaje del error 400).
4. `spanish-tax-id.spec.ts`: los 18 fixtures de la spec + entradas extremas (`""`, espacios, 300 chars, `😀`, minúsculas con guiones).

## Criterios de aceptación

- [ ] Tabla de fixtures completa en verde (válidos e inválidos, con el `kind` correcto).
- [ ] `b58818501`, `B-5881850-1` y `  B58818501 ` validan tras normalizar.
- [ ] Cobertura 100 % de ramas en `domain/tax-id`.
- [ ] Ninguna excepción para entrada arbitraria (test con fuzz básico de strings raros).

## Verificación

```bash
cd backend && pnpm test -- --coverage --testPathPattern=domain/tax-id
```

## Al terminar

Commit sugerido: `feat(tax-id): validación algorítmica de DNI, NIE y CIF con normalización`.
