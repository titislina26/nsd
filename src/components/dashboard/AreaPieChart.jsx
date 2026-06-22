import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import useAppStore from '@/store/useAppStore'
import { formatRupiah, AREA_COLORS, AREA_LABELS } from '@/lib/utils'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const total = data.total
  const percentage = data.percentage

  return (
    <div style={{
      background: 'var(--color-surface-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-xl)',
    }}>
      <div style={{
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: 4,
      }}>
        {AREA_LABELS[data.area] || data.area}
      </div>
      <div style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
      }}>
        {formatRupiah(total)} ({percentage}%)
      </div>
      <div style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-tertiary)',
        marginTop: 2,
      }}>
        {data.count} transaksi
      </div>
    </div>
  )
}

const CustomLegend = ({ payload }) => {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px 16px',
      justifyContent: 'center',
      marginTop: 12,
    }}>
      {payload.map((entry, idx) => (
        <div key={idx} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: entry.color,
          }} />
          {AREA_LABELS[entry.value] || entry.value}
        </div>
      ))}
    </div>
  )
}

export default function AreaPieChart() {
  const getExpensesByArea = useAppStore(state => state.getExpensesByArea)
  const rawData = getExpensesByArea()

  const grandTotal = rawData.reduce((sum, d) => sum + d.total, 0)
  const data = rawData.map(d => ({
    ...d,
    name: AREA_LABELS[d.area] || d.area,
    percentage: grandTotal > 0 ? Math.round((d.total / grandTotal) * 100) : 0,
  }))

  return (
    <div className="card" style={{ height: '100%' }}>
      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--spacing-4)' }}>
        Distribusi Pengeluaran per Area
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="area"
            cx="50%"
            cy="45%"
            outerRadius={100}
            innerRadius={55}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={AREA_COLORS[entry.area] || '#64748b'}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
