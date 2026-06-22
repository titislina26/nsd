import KpiCards from '@/components/dashboard/KpiCards'
import useAppStore from '@/store/useAppStore'

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

      {/* KPI Cards */}
      <KpiCards />

      {/* Progress Diagram Card */}
      <div className="card" style={{ marginTop: 'var(--spacing-6)', padding: 'var(--spacing-6)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--spacing-4)', color: 'var(--color-text-primary)' }}>
          Status Penyelesaian & Pencetakan Dokumen
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Progres: {percentage}%
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
            {doneCount} dari {totalCount} Dokumen Selesai
          </span>
        </div>

        {/* Progress bar container */}
        <div style={{
          width: '100%',
          height: '16px',
          background: 'var(--color-border)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: 'var(--spacing-4)'
        }}>
          {/* Done progress */}
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4ade80, var(--color-primary))',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Selesai & Diprint ({doneCount} Dokumen)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-border)', display: 'inline-block' }} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Belum Selesai / Pending ({pendingCount} Dokumen)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
