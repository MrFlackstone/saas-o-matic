import { useQuery } from '@tanstack/react-query'
import { ArrowDown, RotateCw } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getCustomer } from '@/api/customers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { countryFlag } from '@/lib/countries'
import { formatVatRate } from '@/lib/money'
import { SimulationHistory } from './SimulationHistory'

function focusSimulator(): void {
  const simulator = document.getElementById('simulador')
  if (simulator) {
    simulator.scrollIntoView({ behavior: 'smooth' })
    simulator.focus({ preventScroll: true })
  }
}

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const query = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: id !== '',
  })

  if (id === '') {
    // Inalcanzable con las rutas actuales; evita un GET /customers/ silencioso.
    return (
      <div role="alert" className="rounded-xl border p-6 text-center">
        <p className="text-destructive">Falta el identificador del cliente en la ruta.</p>
      </div>
    )
  }

  if (query.isPending) {
    return (
      <div role="status" aria-label="Cargando cliente…" className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-6 text-center">
        <p className="text-destructive">No se pudo cargar el cliente.</p>
        <Button
          variant="outline"
          onClick={() => {
            void query.refetch()
          }}
        >
          <RotateCw aria-hidden />
          Reintentar
        </Button>
      </div>
    )
  }

  const customer = query.data

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{customer.companyName}</h1>
        <Button variant="outline" onClick={focusSimulator}>
          <ArrowDown aria-hidden />
          Ir al simulador
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Datos del cliente</CardTitle>
          <Badge variant="secondary">{customer.plan.name}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Identificador fiscal</dt>
              <dd className="font-mono">{customer.taxId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">País</dt>
              <dd>
                <span aria-hidden>{countryFlag(customer.country.code)}</span>{' '}
                {customer.country.name} ({customer.country.code})
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">IVA aplicable</dt>
              <dd>{formatVatRate(customer.country.vatRateBps)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <SimulationHistory customerId={customer.id} />
    </section>
  )
}
