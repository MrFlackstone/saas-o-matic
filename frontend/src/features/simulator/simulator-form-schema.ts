import { z } from 'zod'

// Espejo de las reglas de validaciones.md; el servidor revalida y manda.
const integerInRange = (min: number, max: number, message: string) =>
  z.number({ error: message }).int(message).min(min, message).max(max, message)

export const simulatorFormSchema = z.object({
  activeUsers: integerInRange(1, 100_000, 'Introduce un entero entre 1 y 100.000'),
  storageGb: integerInRange(0, 1_000_000, 'Introduce un entero entre 0 y 1.000.000'),
  apiCallsMonth: integerInRange(0, 1_000_000_000, 'Introduce un entero entre 0 y 1.000.000.000'),
})

export type SimulatorFormValues = z.infer<typeof simulatorFormSchema>
