import { useQuery } from '@tanstack/react-query'
import { RotateCw } from 'lucide-react'
import { getCustomerSimulations } from '@/api/simulations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SimulationRow } from './SimulationRow'

export function SimulationHistory({ customerId }: { customerId: string }) {
  const query = useQuery({
    queryKey: ['simulations', customerId],
    queryFn: () => getCustomerSimulations(customerId),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de simulaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {query.isPending && (
          <div role="status" aria-label="Cargando simulaciones…" className="space-y-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        )}
        {query.isError && (
          <div role="alert" className="space-y-3 text-center">
            <p className="text-destructive">No se pudo cargar el histórico.</p>
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
        )}
        {query.isSuccess && query.data.items.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Todavía no hay simulaciones para este cliente.
          </p>
        )}
        {query.isSuccess && query.data.items.length > 0 && (
          <ul className="list-none space-y-3">
            {query.data.items.map((simulation) => (
              <SimulationRow key={simulation.id} simulation={simulation} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
