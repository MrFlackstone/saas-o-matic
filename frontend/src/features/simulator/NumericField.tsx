import { Controller, type Control, type FieldPath } from 'react-hook-form'
import { FieldError } from '@/components/FieldError'
import { Input } from '@/components/ui/input'
import { numericInputProps } from './numeric-input'
import type { SimulatorFormValues } from './simulator-form-schema'

export interface NumericFieldProps {
  control: Control<SimulatorFormValues>
  name: FieldPath<SimulatorFormValues>
  id: string
  label: string
  error?: string
}

export function NumericField({ control, name, id, label, error }: NumericFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => <Input {...numericInputProps(field, id, error !== undefined)} />}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
