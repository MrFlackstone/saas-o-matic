import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { createSimulation } from '@/api/simulations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/money'
import { useCurrency } from '@/providers/currency-context'
import { toErrorMessage } from './error-message'
import { NumericField } from './NumericField'
import { ProjectionPanel } from './ProjectionPanel'
import { simulatorFormSchema, type SimulatorFormValues } from './simulator-form-schema'
import { UsersField } from './UsersField'

const DEFAULT_VALUES: SimulatorFormValues = {
  activeUsers: 15,
  storageGb: 0,
  apiCallsMonth: 0,
}

// La proyección solo se dibuja con un valor que el contrato aceptaría; reutiliza
// el rango del schema para no duplicar los límites de validaciones.md.
function toProjectableUsers(activeUsers: number): number | null {
  const parsed = simulatorFormSchema.shape.activeUsers.safeParse(activeUsers)
  return parsed.success ? parsed.data : null
}

export interface SimulatorCardProps {
  customerId: string
  vatRateBps: number
}

export function SimulatorCard({ customerId, vatRateBps }: SimulatorCardProps) {
  const { currency, rate } = useCurrency()
  const queryClient = useQueryClient()
  const form = useForm<SimulatorFormValues>({
    resolver: zodResolver(simulatorFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const activeUsers = useWatch({ control: form.control, name: 'activeUsers' })

  const mutation = useMutation({
    mutationFn: createSimulation,
    onSuccess: async (simulation) => {
      // El importe del toast es el del servidor (fuente autoritativa), no el proyectado.
      await queryClient.invalidateQueries({ queryKey: ['simulations', customerId] })
      toast.success(
        `Simulación guardada: ${formatMoney(simulation.totalCents, currency, rate)} al mes`,
      )
      form.reset(DEFAULT_VALUES)
    },
    onError: (error) => {
      toast.error(toErrorMessage(error))
    },
  })

  const onSubmit = (values: SimulatorFormValues): void => {
    mutation.mutate({ customerId, ...values })
  }

  const { errors } = form.formState

  return (
    <Card id="simulador" tabIndex={-1} className="scroll-mt-6">
      <CardHeader>
        <CardTitle>Simulador</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit(onSubmit)(event)
          }}
          className="space-y-6"
        >
          <UsersField control={form.control} error={errors.activeUsers?.message} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumericField
              control={form.control}
              name="storageGb"
              id="storageGb"
              label="Almacenamiento (GB)"
              error={errors.storageGb?.message}
            />
            <NumericField
              control={form.control}
              name="apiCallsMonth"
              id="apiCallsMonth"
              label="Llamadas API / mes"
              error={errors.apiCallsMonth?.message}
            />
          </div>

          <ProjectionPanel activeUsers={toProjectableUsers(activeUsers)} vatRateBps={vatRateBps} />

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            Guardar simulación
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
