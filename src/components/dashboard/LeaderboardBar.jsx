import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import useAppStore from '@/store/useAppStore'

const BAR_COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#ddd6fe']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
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
      }}>
        {data.name}
      </div>
      <div style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
        marginTop: 4,
      }}>
        {data.count} dokumen · Area: {data.area}
      </div>
    </div>
  )
}

export default function LeaderboardBar() {
  const getTopRequestors = useAppStore(state => state.getTopRequestors)
  const data = getTopRequestors(5)

  return (
    <div className="card" style={{ height: '100%' }}>
      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--spacing-4)' }}>
        Leaderboard Requestor Teraktif
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
          barCategoryGap="20%"
        >
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            maxBarSize={28}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
