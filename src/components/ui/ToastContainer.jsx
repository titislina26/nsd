import useAppStore from '@/store/useAppStore'

export default function ToastContainer() {
  const toasts = useAppStore(state => state.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.variant || 'success'}`}>
          <div>
            <div className="toast__title">{toast.title}</div>
            {toast.message && <div className="toast__message">{toast.message}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
