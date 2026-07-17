import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { SimulationResponse } from '@/api/types'
import { formatDateTime } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { useCurrency } from '@/providers/currency-context'
import { CostBreakdownTable } from './CostBreakdownTable'

export function SimulationRow({ simulation }: { simulation: SimulationResponse }) {
  const { currency, rate } = useCurrency()
  const [expanded, setExpanded] = useState(false)
  const detailId = `simulation-breakdown-${simulation.id}`

  return (
    <li className="rounded-lg border">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={() => {
          setExpanded((value) => !value)
        }}
        className="focus-visible:ring-ring flex w-full flex-wrap items-center justify-between gap-2 rounded-lg p-4 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="space-y-1">
          <span className="block text-sm font-medium">{formatDateTime(simulation.createdAt)}</span>
          <span className="text-muted-foreground block text-sm">
            {simulation.activeUsers} usuarios · {simulation.storageGb} GB ·{' '}
            {simulation.apiCallsMonth.toLocaleString('es-ES')} llamadas/mes
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-semibold">
            {formatMoney(simulation.totalCents, currency, rate)}
          </span>
          <ChevronDown
            aria-hidden
            className={`text-muted-foreground size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      {expanded && (
        <div id={detailId} className="border-t p-4">
          <CostBreakdownTable
            caption="Desglose de la simulación"
            lines={simulation.breakdown}
            baseCents={simulation.baseCents}
            vatRateBps={simulation.vatRateBps}
            taxCents={simulation.taxCents}
            totalCents={simulation.totalCents}
          />
        </div>
      )}
    </li>
  )
}
