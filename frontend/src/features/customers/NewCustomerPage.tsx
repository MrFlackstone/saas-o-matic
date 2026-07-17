import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { createCustomer } from '@/api/customers'
import { FieldError } from '@/components/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { normalizeTaxId } from '@/domain/tax-id/normalize'
import { COUNTRIES, PLANS, countryFlag } from '@/lib/countries'
import { customerFormSchema, type CustomerFormValues } from './customer-form-schema'

const FORM_FIELDS = ['companyName', 'email', 'countryCode', 'planCode', 'taxId'] as const
type FormField = (typeof FORM_FIELDS)[number]

function isFormField(field: string): field is FormField {
  return (FORM_FIELDS as readonly string[]).includes(field)
}

export function NewCustomerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      companyName: '',
      email: '',
      countryCode: 'ES',
      planCode: '',
      taxId: '',
    },
  })

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Cliente «${customer.companyName}» dado de alta`)
      void navigate(`/clientes/${customer.id}`)
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          form.setError('taxId', { message: 'Ya existe un cliente con este identificador fiscal' })
          return
        }
        let mappedAny = false
        for (const detail of error.details) {
          if (isFormField(detail.field)) {
            form.setError(detail.field, { message: detail.message })
            mappedAny = true
          }
        }
        if (mappedAny) {
          return
        }
      }
      toast.error('No se pudo dar de alta el cliente. Inténtalo de nuevo.')
    },
  })

  const onSubmit = (values: CustomerFormValues): void => {
    mutation.mutate({ ...values, taxId: normalizeTaxId(values.taxId) })
  }

  const { errors } = form.formState

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Alta de cliente</h1>
      <form
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event)
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="companyName" className="text-sm font-medium">
            Nombre de la empresa
          </label>
          <Input
            id="companyName"
            aria-invalid={errors.companyName !== undefined}
            aria-describedby={errors.companyName ? 'companyName-error' : undefined}
            {...form.register('companyName')}
          />
          <FieldError id="companyName-error" message={errors.companyName?.message} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...form.register('email')}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="countryCode" className="text-sm font-medium">
            País
          </label>
          <Controller
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="countryCode"
                  className="w-full"
                  aria-invalid={errors.countryCode !== undefined}
                  aria-describedby={errors.countryCode ? 'countryCode-error' : undefined}
                >
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span aria-hidden>{countryFlag(country.code)}</span> {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="countryCode-error" message={errors.countryCode?.message} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="taxId" className="text-sm font-medium">
            Identificador fiscal
          </label>
          <Input
            id="taxId"
            aria-invalid={errors.taxId !== undefined}
            aria-describedby={errors.taxId ? 'taxId-error' : undefined}
            {...form.register('taxId')}
          />
          <FieldError id="taxId-error" message={errors.taxId?.message} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="planCode" className="text-sm font-medium">
            Plan
          </label>
          <Controller
            control={form.control}
            name="planCode"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="planCode"
                  className="w-full"
                  aria-invalid={errors.planCode !== undefined}
                  aria-describedby={errors.planCode ? 'planCode-error' : undefined}
                >
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="planCode-error" message={errors.planCode?.message} />
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && <LoaderCircle className="animate-spin" aria-hidden />}
          Dar de alta
        </Button>
      </form>
    </section>
  )
}
