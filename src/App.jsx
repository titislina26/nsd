import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import useAppStore from '@/store/useAppStore'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'))
const ImportPage = lazy(() => import('@/pages/ImportPage'))
const TechniciansPage = lazy(() => import('@/pages/TechniciansPage'))
const DocumentPage = lazy(() => import('@/pages/DocumentPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
)

function ProtectedRoute({ children }) {
  const currentUser = useAppStore((state) => state.currentUser)
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const fetchAll = useAppStore((state) => state.fetchAll)
  const currentUser = useAppStore((state) => state.currentUser)

  useEffect(() => {
    if (currentUser) {
      fetchAll()
    }
  }, [fetchAll, currentUser])

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/technicians" element={<TechniciansPage />} />
            <Route path="/documents" element={<DocumentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
