import { useState, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { FileText, Printer, Download, Search, Eye } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { formatRupiah, formatDate, AREA_LABELS, TASK_TYPE_LABELS } from '@/lib/utils'
import { terbilangRupiah } from '@/lib/terbilang'

export default function DocumentPage() {
  const { carfExpenses, technicians, users, tasks, uploadKtp } = useAppStore()
  const location = useLocation()
  const redirectExpenseId = location.state?.selectedExpenseId
  const [selectedExpenseId, setSelectedExpenseId] = useState(redirectExpenseId || '')
  const [activeTab, setActiveTab] = useState('kwitansi')
  const printRef = useRef(null)

  // Only show expenses that are DONE + PAID, or the currently selected redirected expense
  const eligibleExpenses = useMemo(() => {
    return carfExpenses
  }, [carfExpenses])

  const selectedExpense = useMemo(() => {
    if (!selectedExpenseId) return null
    return carfExpenses.find(e => e.id === selectedExpenseId)
  }, [selectedExpenseId, carfExpenses])

  const enrichedData = useMemo(() => {
    if (!selectedExpense) return null
    let tech = technicians.find(t => t.id === selectedExpense.technician_id)
    if (!tech && selectedExpense.technician_name) {
      tech = technicians.find(t => t.name.toLowerCase().trim() === selectedExpense.technician_name.toLowerCase().trim())
    }
    let user = users.find(u => u.id === selectedExpense.requestor_id)
    if (!user && selectedExpense.requestor_name) {
      user = users.find(u => u.name.toLowerCase().trim() === selectedExpense.requestor_name.toLowerCase().trim())
    }
    const task = tasks.find(t => t.id === selectedExpense.task_id)
    return { expense: selectedExpense, tech, user, task }
  }, [selectedExpense, technicians, users, tasks])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = printRef.current
      const opt = {
        margin: 5,
        filename: `${selectedExpense.document_number.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'landscape',
          compress: true
        },
      }
      html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF generation failed:', err)
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Generator Dokumen</h1>
          <p className="page__subtitle">Buat kwitansi dan cover report untuk data CARF yang sudah dibayarkan</p>
        </div>
      </div>

      {/* Expense Selector */}
      <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <label className="label">Pilih Data CARF</label>
            <select
              className="input select"
              value={selectedExpenseId}
              onChange={e => setSelectedExpenseId(e.target.value)}
            >
              <option value="">— Pilih data pengajuan —</option>
              {eligibleExpenses.map(exp => {
                const tech = technicians.find(t => t.id === exp.technician_id)
                return (
                  <option key={exp.id} value={exp.id}>
                    {exp.document_number} — {tech?.name || 'Unknown'} — {formatRupiah(exp.amount)}
                  </option>
                )
              })}
            </select>
          </div>

          {selectedExpense && (
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignSelf: 'flex-end' }}>
              <button className="btn btn--outline" onClick={handlePrint}>
                <Printer size={16} />
                Print
              </button>
              <button className="btn btn--primary" onClick={handleDownloadPDF}>
                <Download size={16} />
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {!selectedExpense ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-16)' }}>
          <FileText size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-4)' }} />
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Pilih data CARF untuk membuat dokumen
          </p>
          <p className="text-sm text-tertiary mt-2">
            Pilih nomor dokumen CARF untuk men-generate Kwitansi & Cover Report
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 'var(--spacing-6)' }}>
            <button
              className={`tab ${activeTab === 'kwitansi' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('kwitansi')}
            >
              Kwitansi
            </button>
            <button
              className={`tab ${activeTab === 'cover' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('cover')}
            >
              Cover Report
            </button>
          </div>

          {/* Preview */}
          <div className="card" style={{ padding: 'var(--spacing-8)', overflow: 'auto' }}>
            <div ref={printRef}>
              {activeTab === 'kwitansi' ? (
                <ReceiptPreview data={enrichedData} />
              ) : (
                <CoverPreview data={enrichedData} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const cleanDescriptionForVoucher = (desc, type) => {
  if (!desc) return ''
  let clean = desc.split(/Teknisi/i)[0].trim()
  
  const regex = /(Jasa\s+(dan|&|,)?\s+Transportasi|Jasa\s+(dan|&|,)?\s+Transport)/i
  if (type === 'jasa') {
    clean = clean.replace(regex, 'Biaya Jasa')
    if (!clean.toLowerCase().startsWith('biaya') && !clean.toLowerCase().startsWith('jasa')) {
      clean = 'Biaya Jasa ' + clean
    } else if (clean.toLowerCase().startsWith('jasa')) {
      clean = clean.replace(/^Jasa/i, 'Biaya Jasa')
    }
  } else if (type === 'transport') {
    clean = clean.replace(regex, 'Biaya Transportasi')
    if (!clean.toLowerCase().startsWith('biaya') && !clean.toLowerCase().startsWith('transport')) {
      clean = 'Biaya Transportasi ' + clean
    } else if (clean.toLowerCase().startsWith('jasa')) {
      clean = clean.replace(/^Jasa/i, 'Biaya Transportasi')
    }
  }
  return clean
}

const splitCategory = (category) => {
  if (!category) return { part1: '', part2: '' }
  const match = category.match(/(.*?)(No\.\s*\d+|no\.\s*\d+.*)/i)
  if (match) {
    return {
      part1: match[1].trim(),
      part2: match[2].trim()
    }
  }
  return { part1: category, part2: '' }
}

function ReceiptPreview({ data }) {
  if (!data) return null
  const { expense, tech, user, task } = data

  const formatCompactDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const formatRawNumber = (num) => {
    if (num == null || isNaN(num)) return '0'
    return new Intl.NumberFormat('id-ID').format(num)
  }

  // Parse transport amount from description_other
  const parseTransportAmount = (descOther) => {
    if (!descOther) return 0
    const cleanStr = descOther.replace(/[.,\s]/g, '')
    const match = cleanStr.match(/\d+/)
    if (match) {
      return parseInt(match[0], 10) || 0
    }
    return 0
  }

  const transportAmount = parseTransportAmount(expense.description_other)
  const hasSplit = transportAmount > 0 && expense.amount > transportAmount

  const renderSingleVoucher = (title, amt, desc, isCopy = false) => {
    return (
      <div style={{
        background: 'white',
        border: '1px solid #bbb',
        padding: '24px 32px 24px 32px',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto 24px auto',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        color: '#000',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        {/* Fields list */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <tbody>
            <tr>
              <td style={{ width: '140px', fontWeight: 'bold', padding: '6px 0', verticalAlign: 'top' }}>No</td>
              <td style={{ width: '15px', padding: '6px 0', verticalAlign: 'top' }}>:</td>
              <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{expense.document_number}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '6px 0', verticalAlign: 'top' }}>Telah Terima Dari</td>
              <td style={{ padding: '6px 0', verticalAlign: 'top' }}>:</td>
              <td style={{ padding: '6px 0', verticalAlign: 'top' }}>PT Mahaga Pratama</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '6px 0', verticalAlign: 'top' }}>Uang Sejumlah</td>
              <td style={{ padding: '6px 0', verticalAlign: 'top' }}>:</td>
              <td style={{ padding: '6px 0', verticalAlign: 'top', fontWeight: 'bold' }}>
                {terbilangRupiah(isCopy ? amt : expense.amount)}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '6px 0', verticalAlign: 'top' }}>Untuk Pembayaran</td>
              <td style={{ padding: '6px 0', verticalAlign: 'top' }}>:</td>
              <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
                {desc} {task && `— Area ${task.area}`}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Separator Line */}
        <div style={{ borderTop: '1px solid #777', width: '100%', marginBottom: '24px' }} />

        {/* Bottom Section: Amount & Signature */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'end', marginTop: '24px' }}>
          {/* Amount Box */}
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 'bold',
              padding: '6px 0',
              borderTop: '1px solid #000',
              borderBottom: '1px solid #000',
              width: '180px',
              display: 'inline-block'
            }}>
              Rp{formatRawNumber(amt)}
            </div>
          </div>

          {/* Signature name and date */}
          <div style={{ textAlign: 'center', width: '220px', marginLeft: 'auto' }}>
            <div style={{ fontSize: '11px', marginBottom: '16px' }}>
              {formatCompactDate(expense.disbursement_date || expense.request_date)}
            </div>
            <div style={{ borderTop: '1px solid #777', marginBottom: '75px' }} />
            <div style={{ fontWeight: 'bold' }}>
              {expense.technician_name || tech?.name || 'Penerima'}
            </div>
          </div>
        </div>


      </div>
    )
  }

  return (
    <div style={{ background: '#f5f5f5', padding: '24px 0' }}>
      {/* Display KTP if uploaded */}
      {tech?.ktp_image_url && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src={tech.ktp_image_url}
            alt="KTP Teknisi"
            style={{
              maxWidth: '450px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #ddd'
            }}
          />
        </div>
      )}

      {hasSplit ? (
        <>
          {/* Voucher 1: Jasa */}
          {renderSingleVoucher(
            'JASA',
            expense.amount - transportAmount,
            cleanDescriptionForVoucher(expense.description, 'jasa'),
            false
          )}
          {/* Voucher 2: Transport */}
          {renderSingleVoucher(
            'TRANSPORTASI',
            transportAmount,
            cleanDescriptionForVoucher(expense.description, 'transport'),
            true
          )}
        </>
      ) : (
        <>
          {renderSingleVoucher('MAIN', expense.amount, expense.description, false)}
          {renderSingleVoucher('COPY', expense.amount, expense.description, true)}
        </>
      )}
    </div>
  )
}

function CoverPreview({ data }) {
  if (!data) return null
  const { expense, tech, user, task } = data

  const parseTransportAmount = (descOther) => {
    if (!descOther) return 0
    const cleanStr = descOther.replace(/[.,\s]/g, '')
    const match = cleanStr.match(/\d+/)
    if (match) {
      return parseInt(match[0], 10) || 0
    }
    return 0
  }

  const transportAmount = parseTransportAmount(expense.description_other)
  const hasSplit = transportAmount > 0 && expense.amount > transportAmount

  // Extract a numeric representation for "Pengajuan No. XX"
  const cleanSeq = expense.pengajuan_number || parseInt(expense.document_number.split('/').pop(), 10) || '33'

  // Helper to format date as DD/MM/YYYY
  const formatCompactDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  // Format currency without "Rp" prefix for table cell
  const formatRawNumber = (num) => {
    if (num == null || isNaN(num)) return '0'
    return new Intl.NumberFormat('id-ID').format(num)
  }

  return (
    <div style={{
      background: 'white',
      color: '#1a1a1a',
      padding: '16px 24px',
      borderRadius: 'var(--radius-lg)',
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      maxWidth: '1020px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Header Grid: Logo & Title Table */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
        {/* Logo */}
        <img
          src="/logo-mahaga.png"
          alt="Logo Mahaga"
          style={{
            width: '90px',
            height: 'auto',
            maxHeight: '72px',
            objectFit: 'contain',
            flexShrink: 0
          }}
        />

        {/* Title Block */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #111' }}>
            <tbody>
              <tr>
                <td style={{
                  background: '#e0e0e0',
                  border: '1px solid #111',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  padding: '4px',
                  letterSpacing: '0.5px'
                }}>
                  NON-TRAVEL EXPENSE REPORT - MAHAGA PRATAMA
                </td>
              </tr>
              <tr>
                <td style={{
                  border: '1px solid #111',
                  textAlign: 'center',
                  fontSize: '11px',
                  padding: '2px'
                }}>
                  Other
                </td>
              </tr>
              <tr>
                <td style={{
                  border: '1px solid #111',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontSize: '11px',
                  padding: '2px'
                }}>
                  No. CARF : {expense.document_number}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
        {/* Left Info Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #111' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #111', padding: '4px 8px', width: '70px' }}>Nama</td>
              <td style={{ border: '1px solid #111', padding: '4px 8px', fontWeight: 'bold' }}>: {expense.requestor_name || user?.name || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #111', padding: '4px 8px' }}>Dept</td>
              <td style={{ border: '1px solid #111', padding: '4px 8px', fontWeight: 'bold' }}>: Mahaga</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #111', padding: '4px 8px' }}>Tanggal</td>
              <td style={{ border: '1px solid #111', padding: '4px 8px', fontWeight: 'bold' }}>: {formatCompactDate(expense.request_date)}</td>
            </tr>
          </tbody>
        </table>

        {/* Center Pengajuan Number */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '8px'
        }}>
          Pengajuan No. {cleanSeq}
        </div>

        {/* Right Admin Verification Box */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #111' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #111', padding: '4px 8px', width: '100px' }}>Tanggal Diterima</td>
              <td style={{ border: '1px solid #111', padding: '4px 8px', width: '15px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #111', padding: '4px 8px' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #111', padding: '4px 8px' }}>Paraf</td>
              <td style={{ border: '1px solid #111', padding: '4px 8px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #111', padding: '4px 8px', color: 'red', textAlign: 'right', fontWeight: 'bold', fontSize: '9px' }}>
                (Diisi oleh Admin)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Realisasi Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #111', marginBottom: '12px' }}>
        <thead>
          <tr style={{ background: '#e0e0e0', fontWeight: 'bold' }}>
            <th style={{ border: '1px solid #111', width: '40px', padding: '6px', textAlign: 'center' }}>No</th>
            <th style={{ border: '1px solid #111', width: '100px', padding: '6px', textAlign: 'center' }}>Tanggal</th>
            <th style={{ border: '1px solid #111', padding: '6px', textAlign: 'center' }}>Uraian</th>
            <th style={{ border: '1px solid #111', width: '150px', padding: '6px', textAlign: 'center' }}>Jumlah</th>
            <th style={{ border: '1px solid #111', width: '180px', padding: '6px', textAlign: 'center' }}>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {hasSplit ? (
            <>
              <tr>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center', height: '40px' }}>1</td>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>{formatCompactDate(expense.request_date)}</td>
                <td style={{ border: '1px solid #111', padding: '8px' }}>{cleanDescriptionForVoucher(expense.description, 'jasa')}</td>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>
                  {formatRawNumber(expense.amount - transportAmount)}
                </td>
                <td style={{ border: '1px solid #111', padding: '8px' }}>{splitCategory(expense.expense_category).part1}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center', height: '40px' }}>2</td>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>{formatCompactDate(expense.request_date)}</td>
                <td style={{ border: '1px solid #111', padding: '8px' }}>{cleanDescriptionForVoucher(expense.description, 'transport')}</td>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>
                  {formatRawNumber(transportAmount)}
                </td>
                <td style={{ border: '1px solid #111', padding: '8px' }}>{splitCategory(expense.expense_category).part2}</td>
              </tr>
            </>
          ) : (
            <>
              <tr>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center', height: '40px' }}>1</td>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>{formatCompactDate(expense.request_date)}</td>
                <td style={{ border: '1px solid #111', padding: '8px' }}>{expense.description}</td>
                <td style={{ border: '1px solid #111', padding: '8px', textAlign: 'center' }}>
                  {formatRawNumber(expense.amount)}
                </td>
                <td style={{ border: '1px solid #111', padding: '8px' }}>{expense.expense_category || ''}</td>
              </tr>
              {/* Dummy Empty Row */}
              <tr>
                <td style={{ border: '1px solid #111', padding: '8px', height: '32px' }}></td>
                <td style={{ border: '1px solid #111', padding: '8px' }}></td>
                <td style={{ border: '1px solid #111', padding: '8px' }}></td>
                <td style={{ border: '1px solid #111', padding: '8px' }}></td>
                <td style={{ border: '1px solid #111', padding: '8px' }}></td>
              </tr>
            </>
          )}
          {/* Spanned Realisasi Row */}
          <tr>
            <td colSpan={3} style={{
              border: '1px solid #111',
              padding: '6px',
              textAlign: 'center',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              REALISASI
            </td>
            <td colSpan={2} style={{ border: '1px solid #111', padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold', width: '150px', borderRight: '1px solid #111' }}>Advance Taken</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      Rp{formatRawNumber(expense.amount)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold', width: '150px', borderRight: '1px solid #111' }}>Total Expense</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      Rp{formatRawNumber(expense.amount)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold', width: '150px', borderRight: '1px solid #111' }}>Balance / Retur / (Add)</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>Rp0</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Approval Section Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #111', marginBottom: '12px', textAlign: 'center' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', fontSize: '10px' }}>
            <th style={{ border: '1px solid #111', padding: '4px', width: '16.6%' }}>Dibuat oleh,<br />User</th>
            <th style={{ border: '1px solid #111', padding: '4px', width: '16.6%' }}>Disetujui oleh,<br />Atasan Langsung</th>
            <th style={{ border: '1px solid #111', padding: '4px', width: '16.6%' }}>Diperiksa oleh,<br />Budget Admin</th>
            <th style={{ border: '1px solid #111', padding: '4px', width: '16.6%' }}>Diperiksa oleh,<br />Kepala Divisi & Budget Holder</th>
            <th style={{ border: '1px solid #111', padding: '4px', width: '16.6%' }}>Disetujui oleh,<br />Direktur*</th>
            <th style={{ border: '1px solid #111', padding: '4px', width: '16.6%' }}>Disetujui oleh,<br />Direktur**</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #111', height: '48px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
              <div style={{ fontStyle: 'italic' }}>{expense.technician_name || tech?.name || '________________'}</div>
            </td>
            <td style={{ border: '1px solid #111', height: '48px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
              <div style={{ fontStyle: 'italic' }}>Ardi Ahmad Syauki</div>
            </td>
            <td style={{ border: '1px solid #111', height: '48px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
              <div style={{ fontStyle: 'italic', color: '#888' }}></div>
            </td>
            <td style={{ border: '1px solid #111', height: '48px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
              <div style={{ fontStyle: 'italic' }}>Adi Wibowo</div>
            </td>
            <td style={{ border: '1px solid #111', height: '48px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
              <div style={{ fontStyle: 'italic', color: '#888' }}></div>
            </td>
            <td style={{ border: '1px solid #111', height: '48px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
              <div style={{ fontStyle: 'italic', color: '#888' }}></div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer Details: Transfer to, Return to, Distribusi Cost */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '16px', marginBottom: '8px' }}>
        {/* Transfer To */}
        <div style={{ border: '1px solid #111', boxSizing: 'border-box' }}>
          <div style={{ borderBottom: '1px solid #111', padding: '4px', fontWeight: 'bold', textAlign: 'center', background: '#f5f5f5' }}>
            Transfer To
          </div>
          <div style={{ padding: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', padding: '2px 0' }}>Nama</td>
                  <td style={{ padding: '2px 0' }}>: {tech?.bank_account_owner_name || ''}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0' }}>No. Rek</td>
                  <td style={{ padding: '2px 0', fontFamily: 'monospace' }}>: {tech?.bank_account_number || ''}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0' }}>Bank</td>
                  <td style={{ padding: '2px 0' }}>: {tech?.bank_name || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Retur to Company */}
        <div style={{ border: '1px solid #111', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #111', padding: '4px', fontWeight: 'bold', background: '#f5f5f5' }}>
            Retur to Company paid to :
          </div>
          <div style={{ padding: '12px 8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', margin: '4px 0' }}>MANDIRI 124 000 519 6192</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>PT MAHAGA PRATAMA</div>
          </div>
        </div>

        {/* Distribusi Cost */}
        <div style={{ border: '1px solid #111', boxSizing: 'border-box' }}>
          <div style={{ borderBottom: '1px solid #111', padding: '4px', fontWeight: 'bold', textAlign: 'center', background: '#f5f5f5' }}>
            Distribusi Cost
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '3px 6px', width: '80px', fontWeight: 'bold', background: '#f5f5f5', borderRight: '1px solid #111' }}>Budget Dept</td>
                <td style={{ padding: '3px 6px' }}>:</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '3px 6px', fontWeight: 'bold', background: '#f5f5f5', borderRight: '1px solid #111' }}>License</td>
                <td style={{ padding: '3px 6px' }}>:</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '3px 6px', fontWeight: 'bold', background: '#f5f5f5', borderRight: '1px solid #111' }}>Product</td>
                <td style={{ padding: '3px 6px' }}>:</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 6px', fontWeight: 'bold', background: '#f5f5f5', borderRight: '1px solid #111' }}>Project</td>
                <td style={{ padding: '3px 6px' }}>:</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bullet Notes (Blue Text) */}
      <div style={{ color: '#1e3a8a', fontSize: '9px', lineHeight: '1.3', paddingLeft: '4px' }}>
        <div>* Jika Total Expense di Atas 5 juta harus mendapat approval Kepala Divisi dan Direktur terkait</div>
        <div>Untuk Bukti bayar harus dalam bentukan nota resmi dengan logo dan stempel, bila tidak harus ada approval budget holder atau atasan langsung</div>
        <div>Setelah mengembalikan uang retur ke rekening PSN wajib menginformasikan ke accounting melalui email</div>
      </div>
    </div>
  )
}

