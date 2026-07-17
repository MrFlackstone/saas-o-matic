import type { ControllerRenderProps, FieldPath } from 'react-hook-form'
import { formatThousands, parseIntegerInput } from '@/lib/number-format'
import type { SimulatorFormValues } from './simulator-form-schema'

// Cableado común de los inputs numéricos del simulador: formato de miles al
// pintar y entero (o NaN, que el schema rechaza) al leer. NaN es el hueco entre
// "campo vacío" y `number`: react-hook-form exige un valor del tipo del campo.
export function numericInputProps<TName extends FieldPath<SimulatorFormValues>>(
  field: ControllerRenderProps<SimulatorFormValues, TName>,
  id: string,
  invalid: boolean,
) {
  return {
    id,
    inputMode: 'numeric' as const,
    'aria-invalid': invalid,
    'aria-describedby': invalid ? `${id}-error` : undefined,
    value: Number.isFinite(field.value) ? formatThousands(field.value) : '',
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      field.onChange(parseIntegerInput(event.target.value) ?? Number.NaN)
    },
    onBlur: field.onBlur,
  }
}
