import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Edit, Filter, ChevronDown, FileText } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import {
  formatRupiah, formatDate,
  getDocStatusVariant, getDisbursementStatusVariant,
  EXPENSE_CATEGORIES, AREA_LABELS,
} from '@/lib/utils'

export default function ExpensesPage() {
  const { carfExpenses, users, technicians, tasks, updateExpenseStatus, deleteExpense, deleteExpensesBulk, addExpense, uploadReceipt, addToast, isLoading } = useAppStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [disbursementFilter, setDisbursementFilter] = useState('ALL')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [statusDropdown, setStatusDropdown] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih?`)) {
      try {
        await deleteExpensesBulk(selectedIds)
        addToast({ title: `${selectedIds.length} data berhasil dihapus`, variant: 'danger' })
        setSelectedIds([])
      } catch (err) {
        // Handled
      }
    }
  }

  const filtered = useMemo(() => {
    return carfExpenses.filter(exp => {
      const tech = technicians.find(t => t.id === exp.technician_id)
      const user = users.find(u => u.id === exp.requestor_id)
      const matchesSearch = !searchQuery || [
        exp.document_number,
        exp.description,
        exp.expense_category,
        tech?.name,
        user?.name,
      ].some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'ALL' || exp.status_document === statusFilter
      const matchesDisbursement = disbursementFilter === 'ALL' || exp.status_disbursement === disbursementFilter

      return matchesSearch && matchesStatus && matchesDisbursement
    })
  }, [carfExpenses, searchQuery, statusFilter, disbursementFilter, technicians, users])

  const handleStatusChange = (id, statusDoc, statusDisbursement) => {
    updateExpenseStatus(id, statusDoc, statusDisbursement)
    setStatusDropdown(null)
    addToast({ title: 'Status diperbarui', variant: 'success' })
  }

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      deleteExpense(id)
      addToast({ title: 'Data berhasil dihapus', variant: 'danger' })
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Data CARF & Pengeluaran</h1>
          <p className="page__subtitle">{carfExpenses.length} total data pengajuan</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowAddDialog(true)}>
          <Plus size={16} />
          Tambah CARF
        </button>
      </div>

      <div className="data-table-wrapper">
        {/* Toolbar */}
        <div className="data-table-toolbar">
          <div className="data-table-toolbar__filters">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)',
              }} />
              <input
                className="input"
                placeholder="Cari dokumen, teknisi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32, width: 240 }}
              />
            </div>

            <select
              className="input select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="ALL">Semua Status Dok.</option>
              <option value="NOT_YET">Not Yet</option>
              <option value="APPROVED">Approved</option>
              <option value="DONE">Done</option>
            </select>

            <select
              className="input select"
              value={disbursementFilter}
              onChange={e => setDisbursementFilter(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="ALL">Semua Pembayaran</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
            </select>

            {selectedIds.length > 0 && (
              <button
                className="btn btn--danger"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38 }}
                onClick={handleBulkDelete}
              >
                <Trash2 size={14} />
                <span>Hapus Terpilih ({selectedIds.length})</span>
              </button>
            )}
          </div>

          <div className="text-sm text-secondary">
            {filtered.length} dari {carfExpenses.length} data
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(e => selectedIds.includes(e.id))}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedIds(prev => {
                          const newSet = new Set(prev)
                          filtered.forEach(item => newSet.add(item.id))
                          return Array.from(newSet)
                        })
                      } else {
                        setSelectedIds(prev => prev.filter(id => !filtered.some(f => f.id === id)))
                      }
                    }}
                  />
                </th>
                <th>No Dokumen</th>
                <th>Tanggal Permintaan</th>
                <th>Requestor</th>
                <th>USER</th>
                <th>Deskripsi Kebutuhan</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'right' }}>Total Pengajuan</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="data-table__empty">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map(exp => {
                  const tech = technicians.find(t => t.id === exp.technician_id)
                  const user = users.find(u => u.id === exp.requestor_id)
                  const task = tasks.find(t => t.id === exp.task_id)

                  return (
                    <tr key={exp.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(exp.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, exp.id])
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== exp.id))
                            }
                          }}
                        />
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xs)' }}>
                          {exp.document_number}
                        </span>
                      </td>
                      <td>{formatDate(exp.request_date)}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{exp.requestor_name || user?.name || '-'}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{user?.area || ''}</div>
                      </td>
                      <td style={{ color: 'var(--color-text-primary)' }}>{exp.technician_name || tech?.name || '-'}</td>
                      <td style={{ fontSize: 'var(--font-size-xs)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.description}>
                        {exp.description || '-'}
                      </td>
                      <td>
                        <span className="badge badge--neutral">{exp.expense_category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                        {formatRupiah(exp.amount)}
                      </td>
                      <td style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                        <button
                          className="btn btn--ghost btn--icon"
                          onClick={() => navigate('/documents', { state: { selectedExpenseId: exp.id } })}
                          title="Cetak Kuitansi & Cover"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          className="btn btn--ghost btn--icon"
                          onClick={() => handleDelete(exp.id)}
                          title="Hapus"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="data-table-footer">
          <span>Menampilkan {filtered.length} data</span>
          <span>Total: {formatRupiah(filtered.reduce((sum, e) => sum + (e.amount || 0), 0))}</span>
        </div>
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <AddExpenseDialog onClose={() => setShowAddDialog(false)} />
      )}
    </div>
  )
}

function AddExpenseDialog({ onClose }) {
  const { addExpense, technicians, addToast } = useAppStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    document_number: '',
    pengajuan_number: '',
    request_date: new Date().toISOString().split('T')[0],
    requestor_name: '',
    technician_name: '',
    technician_id: '',
    expense_category: '',
    description: '',
    description_other: '',
    amount: '',
  })

  const sortedTechnicians = [...technicians].sort((a, b) => a.name.localeCompare(b.name, 'id'))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.document_number || !form.amount || !form.description) {
      addToast({ title: 'Harap isi semua field wajib', variant: 'danger' })
      return
    }
    try {
      const newExpense = await addExpense({
        ...form,
        amount: parseFloat(form.amount.replace(/\D/g, '')) || 0,
      })
      addToast({ title: 'Data CARF berhasil ditambahkan', variant: 'success' })
      onClose()
      navigate('/documents', { state: { selectedExpenseId: newExpense.id } })
    } catch (err) {
      // Toast error is handled inside the store
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog--lg" onClick={e => e.stopPropagation()}>
        <div className="dialog__header">
          <h2 className="dialog__title">Tambah Data CARF</h2>
          <button className="dialog__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid--3">
            <div className="form-group">
              <label className="label">No Dokumen *</label>
              <input
                className="input"
                placeholder="CARF/NSD/2026/06/XXX"
                value={form.document_number}
                onChange={e => setForm({ ...form, document_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Pengajuan No.</label>
              <input
                className="input"
                placeholder="Misal: 33"
                value={form.pengajuan_number}
                onChange={e => setForm({ ...form, pengajuan_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Tanggal Permintaan</label>
              <input
                type="date"
                className="input"
                value={form.request_date}
                onChange={e => setForm({ ...form, request_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid--2">
            <div className="form-group">
              <label className="label">USER (Teknisi)</label>
              <select
                className="input select"
                value={form.technician_name}
                onChange={e => {
                  const selectedName = e.target.value
                  const selectedTech = technicians.find(t => t.name === selectedName)
                  setForm({
                    ...form,
                    technician_name: selectedName,
                    technician_id: selectedTech ? selectedTech.id : ''
                  })
                }}
              >
                <option value="">Pilih USER (Teknisi)</option>
                {sortedTechnicians.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Requestor</label>
              <input
                className="input"
                placeholder="Masukkan nama Requestor"
                value={form.requestor_name}
                onChange={e => setForm({ ...form, requestor_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid--2">
            <div className="form-group">
              <label className="label">Keterangan</label>
              <input
                className="input"
                placeholder="Misal: Transportasi / Tiket Pesawat"
                value={form.expense_category}
                onChange={e => setForm({ ...form, expense_category: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Total Pengajuan (Rp) *</label>
              <input
                className="input"
                placeholder="1500000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Deskripsi Kebutuhan *</label>
            <textarea
              className="input textarea"
              placeholder="Detail kebutuhan..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="label">Deskripsi Dana Other</label>
            <textarea
              className="input textarea"
              placeholder="Detail rincian dana other..."
              value={form.description_other}
              onChange={e => setForm({ ...form, description_other: e.target.value })}
            />
          </div>

          <div className="dialog__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn--primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  )
}
