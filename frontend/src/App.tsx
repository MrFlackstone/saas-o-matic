import { RouterProvider } from 'react-router-dom'
import { CurrencyProvider } from '@/providers/CurrencyProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { router } from '@/router'

function App() {
  return (
    <QueryProvider>
      <CurrencyProvider>
        <RouterProvider router={router} />
      </CurrencyProvider>
    </QueryProvider>
  )
}

export default App
