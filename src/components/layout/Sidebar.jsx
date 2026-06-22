import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Upload,
  Users,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { useState } from 'react'
import useAppStore from '@/store/useAppStore'

const NAV_SECTIONS = [
  {
    label: 'Menu Utama',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/expenses', label: 'Data CARF', icon: Receipt },
      { path: '/import', label: 'Import Data', icon: Upload },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { path: '/technicians', label: 'Teknisi', icon: Users },
      { path: '/documents', label: 'Generator Dokumen', icon: FileText },
    ],
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const currentUser = useAppStore((state) => state.currentUser)
  const logoutUser = useAppStore((state) => state.logoutUser)

  const getInitials = (name) => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatRole = (role) => {
    if (role === 'ADMIN_FINANCE') return 'Admin Finance'
    if (role === 'REQUESTOR') return 'Requestor'
    return role || ''
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 39,
          }}
        />
      )}

      <div className={`app-shell__sidebar ${isOpen ? 'app-shell__sidebar--open' : ''}`}>
        <nav className="sidebar">
          {/* Brand */}
          <div className="sidebar__brand">
            <div className="sidebar__brand-icon" style={{ background: 'transparent' }}>
              <img src="/logo-nsd.png" alt="NSD Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">NSD Portal</span>
              <span className="sidebar__brand-sub">Expense Management</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="sidebar__nav">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="sidebar__section-label">{section.label}</div>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                      onClick={onClose}
                    >
                      <Icon className="sidebar__link-icon" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          {currentUser && (
            <div className="sidebar__footer" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-3)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-2) var(--spacing-3)',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {getInitials(currentUser.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {currentUser.name}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                  }}>
                    {formatRole(currentUser.role)} {currentUser.area ? `(${currentUser.area})` : ''}
                  </div>
                </div>
              </div>

              <button 
                onClick={logoutUser}
                className="sidebar__link"
                style={{
                  color: 'var(--color-danger)',
                  marginTop: 'var(--spacing-1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-danger-muted)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <LogOut className="sidebar__link-icon" style={{ opacity: 1, color: 'var(--color-danger)' }} size={20} />
                <span style={{ fontWeight: 600 }}>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
