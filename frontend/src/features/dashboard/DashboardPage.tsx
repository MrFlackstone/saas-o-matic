import { useQuery } from '@tanstack/react-query'
import { Plus, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchCustomers } from '@/api/customers'
import { CustomerCard } from '@/components/CustomerCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'

const SEARCH_DEBOUNCE_MS = 300

function ResultsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando clientes…"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-36 rounded-xl" />
      ))}
    </div>
  )
}

export function DashboardPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS)

  const query = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => searchCustomers({ search: debouncedSearch || undefined }),
  })

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button asChild>
          <Link to="/clientes/nuevo">
            <Plus aria-hidden />
            Nuevo cliente
          </Link>
        </Button>
      </div>

      <div className="max-w-md">
        <label htmlFor="customer-search" className="sr-only">
          Buscar clientes por nombre o identificador fiscal
        </label>
        <Input
          id="customer-search"
          type="search"
          placeholder="Buscar por nombre o identificador fiscal…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
          }}
        />
      </div>

      {query.isPending && <ResultsSkeleton />}

      {query.isError && (
        <div role="alert" className="space-y-3 rounded-xl border p-6 text-center">
          <p className="text-destructive">No se pudo cargar la lista de clientes.</p>
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
        <div className="space-y-3 rounded-xl border border-dashed p-6 text-center">
          <p className="text-muted-foreground">
            {debouncedSearch
              ? `Sin resultados para «${debouncedSearch}»`
              : 'Todavía no hay clientes.'}
          </p>
          <Button asChild variant="outline">
            <Link to="/clientes/nuevo">
              <Plus aria-hidden />
              Dar de alta un cliente
            </Link>
          </Button>
        </div>
      )}

      {query.isSuccess && query.data.items.length > 0 && (
        <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.items.map((customer) => (
            <li key={customer.id}>
              <CustomerCard customer={customer} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
