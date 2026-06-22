import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ToastContainer from '@/components/ui/ToastContainer'

const PAGE_TITLES = {
  '/': 'Dashboard Analitik',
  '/expenses': 'Data CARF & Pengeluaran',
  '/import': 'Import Data',
  '/technicians': 'Manajemen Teknisi',
  '/documents': 'Generator Dokumen',
}

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const currentTitle = Object.entries(PAGE_TITLES).find(
    ([path]) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || 'NSD Portal'

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-shell__main">
        <Header
          title={currentTitle}
          onMenuClick={() => setSidebarOpen(prev => !prev)}
        />

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
