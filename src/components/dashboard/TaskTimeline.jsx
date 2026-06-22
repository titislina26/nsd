import { useMemo, useState } from 'react'
import useAppStore from '@/store/useAppStore'
import { TASK_TYPE_LABELS, TASK_TYPE_COLORS, AREA_LABELS, formatDate } from '@/lib/utils'

export default function TaskTimeline() {
  const tasks = useAppStore(state => state.tasks)
  const technicians = useAppStore(state => state.technicians)
  const expenses = useAppStore(state => state.carfExpenses)
  const [hoveredTask, setHoveredTask] = useState(null)

  const { timelineData, minDate, maxDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) return { timelineData: [], minDate: null, maxDate: null, totalDays: 1 }

    const dates = tasks.flatMap(t => [new Date(t.start_date), new Date(t.end_date)])
    const min = new Date(Math.min(...dates))
    const max = new Date(Math.max(...dates))
    const total = Math.ceil((max - min) / (1000 * 60 * 60 * 24)) || 1

    // Find which technicians are assigned to each task
    const data = tasks.map(task => {
      const taskExpenses = expenses.filter(e => e.task_id === task.id)
      const techIds = [...new Set(taskExpenses.map(e => e.technician_id))]
      const techs = techIds.map(id => technicians.find(t => t.id === id)).filter(Boolean)

      const start = new Date(task.start_date)
      const end = new Date(task.end_date)
      const offsetDays = Math.ceil((start - min) / (1000 * 60 * 60 * 24))
      const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1

      return {
        ...task,
        techs,
        offsetPercent: (offsetDays / total) * 100,
        widthPercent: (durationDays / total) * 100,
        durationDays,
      }
    })

    return { timelineData: data, minDate: min, maxDate: max, totalDays: total }
  }, [tasks, expenses, technicians])

  // Generate month markers
  const monthMarkers = useMemo(() => {
    if (!minDate || !maxDate) return []
    const markers = []
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    while (current <= maxDate) {
      const offsetDays = Math.ceil((current - minDate) / (1000 * 60 * 60 * 24))
      const percent = Math.max(0, (offsetDays / totalDays) * 100)
      markers.push({
        label: current.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        percent,
      })
      current.setMonth(current.getMonth() + 1)
    }
    return markers
  }, [minDate, maxDate, totalDays])

  return (
    <div className="card">
      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--spacing-2)' }}>
        Timeline Pekerjaan
      </h3>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-6)' }}>
        Rentang tugas lapangan teknisi
      </p>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 'var(--spacing-4)',
        flexWrap: 'wrap',
      }}>
        {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: TASK_TYPE_COLORS[key] }} />
            {label}
          </div>
        ))}
      </div>

      {/* Timeline Container */}
      <div style={{ overflowX: 'auto', paddingBottom: 'var(--spacing-4)' }}>
        <div style={{ minWidth: 600, position: 'relative' }}>
          {/* Month markers */}
          <div style={{
            display: 'flex',
            position: 'relative',
            height: 28,
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--spacing-2)',
          }}>
            {monthMarkers.map((marker, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${marker.percent}%`,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  transform: 'translateX(-50%)',
                }}
              >
                {marker.label}
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div style={{ position: 'relative' }}>
            {monthMarkers.map((marker, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${marker.percent}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'var(--color-border-subtle)',
                  zIndex: 0,
                }}
              />
            ))}

            {/* Task bars */}
            {timelineData.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 40,
                  position: 'relative',
                  marginBottom: 4,
                }}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                {/* Task bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${task.offsetPercent}%`,
                    width: `${Math.max(task.widthPercent, 2)}%`,
                    height: 28,
                    background: `${TASK_TYPE_COLORS[task.task_type]}`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    paddingRight: 8,
                    fontSize: 'var(--font-size-xs)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: hoveredTask && hoveredTask !== task.id ? 0.4 : 1,
                    zIndex: hoveredTask === task.id ? 2 : 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    boxShadow: hoveredTask === task.id
                      ? `0 4px 12px ${TASK_TYPE_COLORS[task.task_type]}40`
                      : 'none',
                    transform: hoveredTask === task.id ? 'scaleY(1.15)' : 'scaleY(1)',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {TASK_TYPE_LABELS[task.task_type]} · {AREA_LABELS[task.area]}
                  </span>
                </div>

                {/* Tooltip on hover */}
                {hoveredTask === task.id && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${task.offsetPercent + task.widthPercent / 2}%`,
                      top: -70,
                      transform: 'translateX(-50%)',
                      background: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '8px 12px',
                      zIndex: 10,
                      boxShadow: 'var(--shadow-xl)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {TASK_TYPE_LABELS[task.task_type]} — {AREA_LABELS[task.area]}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {formatDate(task.start_date)} → {formatDate(task.end_date)} ({task.durationDays} hari)
                    </div>
                    {task.techs.length > 0 && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        Teknisi: {task.techs.map(t => t.name).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
