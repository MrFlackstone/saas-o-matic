import { z } from 'zod'
import { normalizeTaxId } from '@/domain/tax-id/normalize'
import { validateSpanishTaxId } from '@/domain/tax-id/validate-spanish-tax-id'
import { COUNTRIES, PLANS } from '@/lib/countries'

const COUNTRY_CODES = COUNTRIES.map((country) => country.code)
const PLAN_CODES = PLANS.map((plan) => plan.code)

// Espejo de validaciones.md para taxId de países distintos de ES.
const FOREIGN_TAX_ID_PATTERN = /^[A-Z0-9]{4,20}$/

export const customerFormSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener entre 2 y 120 caracteres')
      .max(120, 'El nombre debe tener entre 2 y 120 caracteres'),
    email: z.email('Introduce un email válido').max(254, 'Máximo 254 caracteres'),
    countryCode: z
      .string()
      .refine((value) => COUNTRY_CODES.includes(value), 'Selecciona un país'),
    planCode: z
      .string()
      .refine((value) => PLAN_CODES.includes(value), 'Selecciona un plan'),
    taxId: z.string(),
  })
  .superRefine((data, ctx) => {
    const normalized = normalizeTaxId(data.taxId)
    if (data.countryCode === 'ES') {
      const result = validateSpanishTaxId(normalized)
      if (!result.valid) {
        ctx.addIssue({
          code: 'custom',
          path: ['taxId'],
          message: `Identificador fiscal no válido: ${result.reason ?? 'formato desconocido'}`,
        })
      }
      return
    }
    if (!FOREIGN_TAX_ID_PATTERN.test(normalized)) {
      ctx.addIssue({
        code: 'custom',
        path: ['taxId'],
        message: 'Identificador fiscal no válido: 4–20 caracteres alfanuméricos',
      })
    }
  })

export type CustomerFormValues = z.infer<typeof customerFormSchema>
