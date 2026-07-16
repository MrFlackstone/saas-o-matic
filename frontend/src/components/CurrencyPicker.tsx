import { LoaderCircle, RotateCw, TriangleAlert } from 'lucide-react'
import { isCurrencyCode } from '@/api/exchange'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/dates'
import { useCurrency } from '@/providers/currency-context'

export function CurrencyPicker() {
  const { currency, setCurrency, currencies, exchange } = useCurrency()
  const disabled = exchange.status === 'loading' || exchange.status === 'unavailable'

  return (
    <div className="flex items-center gap-3">
      {exchange.status === 'stale' && exchange.updatedAt !== null && (
        <p role="status" className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <TriangleAlert className="size-3.5 text-amber-500" aria-hidden />
          Tipos de cambio del {formatDate(exchange.updatedAt)} (sin conexión con el
          proveedor)
        </p>
      )}
      {exchange.status === 'unavailable' && (
        <p role="status" className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <TriangleAlert className="size-3.5 text-destructive" aria-hidden />
          Sin tipos de cambio: importes en EUR
          <Button variant="outline" size="sm" onClick={exchange.retry}>
            <RotateCw aria-hidden />
            Reintentar
          </Button>
        </p>
      )}
      {exchange.status === 'loading' && (
        <span role="status">
          <LoaderCircle className="text-muted-foreground size-4 animate-spin" aria-hidden />
          <span className="sr-only">Cargando tipos de cambio…</span>
        </span>
      )}
      <Select
        value={currency}
        onValueChange={(value) => {
          if (isCurrencyCode(value)) {
            setCurrency(value)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-24" aria-label="Divisa">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
