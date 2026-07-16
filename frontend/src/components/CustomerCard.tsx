import { Link } from 'react-router-dom'
import type { CustomerResponse } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { countryFlag } from '@/lib/countries'
import { formatDate } from '@/lib/dates'

export function CustomerCard({ customer }: { customer: CustomerResponse }) {
  return (
    <Link
      to={`/clientes/${customer.id}`}
      className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="hover:border-primary/50 h-full gap-3 transition-colors">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{customer.companyName}</CardTitle>
          <Badge variant="secondary">{customer.plan.name}</Badge>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <p className="text-foreground font-mono">{customer.taxId}</p>
          <p>
            <span aria-hidden>{countryFlag(customer.country.code)}</span>{' '}
            {customer.country.name} ({customer.country.code})
          </p>
          <p>Alta: {formatDate(customer.createdAt)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
