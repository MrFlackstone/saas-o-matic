# Reglas de negocio

## Glosario

- **Cliente**: empresa corporativa registrada (nombre, identificador fiscal, email, país, plan).
- **Simulación**: proyección de coste mensual para un cliente según su consumo (usuarios activos, almacenamiento, llamadas API). Se persiste con su desglose.
- **Plan**: catálogo comercial (`STARTER`, `PRO`, `ENTERPRISE`).

## RN-01 — Tarificación acumulativa por tramos (Tiered Pricing)

El coste base mensual se calcula **acumulando** tramos sobre el número de usuarios activos:

| Tramo | Usuarios       | Precio unitario |
| ----- | -------------- | --------------- |
| 1     | 1 – 10         | 10,00 €         |
| 2     | 11 – 50        | 8,00 €          |
| 3     | 51 en adelante | 5,00 €          |

Fórmula: cada usuario se cobra al precio del tramo al que pertenece (no se aplica el precio del tramo alcanzado a todos los usuarios).

**Casos dorados** (verificados en tests de backend y frontend):

| Usuarios | Cálculo              | Base       |
| -------- | -------------------- | ---------- |
| 1        | 1×10                 | 10,00 €    |
| 10       | 10×10                | 100,00 €   |
| 11       | 10×10 + 1×8          | 108,00 €   |
| 15       | 10×10 + 5×8          | 140,00 €   |
| 50       | 10×10 + 40×8         | 420,00 €   |
| 51       | 10×10 + 40×8 + 1×5   | 425,00 €   |
| 100      | 10×10 + 40×8 + 50×5  | 670,00 €   |
| 200      | 10×10 + 40×8 + 150×5 | 1.170,00 € |

## RN-02 — Impuesto por país

Al coste base se le suma el impuesto (IVA/VAT) del país del cliente. Tabla de referencia sembrada en BD (`countries`):

| País           | Código | IVA                                           |
| -------------- | ------ | --------------------------------------------- |
| España         | ES     | 21 %                                          |
| Portugal       | PT     | 23 %                                          |
| Francia        | FR     | 20 %                                          |
| Alemania       | DE     | 19 %                                          |
| Italia         | IT     | 22 %                                          |
| Países Bajos   | NL     | 21 %                                          |
| Bélgica        | BE     | 21 %                                          |
| Irlanda        | IE     | 23 %                                          |
| Reino Unido    | GB     | 20 %                                          |
| Estados Unidos | US     | 0 % _(sales tax por estado fuera de alcance)_ |

- `taxCents = round_half_up(baseCents × vatRateBps / 10000)`.
- Con los datos actuales (precios enteros en € y tipos enteros en %) el resultado es siempre exacto; la regla de redondeo _half-up_ queda definida defensivamente para futuros cambios de tarifas.

## RN-03 — Moneda canónica y conversión

- **Todos los importes se calculan y persisten en EUR**, en céntimos enteros (`Int`), nunca en coma flotante.
- La conversión de divisa (USD, GBP, …) es **exclusivamente de presentación** y ocurre en el frontend con tipos de cambio de una API externa. Ningún importe convertido se envía ni se guarda en el backend.

## RN-04 — Unicidad del identificador fiscal

- El identificador fiscal se normaliza (mayúsculas, sin espacios ni guiones) y es **único** en el sistema. Alta duplicada → `409 Conflict`.
- Si el país es España, se valida con el algoritmo oficial (ver `validaciones.md`).

## RN-05 — Inmutabilidad de simulaciones

Cada simulación persiste una **instantánea completa** del cálculo: desglose por tramos, tipo de IVA aplicado y totales. Si mañana cambian tarifas o IVA, el histórico sigue reflejando lo que se presupuestó en su momento.

## Registro de ambigüedades del enunciado

Decisiones tomadas donde el enunciado no especifica, con su justificación:

| #   | Ambigüedad                                                                                        | Decisión                                                                           | Justificación                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | "Plan Elegido" no define planes ni precios                                                        | Catálogo sembrado (`STARTER/PRO/ENTERPRISE`) sin impacto en precio v1              | El enunciado define el coste solo por tramos de usuarios; el plan se persiste como dato comercial y queda como punto de extensión del motor de precios |
| A2  | Almacenamiento y llamadas API se registran pero no tienen tarifa                                  | Se persisten sin tarificar                                                         | Misma razón; el motor de precios se diseña composable para añadir componentes de coste sin reescritura (ver ADR-07)                                    |
| A3  | Impuesto "correspondiente al país" sin tabla                                                      | Tabla estática sembrada en BD (RN-02)                                              | Fuente única consultable y editable                                                                                                                    |
| A4  | Identificadores fiscales de países ≠ España                                                       | Validación de formato genérica (4–20 alfanuméricos)                                | El enunciado solo exige algoritmo oficial para España; validar 10 países más queda fuera de alcance                                                    |
| A5  | El frontend necesita búsqueda, detalle e histórico pero el enunciado solo define 2 endpoints POST | Se añaden `GET /customers`, `GET /customers/:id`, `GET /customers/:id/simulations` | Sin ellos las vistas obligatorias no pueden funcionar; se especifican con el mismo rigor                                                               |
| A6  | Rango de usuarios simulables                                                                      | `activeUsers` ∈ [1, 100.000]                                                       | Simular 0 usuarios no aporta; cota superior defensiva                                                                                                  |
