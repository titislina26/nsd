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
  Lock,
} from 'lucide-react'
import { useState, useEffect } from 'react'
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
  const [showChangePassword, setShowChangePassword] = useState(false)

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
                onClick={() => setShowChangePassword(true)}
                className="sidebar__link"
                style={{
                  color: 'var(--color-text-secondary)',
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
                  e.currentTarget.style.background = 'var(--color-border-subtle)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <Lock className="sidebar__link-icon" style={{ opacity: 0.7, color: 'var(--color-text-secondary)' }} size={20} />
                <span style={{ fontWeight: 600 }}>Ganti Password</span>
              </button>

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

      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </>
  )
}

function ChangePasswordModal({ isOpen, onClose }) {
  const currentUser = useAppStore((state) => state.currentUser)
  const changePassword = useAppStore((state) => state.changePassword)
  const isLoading = useAppStore((state) => state.isLoading)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword) {
      setError('Password baru wajib diisi')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok')
      return
    }
    if (newPassword.length < 4) {
      setError('Password baru minimal 4 karakter')
      return
    }

    try {
      await changePassword(currentUser.id, currentPassword, newPassword)
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal mengubah password')
    }
  }

  return (
    <div className="pwd-modal-backdrop" onClick={onClose}>
      <div className="pwd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pwd-modal__header">
          <div className="pwd-modal__icon-wrapper">
            <Lock size={20} className="pwd-modal__icon" />
          </div>
          <div>
            <h3 className="pwd-modal__title">Ubah Kata Sandi</h3>
            <p className="pwd-modal__subtitle">Perbarui password untuk akun Anda</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pwd-modal__form">
          {error && (
            <div className="pwd-modal__error">
              <span>{error}</span>
            </div>
          )}

          <div className="pwd-modal__field">
            <label className="pwd-modal__label">Password Saat Ini</label>
            <input
              type="password"
              className="pwd-modal__input"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="pwd-modal__field">
            <label className="pwd-modal__label">Password Baru</label>
            <input
              type="password"
              className="pwd-modal__input"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="pwd-modal__field">
            <label className="pwd-modal__label">Konfirmasi Password Baru</label>
            <input
              type="password"
              className="pwd-modal__input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="pwd-modal__actions">
            <button
              type="button"
              className="pwd-modal__btn pwd-modal__btn--cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="pwd-modal__btn pwd-modal__btn--submit"
              disabled={isLoading}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .pwd-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-4);
          z-index: 9999;
          animation: pwdFadeIn 0.2s ease-out;
        }

        .pwd-modal {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          animation: pwdScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes pwdFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pwdScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .pwd-modal__header {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-5) var(--spacing-5) var(--spacing-3);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .pwd-modal__icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          background: var(--color-primary-muted);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pwd-modal__title {
          font-size: var(--font-size-base);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .pwd-modal__subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: 1px;
        }

        .pwd-modal__form {
          padding: var(--spacing-5);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-4);
        }

        .pwd-modal__error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: var(--color-danger);
          padding: var(--spacing-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: 500;
        }

        .pwd-modal__field {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-1);
        }

        .pwd-modal__label {
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .pwd-modal__input {
          width: 100%;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-2) var(--spacing-3);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-family: inherit;
          transition: all 0.2s;
        }

        .pwd-modal__input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-muted);
        }

        .pwd-modal__actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-2);
          margin-top: var(--spacing-2);
        }

        .pwd-modal__btn {
          font-family: inherit;
          font-size: var(--font-size-sm);
          font-weight: 600;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }

        .pwd-modal__btn--cancel {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
        }

        .pwd-modal__btn--cancel:hover {
          background: var(--color-border-subtle);
          color: var(--color-text-primary);
        }

        .pwd-modal__btn--submit {
          background: var(--color-primary);
          border: none;
          color: white;
        }

        .pwd-modal__btn--submit:hover {
          background: var(--color-primary-hover);
          box-shadow: 0 4px 12px var(--color-primary-muted);
        }

        .pwd-modal__btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
