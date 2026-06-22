import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, Edit, Calendar } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { formatDate, TASK_TYPE_LABELS, TASK_TYPE_COLORS, AREA_LABELS } from '@/lib/utils'

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, addToast } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [areaFilter, setAreaFilter] = useState('ALL')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = !searchQuery || [t.id, t.description, t.area].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesType = typeFilter === 'ALL' || t.task_type === typeFilter
      const matchesArea = areaFilter === 'ALL' || t.area === areaFilter
      return matchesSearch && matchesType && matchesArea
    })
  }, [tasks, searchQuery, typeFilter, areaFilter])

  const handleDelete = (id) => {
    if (window.confirm('Hapus tugas ini?')) {
      deleteTask(id)
      addToast({ title: 'Tugas dihapus', variant: 'danger' })
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Tugas Lapangan</h1>
          <p className="page__subtitle">{tasks.length} total tugas terdaftar</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowAddDialog(true)}>
          <Plus size={16} />
          Tambah Tugas
        </button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-toolbar__filters">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input className="input" placeholder="Cari tugas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 32, width: 200 }} />
            </div>
            <select className="input select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 150 }}>
              <option value="ALL">Semua Tipe</option>
              {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input select" value={areaFilter} onChange={e => setAreaFilter(e.target.value)} style={{ width: 160 }}>
              <option value="ALL">Semua Area</option>
              {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipe</th>
                <th>Area</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Deskripsi</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="data-table__empty">Tidak ada data ditemukan</td></tr>
              ) : (
                filtered.map(task => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
                      {task.id}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: `${TASK_TYPE_COLORS[task.task_type]}20`,
                        color: TASK_TYPE_COLORS[task.task_type],
                      }}>
                        <span className="badge__dot" />
                        {TASK_TYPE_LABELS[task.task_type]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-primary)' }}>{AREA_LABELS[task.area]}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                        {formatDate(task.start_date)}
                      </div>
                    </td>
                    <td>{formatDate(task.end_date)}</td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn--ghost btn--icon" onClick={() => setEditingTask(task)} title="Edit">
                          <Edit size={14} />
                        </button>
                        <button className="btn btn--ghost btn--icon" onClick={() => handleDelete(task.id)} title="Hapus" style={{ color: 'var(--color-text-tertiary)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {(showAddDialog || editingTask) && (
        <TaskFormDialog
          task={editingTask}
          onClose={() => { setShowAddDialog(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}

function TaskFormDialog({ task, onClose }) {
  const { addTask, updateTask, addToast } = useAppStore()
  const isEditing = !!task

  const [form, setForm] = useState({
    task_type: task?.task_type || 'INSTALLATION',
    area: task?.area || 'JAWA',
    start_date: task?.start_date || new Date().toISOString().split('T')[0],
    end_date: task?.end_date || '',
    description: task?.description || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.description || !form.end_date) {
      addToast({ title: 'Harap isi semua field', variant: 'danger' })
      return
    }
    if (isEditing) {
      updateTask(task.id, form)
      addToast({ title: 'Tugas diperbarui', variant: 'success' })
    } else {
      addTask(form)
      addToast({ title: 'Tugas baru ditambahkan', variant: 'success' })
    }
    onClose()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog__header">
          <h2 className="dialog__title">{isEditing ? 'Edit Tugas' : 'Tambah Tugas'}</h2>
          <button className="dialog__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid--2">
            <div className="form-group">
              <label className="label">Tipe Tugas</label>
              <select className="input select" value={form.task_type} onChange={e => setForm({ ...form, task_type: e.target.value })}>
                {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Area</label>
              <select className="input select" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}>
                {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid--2">
            <div className="form-group">
              <label className="label">Tanggal Mulai</label>
              <input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Tanggal Selesai</label>
              <input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Deskripsi</label>
            <textarea className="input textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detail tugas lapangan..." />
          </div>
          <div className="dialog__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn--primary">{isEditing ? 'Simpan Perubahan' : 'Tambah'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
