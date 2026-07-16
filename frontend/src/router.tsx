import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { CustomerDetailPage } from '@/features/customers/CustomerDetailPage'
import { NewCustomerPage } from '@/features/customers/NewCustomerPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clientes/nuevo', element: <NewCustomerPage /> },
      { path: 'clientes/:id', element: <CustomerDetailPage /> },
    ],
  },
])
