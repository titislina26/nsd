import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import ExpensesPage from '@/pages/ExpensesPage'
import ImportPage from '@/pages/ImportPage'
import TechniciansPage from '@/pages/TechniciansPage'
import DocumentPage from '@/pages/DocumentPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import useAppStore from '@/store/useAppStore'

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
    </BrowserRouter>
  )
}
