import { Controller, type Control } from 'react-hook-form'
import { FieldError } from '@/components/FieldError'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { numericInputProps } from './numeric-input'
import type { SimulatorFormValues } from './simulator-form-schema'

// El slider cubre el rango comercial habitual; el input admite hasta el máximo
// del contrato (100.000) y por encima de SLIDER_MAX el thumb se queda en el tope.
const SLIDER_MIN = 1
const SLIDER_MAX = 500

function toSliderPosition(activeUsers: number): number {
  if (!Number.isFinite(activeUsers)) {
    return SLIDER_MIN
  }
  return Math.min(Math.max(activeUsers, SLIDER_MIN), SLIDER_MAX)
}

export interface UsersFieldProps {
  control: Control<SimulatorFormValues>
  error?: string
}

export function UsersField({ control, error }: UsersFieldProps) {
  return (
    <Controller
      control={control}
      name="activeUsers"
      render={({ field }) => (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <label htmlFor="activeUsers" className="text-sm font-medium">
              Usuarios activos
            </label>
            <Input
              {...numericInputProps(field, 'activeUsers', error !== undefined)}
              className="w-32 text-right"
            />
          </div>
          <Slider
            aria-label="Usuarios activos"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={1}
            value={[toSliderPosition(field.value)]}
            onValueChange={([value]) => {
              field.onChange(value)
            }}
          />
          <FieldError id="activeUsers-error" message={error} />
        </div>
      )}
    />
  )
}
