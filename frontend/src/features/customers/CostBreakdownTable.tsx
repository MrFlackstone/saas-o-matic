import { formatMoney, formatVatRate } from '@/lib/money'
import { useCurrency } from '@/providers/currency-context'

export interface CostBreakdownLine {
  tier: number
  fromUser: number
  toUser: number
  users: number
  unitCents: number
  amountCents: number
}

export interface CostBreakdownTableProps {
  caption: string
  lines: readonly CostBreakdownLine[]
  baseCents: number
  vatRateBps: number
  taxCents: number
  totalCents: number
}

// Compartida por el histórico (cálculo del servidor) y por la proyección del
// simulador (réplica de pricing, ADR-08): mismo render ⇒ paridad visible.
export function CostBreakdownTable({
  caption,
  lines,
  baseCents,
  vatRateBps,
  taxCents,
  totalCents,
}: CostBreakdownTableProps) {
  const { currency, rate } = useCurrency()

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {lines.map((line) => (
          <tr key={line.tier}>
            <td className="text-muted-foreground py-1">
              Tramo {line.tier} (usuarios {line.fromUser}–{line.toUser}): {line.users} ×{' '}
              {formatMoney(line.unitCents, currency, rate)}
            </td>
            <td className="py-1 text-right">{formatMoney(line.amountCents, currency, rate)}</td>
          </tr>
        ))}
        <tr className="border-t">
          <td className="py-1 font-medium">Base</td>
          <td className="py-1 text-right font-medium">{formatMoney(baseCents, currency, rate)}</td>
        </tr>
        <tr>
          <td className="text-muted-foreground py-1">IVA ({formatVatRate(vatRateBps)})</td>
          <td className="py-1 text-right">{formatMoney(taxCents, currency, rate)}</td>
        </tr>
        <tr className="border-t">
          <td className="py-1 font-semibold">Total</td>
          <td className="py-1 text-right font-semibold">
            {formatMoney(totalCents, currency, rate)}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
