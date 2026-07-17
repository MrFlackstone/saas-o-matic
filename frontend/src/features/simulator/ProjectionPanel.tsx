import { calculateSimulationCost } from '@/domain/pricing/pricing-engine'
import { CostBreakdownTable } from '@/features/customers/CostBreakdownTable'

export interface ProjectionPanelProps {
  activeUsers: number | null
  vatRateBps: number
}

export function ProjectionPanel({ activeUsers, vatRateBps }: ProjectionPanelProps) {
  const projection =
    activeUsers === null ? null : calculateSimulationCost({ activeUsers }, vatRateBps)

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-muted/40 space-y-3 rounded-lg border p-4"
    >
      <h3 className="text-sm font-medium">Proyección</h3>
      {projection === null ? (
        <p className="text-muted-foreground text-sm">
          Introduce un número de usuarios válido para ver la proyección.
        </p>
      ) : (
        <CostBreakdownTable
          caption="Proyección de coste por tramos"
          lines={projection.lines}
          baseCents={projection.baseCents}
          vatRateBps={projection.vatRateBps}
          taxCents={projection.taxCents}
          totalCents={projection.totalCents}
        />
      )}
      <p className="text-muted-foreground text-xs">
        Proyección orientativa — el cálculo definitivo lo realiza el servidor al guardar.
      </p>
    </div>
  )
}
