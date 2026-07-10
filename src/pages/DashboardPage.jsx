import KpiCards from '@/components/dashboard/KpiCards'
import useAppStore from '@/store/useAppStore'
import { CheckCircle, Clock } from 'lucide-react'

export default function DashboardPage() {
  const store = useAppStore()
  const percentage = store.getPaidPercentage()
  const doneCount = store.getDoneCount()
  const totalCount = store.getTotalCount()
  const pendingCount = totalCount - doneCount

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Dashboard Analitik</h1>
          <p className="page__subtitle">Ringkasan operasional dan pengeluaran CARF</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* KPI Cards */}
        <KpiCards />

        {/* Progress Diagram Card */}
        <div className="card" style={{ padding: 'var(--spacing-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-8)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-1)' }}>
                Status Penyelesaian & Pencetakan
              </h3>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                Pantau progres dokumen yang telah diproses hingga pencetakan.
              </p>
            </div>
            <div className="badge badge--primary" style={{ padding: 'var(--spacing-2) var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>
              Progres Keseluruhan: {percentage}%
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-3)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Penyelesaian
            </span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {doneCount} dari {totalCount} Dokumen Selesai
            </span>
          </div>

          {/* Progress bar container */}
          <div style={{ 
            width: '100%', 
            height: '24px', 
            background: 'var(--color-border-subtle)', 
            borderRadius: 'var(--radius-full)', 
            overflow: 'hidden', 
            display: 'flex', 
            marginBottom: 'var(--spacing-8)', 
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' 
          }}>
            {/* Done progress */}
            <div 
              style={{ 
                width: `${percentage}%`, 
                background: 'linear-gradient(90deg, var(--color-success) 0%, #34d399 100%)',
                height: '100%',
                transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {percentage > 5 && `${percentage}%`}
              <div style={{ 
                position: 'absolute', inset: 0, 
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s infinite linear' 
              }} />
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 'var(--spacing-8)', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--color-success-muted)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Selesai & Diprint</div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{doneCount}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'rgba(100, 116, 139, 0.1)', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Pending Documents</div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{pendingCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
