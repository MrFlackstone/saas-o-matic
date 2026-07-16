import { Link, Outlet } from 'react-router-dom'
import { CurrencyPicker } from '@/components/CurrencyPicker'
import { Toaster } from '@/components/ui/sonner'

export function AppLayout() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            SaaS-O-Matic
          </Link>
          <CurrencyPicker />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
