import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { api } from '@/services/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [demoUsers, setDemoUsers] = useState([])
  const [loadingDemo, setLoadingDemo] = useState(false)
  
  const loginUser = useAppStore((state) => state.loginUser)
  const currentUser = useAppStore((state) => state.currentUser)
  const isLoading = useAppStore((state) => state.isLoading)
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  // Fetch demo users for the quick-login section
  useEffect(() => {
    async function fetchDemoUsers() {
      setLoadingDemo(true)
      try {
        const users = await api.get('/users')
        setDemoUsers(users.slice(0, 5)) // show top 5
      } catch (err) {
        console.error('Failed to fetch demo users', err)
      } finally {
        setLoadingDemo(false)
      }
    }
    fetchDemoUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Email wajib diisi')
      return
    }
    try {
      await loginUser(email)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Gagal login. Periksa kembali email Anda.')
    }
  }

  const handleDemoLogin = async (demoEmail) => {
    setError('')
    try {
      await loginUser(demoEmail)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Gagal login demo.')
    }
  }

  return (
    <div className="login-page">
      {/* Background blobs */}
      <div className="login-bg-blob login-bg-blob--1"></div>
      <div className="login-bg-blob login-bg-blob--2"></div>
      <div className="login-bg-blob login-bg-blob--3"></div>

      <div className="login-card">
        <div className="login-card__header">
          <div className="login-logo">
            <img src="/logo-nsd.png" alt="NSD Logo" className="login-logo__img" />
          </div>
          <h2 className="login-title">Portal NSD</h2>
          <p className="login-subtitle">Expense & CARF Management System</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertTriangle size={18} className="login-error__icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-field__label">Alamat Email</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                type="email"
                className="login-input"
                placeholder="nama@nso.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-field__label">Kata Sandi (Password)</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <span className="login-field__helper">Gunakan password apa saja untuk uji coba local.</span>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login-spinner"></span>
            ) : (
              <>
                <span>Masuk Aplikasi</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo login shortcuts */}
        <div className="login-demo-section">
          <div className="login-demo-title">
            <CheckCircle size={14} />
            <span>Akses Demo Cepat</span>
          </div>
          <p className="login-demo-desc">
            Pilih salah satu user di bawah ini untuk masuk secara instan tanpa mengetik email:
          </p>

          <div className="login-demo-grid">
            {loadingDemo ? (
              <div className="login-demo-loading">Memuat user simulasi...</div>
            ) : (
              demoUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="login-demo-badge"
                  onClick={() => handleDemoLogin(user.email)}
                  disabled={isLoading}
                >
                  <div className="login-demo-badge__info">
                    <span className="login-demo-badge__name">{user.name}</span>
                    <span className="login-demo-badge__role">
                      {user.role === 'ADMIN_FINANCE' ? 'Admin Finance' : `Requestor (${user.area || 'All'})`}
                    </span>
                  </div>
                  <Users size={14} className="login-demo-badge__icon" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #064e3b 100%);
          position: relative;
          overflow: hidden;
          font-family: var(--font-family);
          padding: var(--spacing-4);
        }

        /* Ambient Blobs */
        .login-bg-blob {
          position: absolute;
          border-radius: var(--radius-full);
          filter: blur(120px);
          opacity: 0.15;
          pointer-events: none;
          z-index: 1;
        }

        .login-bg-blob--1 {
          width: 400px;
          height: 400px;
          background: var(--color-primary);
          top: -100px;
          left: -100px;
          animation: float 20s infinite alternate;
        }

        .login-bg-blob--2 {
          width: 500px;
          height: 500px;
          background: #0ea5e9;
          bottom: -150px;
          right: -100px;
          animation: float 25s infinite alternate-reverse;
        }

        .login-bg-blob--3 {
          width: 300px;
          height: 300px;
          background: #a78bfa;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.08;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }

        /* Glassmorphic Card */
        .login-card {
          width: 100%;
          max-width: 460px;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-8);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          z-index: 2;
          position: relative;
          color: white;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-card__header {
          text-align: center;
          margin-bottom: var(--spacing-6);
        }

        .login-logo {
          width: 64px;
          height: 64px;
          margin: 0 auto var(--spacing-3);
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: var(--spacing-2);
        }

        .login-logo__img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .login-title {
          font-size: var(--font-size-2xl);
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: var(--font-size-sm);
          color: #94a3b8;
          margin-top: 2px;
        }

        /* Forms & Fields */
        .login-error {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          padding: var(--spacing-3) var(--spacing-4);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-6);
          font-size: var(--font-size-sm);
        }

        .login-error__icon {
          flex-shrink: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-5);
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2);
        }

        .login-field__label {
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .login-field__helper {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: var(--spacing-4);
          color: #64748b;
          pointer-events: none;
          transition: color 0.2s;
        }

        .login-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          padding: var(--spacing-3) var(--spacing-4) var(--spacing-3) var(--spacing-10);
          color: white;
          font-size: var(--font-size-sm);
          font-family: inherit;
          transition: all 0.2s;
        }

        .login-input:focus {
          outline: none;
          border-color: var(--color-success);
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }

        .login-input:focus + .login-input-icon {
          color: var(--color-success);
        }

        .login-submit-btn {
          background: var(--color-success);
          color: white;
          font-family: inherit;
          font-size: var(--font-size-sm);
          font-weight: 700;
          padding: var(--spacing-3) var(--spacing-6);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-2);
          transition: all 0.2s;
          margin-top: var(--spacing-2);
        }

        .login-submit-btn:hover:not(:disabled) {
          background: var(--color-success-hover);
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.25);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Demo Login Grid */
        .login-demo-section {
          margin-top: var(--spacing-8);
          padding-top: var(--spacing-6);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .login-demo-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          font-size: var(--font-size-xs);
          font-weight: 700;
          color: #34d399;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--spacing-2);
        }

        .login-demo-desc {
          font-size: var(--font-size-xs);
          color: #94a3b8;
          margin-bottom: var(--spacing-4);
          line-height: 1.5;
        }

        .login-demo-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2);
          max-height: 190px;
          overflow-y: auto;
          padding-right: var(--spacing-1);
        }

        .login-demo-loading {
          font-size: var(--font-size-xs);
          color: #64748b;
          text-align: center;
          padding: var(--spacing-2) 0;
        }

        .login-demo-badge {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          padding: var(--spacing-2) var(--spacing-3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
          font-family: inherit;
        }

        .login-demo-badge:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(52, 211, 153, 0.3);
          transform: translateX(3px);
        }

        .login-demo-badge__info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .login-demo-badge__name {
          font-size: var(--font-size-sm);
          font-weight: 600;
        }

        .login-demo-badge__role {
          font-size: 11px;
          color: #94a3b8;
        }

        .login-demo-badge__icon {
          color: #64748b;
          transition: color 0.2s;
        }

        .login-demo-badge:hover:not(:disabled) .login-demo-badge__icon {
          color: #34d399;
        }
      `}</style>
    </div>
  )
}
