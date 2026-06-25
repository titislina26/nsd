import { useState, useMemo, useCallback } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, ArrowRight, ArrowLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import useAppStore from '@/store/useAppStore'
import { parseFile, autoMapColumns, CARF_SCHEMA_FIELDS } from '@/lib/csv-parser'
import { isValidAmount, isValidDate, formatRupiah, nameSimilarity } from '@/lib/utils'

const STEPS = [
  { label: 'Upload File', icon: Upload },
  { label: 'Mapping Kolom', icon: FileSpreadsheet },
  { label: 'Preview & Validasi', icon: CheckCircle },
]

export default function ImportPage() {
  const { bulkInsertExpenses, technicians, addToast } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skippedRows, setSkippedRows] = useState(new Set())

  // ── Step 1: File Upload ──
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return
    const ext = selectedFile.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      addToast({ title: 'Format file tidak didukung', message: 'Gunakan .csv, .xlsx, atau .xls', variant: 'danger' })
      return
    }

    setLoading(true)
    setFile(selectedFile)
    try {
      const result = await parseFile(selectedFile)
      setParsedData(result)

      // Auto-map columns
      const autoMap = autoMapColumns(result.headers, CARF_SCHEMA_FIELDS)
      setColumnMapping(autoMap)

      // Check if all required fields are mapped
      const requiredFields = CARF_SCHEMA_FIELDS.filter(f => f.required).map(f => f.key)
      const mappedFields = Object.values(autoMap)
      const allMapped = requiredFields.every(f => mappedFields.includes(f))

      setCurrentStep(allMapped ? 2 : 1)
    } catch (err) {
      addToast({ title: 'Gagal parse file', message: err.message, variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    handleFileSelect(droppedFile)
  }, [handleFileSelect])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => setDragActive(false)

  // ── Step 2: Column Mapping ──
  const handleMappingChange = (sourceHeader, targetKey) => {
    setColumnMapping(prev => {
      const updated = { ...prev }
      if (targetKey === '') {
        delete updated[sourceHeader]
      } else {
        // Remove existing mapping to this target
        Object.keys(updated).forEach(k => {
          if (updated[k] === targetKey) delete updated[k]
        })
        updated[sourceHeader] = targetKey
      }
      return updated
    })
  }

  const canProceedFromMapping = useMemo(() => {
    const requiredFields = CARF_SCHEMA_FIELDS.filter(f => f.required).map(f => f.key)
    const mappedFields = Object.values(columnMapping)
    return requiredFields.every(f => mappedFields.includes(f))
  }, [columnMapping])

  // ── Step 3: Preview & Validation ──
  const mappedData = useMemo(() => {
    if (!parsedData || !columnMapping) return []

    const reverseMap = {}
    Object.entries(columnMapping).forEach(([source, target]) => {
      reverseMap[target] = source
    })

    return parsedData.data.map((row, idx) => {
      const mapped = { __rowIndex: row.__rowIndex || idx + 1 }
      CARF_SCHEMA_FIELDS.forEach(field => {
        const sourceHeader = reverseMap[field.key]
        mapped[field.key] = sourceHeader ? row[sourceHeader] : ''
      })

      // Validate
      const errors = []
      if (!mapped.document_number) errors.push('No. Dokumen kosong')
      if (!mapped.description) errors.push('Deskripsi kosong')
      if (!isValidAmount(mapped.amount)) errors.push('Nominal tidak valid')
      if (mapped.request_date && !isValidDate(mapped.request_date)) errors.push('Tanggal tidak valid')
      if (mapped.technician_name) {
        const searchName = mapped.technician_name.toLowerCase().trim()
        let found = technicians.find(t => t.name.toLowerCase().trim() === searchName)
        if (!found) {
          let bestMatch = null
          let bestScore = 0
          for (const t of technicians) {
            const score = nameSimilarity(t.name, searchName)
            if (score > bestScore) {
              bestScore = score
              bestMatch = t
            }
          }
          if (bestScore >= 0.7 && bestMatch) {
            found = bestMatch
          }
        }
        if (found) {
          mapped.__technician_id = found.id
        }
      }

      mapped.__errors = errors
      mapped.__isValid = errors.length === 0

      return mapped
    })
  }, [parsedData, columnMapping, technicians])

  const validCount = mappedData.filter((r, i) => r.__isValid && !skippedRows.has(i)).length
  const errorCount = mappedData.filter((r, i) => !r.__isValid && !skippedRows.has(i)).length
  const totalActive = mappedData.length - skippedRows.size

  const canCommit = mappedData.length > 0 && errorCount === 0 && validCount > 0

  const handleCommit = () => {
    const toImport = mappedData
      .filter((r, i) => r.__isValid && !skippedRows.has(i))
      .map(r => ({
        document_number: r.document_number,
        pengajuan_number: r.pengajuan_number || '',
        request_date: r.request_date || new Date().toISOString().split('T')[0],
        technician_id: r.__technician_id || '',
        technician_name: r.technician_name || '',
        requestor_id: '',
        requestor_name: r.requestor_name || '',
        expense_category: r.expense_category || 'Lain-lain',
        description: r.description,
        description_other: r.description_other || '',
        amount: parseFloat(String(r.amount).replace(/[.,\s]/g, '')) || 0,
        area: r.area || '',
        task_id: '',
      }))

    bulkInsertExpenses(toImport)
    addToast({
      title: `${toImport.length} data berhasil di-import`,
      message: 'Data telah ditambahkan ke tabel CARF',
      variant: 'success',
    })

    // Reset
    setFile(null)
    setParsedData(null)
    setColumnMapping({})
    setSkippedRows(new Set())
    setCurrentStep(0)
  }

  const handleReset = () => {
    setFile(null)
    setParsedData(null)
    setColumnMapping({})
    setSkippedRows(new Set())
    setCurrentStep(0)
  }

  const downloadTemplate = () => {
    const headers = ['TANGGAL PERMINTAAN', 'No Dokumen', 'No Pengajuan', 'USER', 'REQUESTOR', 'KETERANGAN', 'DESKRIPSI KEBUTUHAN', 'DESKRIPSI DANA OTHER', 'TOTAL PENGAJUAN']
    const sampleData = [
      [new Date('2025-10-10'), '1861/MAHAGA/VII-2025', 46, 'Mulyadi', 'AHMAD JAUHARI AFIF', 'Transportasi', 'Biaya Kunjungan Kedua transportasi Instalasi ubiqu 1 lokasi Sulawesi Selatan', 'Transport : Rp 1.000.000', 1000000],
      [new Date('2025-09-05'), '1861/MAHAGA/VII-2025', 12, 'Sergio Santhibhanez', 'MUHAMMAD FAUZAN AZIMI', 'Migrasi', 'Biaya Jasa dan transportasi Migrasi 4 lokasi Kalimantan Utara', "Biaya Jasa : Rp 750.000 (Wilayah E)\nBiaya Transportasi :\nRp 1.750.000 (No. 15)\nTotal/site : Rp 2.500.000/site\n\nTotal 4 Site =\nRp10.000.000", 10000000]
    ]
    
    // Create worksheet with cellDates option to format Date objects as Excel Date type
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData], { cellDates: true })
    
    // Set explicit date format for column A (A2, A3, etc.)
    for (let i = 2; i <= sampleData.length + 1; i++) {
      const cellRef = `A${i}`
      if (worksheet[cellRef]) {
        worksheet[cellRef].z = 'yyyy-mm-dd'
      }
    }
    
    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template CARF')
    
    // Write and download
    XLSX.writeFile(workbook, 'template_import_carf.xlsx')
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Import Data CARF</h1>
          <p className="page__subtitle">Upload file CSV atau Excel untuk import data pengeluaran</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button className="btn btn--outline" onClick={downloadTemplate}>
            <FileSpreadsheet size={16} />
            Unduh Template
          </button>
          {file && (
            <button className="btn btn--ghost" onClick={handleReset}>
              <X size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="steps">
        {STEPS.map((step, idx) => (
          <div key={idx} style={{ display: 'contents' }}>
            <div className={`step ${idx === currentStep ? 'step--active' : ''} ${idx < currentStep ? 'step--completed' : ''}`}>
              <div className="step__number">
                {idx < currentStep ? <CheckCircle size={16} /> : idx + 1}
              </div>
              <span className="step__label">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className="step__connector" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <div
          className={`dropzone ${dragActive ? 'dropzone--active' : ''} ${file ? 'dropzone--loaded' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => handleFileSelect(e.target.files?.[0])}
          />
          {loading ? (
            <>
              <div className="skeleton skeleton--avatar" style={{ width: 48, height: 48 }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>Memproses file...</p>
            </>
          ) : file ? (
            <>
              <FileSpreadsheet size={48} className="dropzone__icon" />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-success)' }}>{file.name}</p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload size={48} className="dropzone__icon" />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Drag & drop file di sini
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                  atau klik untuk pilih file · CSV, XLSX, XLS
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {currentStep === 1 && parsedData && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Mapping Kolom</h3>
          <p className="text-sm text-secondary mb-4">
            Cocokkan kolom dari file Anda dengan field database
          </p>

          <table className="data-table" style={{ marginBottom: 'var(--spacing-6)' }}>
            <thead>
              <tr>
                <th>Kolom File</th>
                <th>Contoh Data</th>
                <th>→ Target Field</th>
              </tr>
            </thead>
            <tbody>
              {parsedData.headers.map(header => (
                <tr key={header}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{header}</td>
                  <td style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace' }}>
                    {parsedData.data[0]?.[header] || '-'}
                  </td>
                  <td>
                    <select
                      className="input select"
                      value={columnMapping[header] || ''}
                      onChange={e => handleMappingChange(header, e.target.value)}
                      style={{ maxWidth: 240 }}
                    >
                      <option value="">— Lewati —</option>
                      {CARF_SCHEMA_FIELDS.map(field => (
                        <option key={field.key} value={field.key}>
                          {field.label} {field.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!canProceedFromMapping && (
            <div className="alert alert--warning mb-4">
              <AlertTriangle size={16} />
              <span>Semua field wajib (*) harus dipetakan sebelum lanjut.</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn--ghost" onClick={() => setCurrentStep(0)}>
              <ArrowLeft size={16} />
              Kembali
            </button>
            <button
              className="btn btn--primary"
              disabled={!canProceedFromMapping}
              onClick={() => setCurrentStep(2)}
            >
              Lanjut ke Preview
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <div>
              <h3>Preview Data</h3>
              <p className="text-sm text-secondary mt-2">
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{validCount} valid</span>
                {errorCount > 0 && (
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}> · {errorCount} bermasalah</span>
                )}
                {skippedRows.size > 0 && (
                  <span style={{ color: 'var(--color-text-tertiary)' }}> · {skippedRows.size} dilewati</span>
                )}
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: 500 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th style={{ width: 50 }}>Skip</th>
                  <th>No. Dokumen</th>
                  <th>No. Pengajuan</th>
                  <th>Tanggal Permintaan</th>
                  <th>Teknisi</th>
                  <th>Keterangan</th>
                  <th>Deskripsi Kebutuhan</th>
                  <th>Deskripsi Dana Other</th>
                  <th style={{ textAlign: 'right' }}>Nominal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mappedData.map((row, idx) => {
                  const isSkipped = skippedRows.has(idx)
                  const rowStyle = isSkipped
                    ? { opacity: 0.4 }
                    : !row.__isValid
                      ? { background: 'rgba(239, 68, 68, 0.06)' }
                      : {}

                  return (
                    <tr key={idx} style={rowStyle}>
                      <td style={{ color: 'var(--color-text-tertiary)' }}>{row.__rowIndex}</td>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={isSkipped}
                          onChange={() => {
                            setSkippedRows(prev => {
                              const next = new Set(prev)
                              next.has(idx) ? next.delete(idx) : next.add(idx)
                              return next
                            })
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.document_number || '-'}</td>
                      <td>{row.pengajuan_number || '-'}</td>
                      <td>{row.request_date || '-'}</td>
                      <td>{row.technician_name || '-'}</td>
                      <td>{row.expense_category || '-'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.description || '-'}
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.description_other || '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                        {isValidAmount(row.amount)
                          ? formatRupiah(parseFloat(String(row.amount).replace(/[.,\s]/g, '')))
                          : <span style={{ color: 'var(--color-danger)' }}>{row.amount || '-'}</span>
                        }
                      </td>
                      <td>
                        {isSkipped ? (
                          <span className="badge badge--neutral">Dilewati</span>
                        ) : row.__isValid ? (
                          <span className="badge badge--success">
                            <CheckCircle size={10} />
                            Valid
                          </span>
                        ) : (
                          <div className="tooltip">
                            <span className="badge badge--danger">
                              <AlertTriangle size={10} />
                              Error
                            </span>
                            <div className="tooltip__content" style={{ whiteSpace: 'normal', minWidth: 200 }}>
                              {row.__errors.join('; ')}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-6)' }}>
            <button className="btn btn--ghost" onClick={() => setCurrentStep(1)}>
              <ArrowLeft size={16} />
              Ubah Mapping
            </button>
            <button
              className="btn btn--primary btn--lg"
              disabled={!canCommit}
              onClick={handleCommit}
            >
              <CheckCircle size={18} />
              Commit Import ({validCount} data)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
