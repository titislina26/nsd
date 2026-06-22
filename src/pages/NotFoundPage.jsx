import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 120,
        fontWeight: 900,
        background: 'linear-gradient(135deg, var(--color-primary), #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        marginBottom: 'var(--spacing-4)',
      }}>
        404
      </div>

      <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2)' }}>
        Halaman Tidak Ditemukan
      </h1>

      <p style={{
        color: 'var(--color-text-secondary)',
        maxWidth: 400,
        marginBottom: 'var(--spacing-8)',
      }}>
        Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>

      <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
        <button className="btn btn--ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Kembali
        </button>
        <button className="btn btn--primary" onClick={() => navigate('/')}>
          <Home size={16} />
          Ke Dashboard
        </button>
      </div>
    </div>
  )
}
