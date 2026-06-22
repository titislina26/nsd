import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, Check, FileText, Users, X, ClipboardList } from 'lucide-react'
import useAppStore from '@/store/useAppStore'

export default function Header({ title, onMenuClick }) {
  const currentUser = useAppStore((state) => state.currentUser)
  const getNotifications = useAppStore((state) => state.getNotifications)
  const notifications = getNotifications ? getNotifications() : []
  const markNotificationAsRead = useAppStore((state) => state.markNotificationAsRead)
  const markAllNotificationsAsRead = useAppStore((state) => state.markAllNotificationsAsRead)
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const popoverRef = useRef(null)
  const navigate = useNavigate()

  // Listen to Cmd+K or Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const unreadCount = notifications.filter(n => n.isUnread).length
  const activeNotifIds = notifications.map(n => n.id)

  const getInitials = (name) => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatRole = (role) => {
    if (role === 'ADMIN_FINANCE') return 'Admin Finance'
    if (role === 'REQUESTOR') return 'Requestor'
    return role || ''
  }

  // Click outside to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id)
    setShowNotifications(false)
    navigate(notif.path)
  }

  const handleMarkAllRead = (e) => {
    e.stopPropagation()
    markAllNotificationsAsRead(activeNotifIds)
  }

  return (
    <header className="header">
      <div className="header__left">
        <button
          className="header__menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="header__title">{title}</h1>
      </div>

      <div className="header__right">
        <button 
          className="header__search" 
          onClick={() => setShowSearch(true)}
          style={{ background: 'transparent', border: '1px solid var(--color-border)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Search size={14} />
          <span>Cari data...</span>
          <span className="header__search-key">⌘K</span>
        </button>

        {/* Notifications Button & Popover */}
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <button 
            className="header__icon-btn" 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: showNotifications ? 'var(--color-surface-elevated)' : 'transparent',
              color: showNotifications ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="header__icon-btn-badge" style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 16,
                height: 16,
                background: 'var(--color-danger)',
                border: '2px solid var(--color-background)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '9px',
                fontWeight: 'bold',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="badge badge--danger" style={{ padding: '2px var(--spacing-2)', fontSize: '10px' }}>
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="btn btn--ghost btn--sm"
                    style={{ padding: 'var(--spacing-1) var(--spacing-2)', fontSize: '11px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Check size={12} />
                    <span>Tandai semua dibaca</span>
                  </button>
                )}
              </div>

              <div className="notification-dropdown__list">
                {notifications.length === 0 ? (
                  <div className="notification-dropdown__empty">
                    <div className="notification-dropdown__empty-icon">
                      <Bell size={24} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Semua Bersih!</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>Tidak ada notifikasi baru untuk saat ini.</span>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = notif.type === 'technician' ? Users : FileText
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`notification-item ${notif.isUnread ? 'notification-item--unread' : ''}`}
                      >
                        <div className={`notification-item__icon notification-item__icon--${notif.type}`}>
                          <Icon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--spacing-2)' }}>
                            <span className="notification-item__title">{notif.title}</span>
                            <span className="notification-item__time">{notif.timestamp}</span>
                          </div>
                          <p className="notification-item__message">{notif.message}</p>
                        </div>
                        {notif.isUnread && (
                          <span className="notification-item__dot" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {currentUser && (
          <>
            <span className="header__role-badge">
              {formatRole(currentUser.role)} {currentUser.area ? `(${currentUser.area})` : ''}
            </span>

            <div className="header__avatar" title={currentUser.name}>
              {getInitials(currentUser.name)}
            </div>
          </>
        )}
      </div>

      <style>{`
        .notification-dropdown {
          position: absolute;
          top: calc(100% + var(--spacing-2));
          right: 0;
          width: 380px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          overflow: hidden;
          animation: slideDownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDownIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .notification-dropdown__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-4) var(--spacing-4) var(--spacing-3);
          border-bottom: 1px solid var(--color-border);
        }

        .notification-dropdown__list {
          max-height: 380px;
          overflow-y: auto;
        }

        .notification-dropdown__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-8) var(--spacing-6);
          gap: var(--spacing-1);
        }

        .notification-dropdown__empty-icon {
          width: 48px;
          height: 48px;
          background: var(--color-border-subtle);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-2);
        }

        .notification-item {
          display: flex;
          gap: var(--spacing-3);
          padding: var(--spacing-4);
          border-bottom: 1px solid var(--color-border-subtle);
          cursor: pointer;
          transition: background var(--transition-fast);
          position: relative;
        }

        .notification-item:hover {
          background: var(--color-border-subtle);
        }

        .notification-item--unread {
          background: rgba(22, 163, 74, 0.03);
        }

        .notification-item__icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-item__icon--expense {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }

        .notification-item__icon--technician {
          background: rgba(14, 165, 233, 0.08);
          color: #0ea5e9;
        }

        .notification-item__icon--disbursement {
          background: var(--color-success-muted);
          color: var(--color-success);
        }

        .notification-item__icon--approval {
          background: var(--color-warning-muted);
          color: var(--color-warning);
        }

        .notification-item__title {
          font-weight: 700;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .notification-item__time {
          font-size: 10px;
          color: var(--color-text-tertiary);
          white-space: nowrap;
        }

        .notification-item__message {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-top: 2px;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .notification-item__dot {
          position: absolute;
          right: var(--spacing-4);
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: var(--color-danger);
          border-radius: var(--radius-full);
        }

        /* Search Modal Styles */
        .search-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 100px;
          z-index: 999;
          animation: fadeIn 0.2s ease-out;
        }

        .search-modal {
          width: 100%;
          max-width: 600px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .search-modal__header {
          display: flex;
          align-items: center;
          padding: var(--spacing-4) var(--spacing-5);
          border-bottom: 1px solid var(--color-border);
          gap: var(--spacing-3);
        }

        .search-modal__icon {
          color: var(--color-text-tertiary);
          flex-shrink: 0;
        }

        .search-modal__input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text-primary);
          font-family: inherit;
          font-size: var(--font-size-base);
        }

        .search-modal__close {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: var(--spacing-1);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }

        .search-modal__close:hover {
          background: var(--color-border-subtle);
          color: var(--color-text-primary);
        }

        .search-modal__content {
          max-height: 400px;
          overflow-y: auto;
          padding: var(--spacing-4) var(--spacing-5);
        }

        .search-modal__hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-8) 0;
          gap: var(--spacing-2);
          text-align: center;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3) var(--spacing-4);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }

        .search-result-item:hover {
          background: var(--color-border-subtle);
          transform: translateX(3px);
        }

        .search-result-item__icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .search-result-item__icon--expense {
          background: var(--color-primary-muted);
          color: var(--color-primary);
        }

        .search-result-item__icon--tech {
          background: rgba(14, 165, 233, 0.08);
          color: #0ea5e9;
        }

        .search-result-item__icon--task {
          background: var(--color-warning-muted);
          color: var(--color-warning);
        }

        .search-result-item__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .search-result-item__name {
          font-weight: 700;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .search-result-item__desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .search-modal__footer {
          padding: var(--spacing-3) var(--spacing-5);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          background: var(--color-background);
        }

        .search-shortcut-hint {
          font-size: 11px;
          color: var(--color-text-tertiary);
        }

        .search-shortcut-hint kbd {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 1px 5px;
          font-size: 10px;
          box-shadow: var(--shadow-sm);
        }
      `}</style>
      
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </header>
  )
}

function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  
  const carfExpenses = useAppStore((state) => state.carfExpenses)
  const technicians = useAppStore((state) => state.technicians)
  const tasks = useAppStore((state) => state.tasks)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Key listener inside modal (Escape key)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Perform search
  const cleanQuery = query.toLowerCase().trim()
  
  const filteredExpenses = cleanQuery ? carfExpenses.filter(exp => 
    (exp.document_number && exp.document_number.toLowerCase().includes(cleanQuery)) ||
    (exp.description && exp.description.toLowerCase().includes(cleanQuery)) ||
    (exp.expense_category && exp.expense_category.toLowerCase().includes(cleanQuery)) ||
    (exp.requestor_name && exp.requestor_name.toLowerCase().includes(cleanQuery)) ||
    (exp.technician_name && exp.technician_name.toLowerCase().includes(cleanQuery))
  ).slice(0, 4) : []

  const filteredTechnicians = cleanQuery ? technicians.filter(tech => 
    (tech.name && tech.name.toLowerCase().includes(cleanQuery)) ||
    (tech.bank_name && tech.bank_name.toLowerCase().includes(cleanQuery)) ||
    (tech.bank_account_number && tech.bank_account_number.toLowerCase().includes(cleanQuery)) ||
    (tech.verification_status && tech.verification_status.toLowerCase().includes(cleanQuery))
  ).slice(0, 4) : []

  const filteredTasks = cleanQuery ? tasks.filter(task => 
    (task.task_type && task.task_type.toLowerCase().includes(cleanQuery)) ||
    (task.area && task.area.toLowerCase().includes(cleanQuery)) ||
    (task.description && task.description.toLowerCase().includes(cleanQuery))
  ).slice(0, 4) : []

  const hasResults = filteredExpenses.length > 0 || filteredTechnicians.length > 0 || filteredTasks.length > 0

  const handleSelectResult = (path) => {
    onClose()
    navigate(path)
  }

  return (
    <div className="search-backdrop" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal__header">
          <Search size={18} className="search-modal__icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal__input"
            placeholder="Cari pengeluaran, teknisi, area, dokumen..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="search-modal__close" onClick={onClose} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="search-modal__content">
          {!cleanQuery ? (
            <div className="search-modal__hint">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Ketik kata kunci untuk mencari...</span>
            </div>
          ) : !hasResults ? (
            <div className="search-modal__hint">
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tidak ada hasil ditemukan</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Coba gunakan kata kunci lainnya.</span>
            </div>
          ) : (
            <div className="search-modal__results" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {/* Expenses Category */}
              {filteredExpenses.length > 0 && (
                <div className="search-category">
                  <div className="search-category__title">Pengeluaran CARF</div>
                  {filteredExpenses.map(exp => (
                    <div
                      key={exp.id}
                      className="search-result-item"
                      onClick={() => handleSelectResult('/expenses')}
                    >
                      <FileText size={16} className="search-result-item__icon search-result-item__icon--expense" />
                      <div className="search-result-item__info">
                        <span className="search-result-item__name">{exp.document_number}</span>
                        <span className="search-result-item__desc">{exp.description}</span>
                      </div>
                      <span className="badge badge--neutral">{exp.status_document}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Technicians Category */}
              {filteredTechnicians.length > 0 && (
                <div className="search-category">
                  <div className="search-category__title">Teknisi & Rekening</div>
                  {filteredTechnicians.map(tech => (
                    <div
                      key={tech.id}
                      className="search-result-item"
                      onClick={() => handleSelectResult('/technicians')}
                    >
                      <Users size={16} className="search-result-item__icon search-result-item__icon--tech" />
                      <div className="search-result-item__info">
                        <span className="search-result-item__name">{tech.name}</span>
                        <span className="search-result-item__desc">{tech.bank_name} - {tech.bank_account_number}</span>
                      </div>
                      <span className={`badge ${tech.verification_status === 'VERIFIED' ? 'badge--success' : 'badge--warning'}`}>
                        {tech.verification_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks Category */}
              {filteredTasks.length > 0 && (
                <div className="search-category">
                  <div className="search-category__title">Penugasan Lapangan</div>
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className="search-result-item"
                      onClick={() => handleSelectResult('/')}
                    >
                      <ClipboardList size={16} className="search-result-item__icon search-result-item__icon--task" />
                      <div className="search-result-item__info">
                        <span className="search-result-item__name">{task.task_type} ({task.area})</span>
                        <span className="search-result-item__desc">{task.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="search-modal__footer">
          <span className="search-shortcut-hint">Tekan <kbd>ESC</kbd> untuk keluar</span>
        </div>
      </div>
    </div>
  )
}
