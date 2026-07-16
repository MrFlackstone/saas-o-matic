# Fase 8 — Simulador interactivo

## Objetivo

Formulario de simulación con slider y proyección en tiempo real (tramos + IVA del cliente + divisa activa), que persiste vía `POST /simulations`.

## Specs de referencia (leer antes)

- `ai-workspace/01-specs/spec-frontend.md` (sección simulador)
- `ai-workspace/01-specs/reglas-de-negocio.md` (RN-01/RN-02 para el panel de desglose)

## Restricciones

- La proyección en vivo usa la función pura de `src/domain/pricing/` (fase 6); **cero** aritmética monetaria en componentes.
- El resultado persistido es el del servidor: tras el 201, el histórico se refresca con la respuesta real (`invalidateQueries`).
- `aria-live="polite"` en el panel de proyección; slider operable por teclado.

## Plan de acción

1. `features/simulator/SimulatorCard.tsx` dentro del detalle de cliente:
   - Slider shadcn 1–500 sincronizado bidireccional con input numérico (input admite hasta 100.000; al superar 500 el slider se fija al máximo visual).
   - Inputs `storageGb` y `apiCallsMonth` (con formato de miles).
2. `ProjectionPanel.tsx`: líneas por tramo (usuarios × unitario = importe), base, IVA (`vatRateBps` del país del cliente), total; todo formateado en la divisa activa; nota "Proyección orientativa — el cálculo definitivo lo realiza el servidor al guardar".
3. Submit: estado loading en botón, `POST /simulations`, toast de éxito con el total del servidor, `invalidateQueries` del histórico, reset suave del form; error → toast destructivo con mensaje del contrato de error.
4. Test Vitest del componente de proyección con un caso dorado (15 usuarios, ES): muestra 140,00 € base / 169,40 € total con divisa EUR.

## Criterios de aceptación

- [ ] Mover el slider actualiza el desglose sin peticiones de red.
- [ ] 15 usuarios con el cliente demo ES: panel muestra 100 € + 40 € = 140 € base, 169,40 € total; al guardar, el histórico añade la fila con los mismos números (paridad cliente/servidor).
- [ ] Cambiar divisa convierte panel e histórico coherentemente.
- [ ] Doble click en guardar no crea dos simulaciones (botón deshabilitado durante el envío).

## Verificación

```bash
cd frontend && pnpm lint && pnpm test && pnpm build
# e2e manual completo: alta → simular → guardar → ver histórico → cambiar divisa
```

## Al terminar

`/auditoria`. Commit sugerido: `feat(front): simulador interactivo con proyección en vivo y persistencia`.
