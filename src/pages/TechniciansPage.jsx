import { useState, useMemo } from 'react'
import {
  Search, Plus, Shield, ShieldAlert, ShieldCheck, ShieldX,
  X, Eye, ZoomIn, ZoomOut, Trash2,
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { getVerificationStatusVariant, nameSimilarity } from '@/lib/utils'
import { performKtpOcr } from '@/lib/ocr'
import * as XLSX from 'xlsx'

export default function TechniciansPage() {
  const { technicians, updateTechnician, updateVerificationStatus, addTechnician, deleteTechnician, uploadKtp, addToast, isLoading } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTech, setSelectedTech] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkFiles, setBulkFiles] = useState([])

  const stats = useMemo(() => ({
    total: technicians.length,
    verified: technicians.filter(t => t.verification_status === 'VERIFIED').length,
    unverified: technicians.filter(t => t.verification_status === 'UNVERIFIED').length,
    rejected: technicians.filter(t => t.verification_status === 'REJECTED').length,
  }), [technicians])

  const filtered = useMemo(() => {
    const list = technicians.filter(t => {
      const matchesSearch = !searchQuery || [t.name, t.ktp_number]
        .some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus = statusFilter === 'ALL' || t.verification_status === statusFilter
      return matchesSearch && matchesStatus
    })
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'id'))
  }, [technicians, searchQuery, statusFilter])

  const findMatchingTechnician = (filename, ocrResult, allTechs) => {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename
    const cleanFilename = nameWithoutExt.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
    
    // 1. Try filename matching NIK
    let match = allTechs.find(t => t.ktp_number && t.ktp_number.trim() === cleanFilename)
    if (match) return match

    // 2. Try filename matching Name (exact after cleaning)
    for (const tech of allTechs) {
      const cleanTechName = tech.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
      if (cleanTechName === cleanFilename) return tech
    }

    // 3. Try OCR NIK match
    if (ocrResult?.nik) {
      match = allTechs.find(t => t.ktp_number && t.ktp_number.trim() === ocrResult.nik.trim())
      if (match) return match
    }

    // 4. Try OCR Name match
    if (ocrResult?.name) {
      const cleanOcrName = ocrResult.name.toLowerCase().trim()
      let bestMatch = null
      let bestScore = 0
      for (const tech of allTechs) {
        const score = nameSimilarity(tech.name, cleanOcrName)
        if (score > bestScore) {
          bestScore = score
          bestMatch = tech
        }
      }
      if (bestScore >= 0.8 && bestMatch) {
        return bestMatch
      }
    }

    return null
  }

  const handleBulkKtpUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const initialFiles = selectedFiles.map(file => ({
      name: file.name,
      file,
      status: 'WAITING',
      matchedName: '',
      error: ''
    }))

    setBulkFiles(initialFiles)
    setShowBulkDialog(true)
    e.target.value = ''

    for (let i = 0; i < initialFiles.length; i++) {
      setBulkFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'SCANNING' } : f))
      const item = initialFiles[i]
      try {
        let match = findMatchingTechnician(item.name, null, technicians)
        
        let ocrResult = null
        if (!match) {
          ocrResult = await performKtpOcr(item.file)
          match = findMatchingTechnician(item.name, ocrResult, technicians)
        }

        if (match) {
          await uploadKtp(match.id, item.file)
          setBulkFiles(prev => prev.map((f, idx) => idx === i ? { 
            ...f, 
            status: 'SUCCESS', 
            matchedName: match.name 
          } : f))
        } else {
          setBulkFiles(prev => prev.map((f, idx) => idx === i ? { 
            ...f, 
            status: 'FAILED', 
            error: 'Tidak ditemukan teknisi dengan nama/NIK ini' 
          } : f))
        }
      } catch (err) {
        setBulkFiles(prev => prev.map((f, idx) => idx === i ? { 
          ...f, 
          status: 'FAILED', 
          error: err.message || 'Gagal memproses file' 
        } : f))
      }
    }
  }

  const downloadTechTemplate = () => {
    const headers = ['Nama', 'NIK']
    const sampleData = [
      ['Yusup Ubaidillah', '3201234567890001'],
      ['Ahmad Fauzan', '3201234567890002']
    ]
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Teknisi')
    XLSX.writeFile(workbook, 'template_daftar_teknisi.xlsx')
  }

  const handleTechImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        
        if (jsonData.length === 0) {
          addToast({ title: 'File kosong atau tidak valid', variant: 'danger' })
          return
        }

        let importedCount = 0
        let skippedCount = 0
        const uniqueNamesInImport = new Set()

        for (const row of jsonData) {
          const name = row['Nama'] || row['nama'] || row['NAMA']
          const nik = row['NIK'] || row['nik'] || row['Nik']
          
          if (name) {
            const trimmedName = String(name).trim()
            const lowerName = trimmedName.toLowerCase()

            // Check if name already exists in database
            const existsInDb = technicians.some(t => t.name.toLowerCase().trim() === lowerName)
            // Check if name is already processed in this import sheet session
            const existsInSheet = uniqueNamesInImport.has(lowerName)

            if (existsInDb || existsInSheet) {
              skippedCount++
              continue
            }

            uniqueNamesInImport.add(lowerName)

            await addTechnician({
              name: trimmedName,
              ktp_number: nik ? String(nik).trim() : '',
              bank_name: 'BCA',
              bank_account_number: '-',
              bank_account_owner_name: trimmedName,
              ktp_image_url: null,
              is_third_party_account: 0,
              third_party_relation: null,
              notes: null,
            })
            importedCount++
          }
        }

        const skipMessage = skippedCount > 0 ? `, ${skippedCount} nama dilewati karena sudah ada` : ''
        addToast({ 
          title: 'Import Sukses', 
          message: `${importedCount} teknisi berhasil ditambahkan${skipMessage}`, 
          variant: 'success' 
        })
      } catch (err) {
        addToast({ title: 'Gagal Import', message: err.message, variant: 'danger' })
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Manajemen Teknisi</h1>
          <p className="page__subtitle">Kelola nama dan verifikasi foto KTP teknisi</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button className="btn btn--outline" onClick={downloadTechTemplate}>
            📄 Template Daftar
          </button>
          <label className="btn btn--outline" style={{ cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span>📥 Import Daftar</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleTechImport}
            />
          </label>
          <label className="btn btn--outline" style={{ cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span>📷 Upload Massal KTP</span>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBulkKtpUpload}
            />
          </label>
          <button className="btn btn--primary" onClick={() => setShowAddDialog(true)}>
            <Plus size={16} />
            Tambah Teknisi
          </button>
        </div>
      </div>

      {/* Stats Mini Cards */}
      <div className="grid grid--4" style={{ marginBottom: 'var(--spacing-6)' }}>
        {[
          { label: 'Total Teknisi', value: stats.total, icon: Shield, variant: 'primary' },
          { label: 'Verified', value: stats.verified, icon: ShieldCheck, variant: 'success' },
          { label: 'Unverified', value: stats.unverified, icon: ShieldAlert, variant: 'warning' },
          { label: 'Rejected', value: stats.rejected, icon: ShieldX, variant: 'danger' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
              <div className={`kpi-card__icon-wrapper kpi-card__icon-wrapper--${stat.variant}`} style={{ width: 40, height: 40 }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{stat.label}</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{stat.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-toolbar__filters">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input
                className="input"
                placeholder="Cari nama, NIK..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32, width: 220 }}
              />
            </div>
            <select className="input select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
              <option value="ALL">Semua Status</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Teknisi</th>
                <th>NIK</th>
                <th>Foto KTP</th>
                <th>Status</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="data-table__empty">Tidak ada data ditemukan</td></tr>
              ) : (
                filtered.map(tech => (
                  <tr key={tech.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTech(tech)}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{tech.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>{tech.ktp_number || '-'}</td>
                    <td>
                      {tech.ktp_image_url ? (
                        <span className="badge badge--success">Ada Foto KTP</span>
                      ) : (
                        <span className="badge badge--neutral">Belum Ada</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--${getVerificationStatusVariant(tech.verification_status)}`}>
                        <span className="badge__dot" />
                        {tech.verification_status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                      <button
                        className="btn btn--ghost btn--icon"
                        onClick={e => { e.stopPropagation(); setSelectedTech(tech) }}
                        title="Lihat Detail"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn--ghost btn--icon"
                        onClick={e => { 
                          e.stopPropagation(); 
                          if (window.confirm(`Apakah Anda yakin ingin menghapus teknisi ${tech.name}?`)) {
                            deleteTechnician(tech.id)
                            addToast({ title: 'Teknisi berhasil dihapus', variant: 'danger' })
                          }
                        }}
                        title="Hapus"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify Drawer */}
      {selectedTech && (
        <VerifyDrawer
          technician={selectedTech}
          onClose={() => setSelectedTech(null)}
        />
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <AddTechnicianDialog onClose={() => setShowAddDialog(false)} />
      )}

      {/* Bulk Upload Dialog */}
      {showBulkDialog && (
        <BulkUploadDialog onClose={() => setShowBulkDialog(false)} files={bulkFiles} />
      )}
    </div>
  )
}

function VerifyDrawer({ technician, onClose }) {
  const { updateTechnician, updateVerificationStatus, uploadKtp, addToast } = useAppStore()
  const [name, setName] = useState(technician.name)
  const [ktpNumber, setKtpNumber] = useState(technician.ktp_number || '')
  const [zoom, setZoom] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveAndVerify = async () => {
    setIsSaving(true)
    try {
      await updateTechnician(technician.id, {
        name,
        ktp_number: ktpNumber,
      })
      await updateVerificationStatus(technician.id, 'VERIFIED', 'Diverifikasi oleh admin')
      addToast({ title: `${name} berhasil disimpan & diverifikasi`, variant: 'success' })
      onClose()
    } catch (error) {
      // handled
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    try {
      await uploadKtp(technician.id, file)
      addToast({ title: 'KTP berhasil diunggah', variant: 'success' })
    } catch (error) {
      addToast({ title: 'Gagal mengunggah KTP', description: error.message, variant: 'danger' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReject = async () => {
    try {
      await updateVerificationStatus(technician.id, 'REJECTED', 'Ditolak oleh admin')
      addToast({ title: `${name} ditolak`, variant: 'danger' })
      onClose()
    } catch (error) {
      // handled
    }
  }

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet__header">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>
            Detail Profil & KTP — {name}
          </h2>
          <button className="dialog__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sheet__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', minHeight: 400 }}>
            {/* Left: KTP Preview */}
            <div>
              <h4 style={{ marginBottom: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                Pratinjau KTP
              </h4>
              <div style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 280,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {technician.ktp_image_url ? (
                  <div style={{
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.2s ease',
                    transformOrigin: 'center',
                    maxWidth: '100%',
                  }}>
                    {technician.ktp_image_url.endsWith('.pdf') ? (
                      <div style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                        <a href={technician.ktp_image_url} target="_blank" rel="noreferrer" className="btn btn--secondary">
                          Buka Dokumen PDF KTP
                        </a>
                      </div>
                    ) : (
                      <img
                        src={technician.ktp_image_url}
                        alt="KTP Teknisi"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 220,
                          objectFit: 'contain',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    maxWidth: 320,
                    background: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    border: '2px solid var(--color-border)',
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.2s ease',
                    transformOrigin: 'center',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
                          REPUBLIK INDONESIA
                        </div>
                        <div style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 600 }}>
                          KARTU TANDA PENDUDUK
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 70,
                        height: 90,
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        color: '#64748b',
                      }}>
                        BELUM ADA
                      </div>
                      <div style={{ flex: 1, fontSize: 9 }}>
                        <div style={{ color: '#94a3b8' }}>NIK</div>
                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontFamily: 'monospace', marginBottom: 4 }}>
                          {ktpNumber || '—'}
                        </div>
                        <div style={{ color: '#94a3b8' }}>Nama</div>
                        <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 4, fontSize: 11 }}>
                          {name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zoom Controls */}
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  display: 'flex',
                  gap: 4,
                }}>
                  <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
                    <ZoomOut size={14} />
                  </button>
                  <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Upload Input */}
              <div style={{ marginTop: 'var(--spacing-3)' }}>
                <label className="btn btn--secondary btn--sm" style={{ cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={isUploading}
                  />
                  {isUploading ? 'Mengunggah...' : (technician.ktp_image_url ? 'Ganti Foto KTP' : 'Unggah Foto KTP')}
                </label>
              </div>
            </div>

            {/* Right: Info Form */}
            <div>
              <h4 style={{ marginBottom: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                Informasi Teknisi
              </h4>

              <div className="form-group">
                <label className="label">Nama Teknisi (Sesuai KTP) *</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="label">NIK / No. KTP</label>
                <input className="input" maxLength={16} value={ktpNumber} onChange={e => setKtpNumber(e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>

              <div className="form-group">
                <label className="label">Status Verifikasi</label>
                <div>
                  <span className={`badge badge--${getVerificationStatusVariant(technician.verification_status)}`}>
                    <span className="badge__dot" />
                    {technician.verification_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sheet__footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={isSaving}>Batal</button>
          <button className="btn btn--danger" onClick={handleReject} disabled={isSaving}>
            <ShieldX size={16} />
            Reject
          </button>
          <button className="btn btn--success" onClick={handleSaveAndVerify} disabled={isSaving || !name}>
            <ShieldCheck size={16} />
            {isSaving ? 'Menyimpan...' : 'Simpan & Verifikasi'}
          </button>
        </div>
      </div>
    </>
  )
}

function AddTechnicianDialog({ onClose }) {
  const { addTechnician, uploadKtp, addToast } = useAppStore()
  const [form, setForm] = useState({
    name: '',
    ktp_number: '',
  })
  const [ktpFile, setKtpFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setKtpFile(null)
      return
    }
    setKtpFile(file)

    if (file.type.startsWith('image/')) {
      setIsScanning(true)
      setScanProgress(0)
      try {
        const result = await performKtpOcr(file, progress => {
          setScanProgress(progress)
        })
        
        let updatedForm = { ...form }
        let messages = []
        if (result.name) {
          updatedForm.name = result.name
          messages.push('Nama')
        }
        if (result.nik) {
          updatedForm.ktp_number = result.nik
          messages.push('NIK')
        }
        setForm(updatedForm)

        if (messages.length > 0) {
          addToast({ 
            title: 'Scan KTP Berhasil', 
            message: `${messages.join(' & ')} diisi otomatis dari foto KTP. Silakan periksa kembali ketepatannya.`, 
            variant: 'success' 
          })
        } else {
          addToast({ 
            title: 'Scan KTP Selesai', 
            message: 'Tidak dapat mendeteksi Nama atau NIK secara otomatis. Silakan isi manual.', 
            variant: 'warning' 
          })
        }
      } catch (err) {
        addToast({ 
          title: 'Gagal Scan KTP', 
          message: 'Terjadi kesalahan saat memproses gambar KTP.', 
          variant: 'danger' 
        })
      } finally {
        setIsScanning(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) {
      addToast({ title: 'Nama wajib diisi', variant: 'danger' })
      return
    }
    setIsSaving(true)
    try {
      const newTech = await addTechnician({
        ...form,
        bank_name: 'BCA',
        bank_account_number: '-',
        bank_account_owner_name: form.name,
        ktp_image_url: null,
        is_third_party_account: 0,
        third_party_relation: null,
        notes: null,
      })

      if (ktpFile) {
        await uploadKtp(newTech.id, ktpFile)
      }

      addToast({ title: 'Teknisi berhasil ditambahkan', variant: 'success' })
      onClose()
    } catch (err) {
      // Error handled by store
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog__header">
          <h2 className="dialog__title">Tambah Teknisi</h2>
          <button className="dialog__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Nama (Sesuai KTP) *</label>
            <input 
              className="input" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              required 
              disabled={isScanning}
            />
          </div>
          <div className="form-group">
            <label className="label">NIK / No. KTP</label>
            <input 
              className="input" 
              maxLength={16} 
              value={form.ktp_number} 
              onChange={e => setForm({ ...form, ktp_number: e.target.value })} 
              style={{ fontFamily: 'monospace' }}
              disabled={isScanning}
            />
          </div>
          <div className="form-group">
            <label className="label">Foto KTP</label>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              className="input" 
              onChange={handleFileChange} 
              disabled={isSaving || isScanning}
            />
            {isScanning && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Membaca data KTP... ({scanProgress}%)</span>
              </div>
            )}
          </div>
          <div className="dialog__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={isSaving || isScanning}>Batal</button>
            <button type="submit" className="btn btn--primary" disabled={isSaving || isScanning}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkUploadDialog({ onClose, files }) {
  const isFinished = files.every(f => f.status === 'SUCCESS' || f.status === 'FAILED')
  const successCount = files.filter(f => f.status === 'SUCCESS').length
  const failedCount = files.filter(f => f.status === 'FAILED').length

  return (
    <div className="dialog-overlay" onClick={isFinished ? onClose : undefined}>
      <div className="dialog dialog--lg" onClick={e => e.stopPropagation()}>
        <div className="dialog__header">
          <h2 className="dialog__title">Proses Upload Massal Foto KTP</h2>
          {isFinished && <button className="dialog__close" onClick={onClose}>✕</button>}
        </div>

        <div className="alert alert--info mb-4" style={{ 
          fontSize: 'var(--font-size-xs)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-start', 
          gap: 6,
          background: 'rgba(14, 165, 233, 0.06)',
          border: '1px solid rgba(14, 165, 233, 0.15)',
          color: '#0369a1',
          padding: 'var(--spacing-3) var(--spacing-4)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-4)'
        }}>
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>💡 Petunjuk Format Nama File KTP:</span>
          </div>
          <ul style={{ paddingLeft: 16, margin: 0, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <li>Pastikan data nama teknisi sudah di-import/ditambahkan terlebih dahulu ke sistem.</li>
            <li>Ganti nama (*rename*) file foto KTP menggunakan <strong>NIK</strong> (contoh: <code>3502140810950002.jpg</code>) atau <strong>Nama Lengkap</strong> teknisi (contoh: <code>Ahmad Fauzan.png</code>).</li>
            <li>Jika nama file tidak sesuai, sistem akan menggunakan deteksi tulisan (OCR) otomatis (pastikan foto KTP tegak, jelas, dan terang).</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Status: {isFinished ? 'Selesai' : 'Sedang memproses...'} ({successCount} berhasil, {failedCount} gagal dari {files.length} file)
          </p>
        </div>

        {/* Scrollable file list */}
        <div style={{ 
          maxHeight: '320px', 
          overflowY: 'auto', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-3)',
          background: 'var(--color-background)',
          marginBottom: 'var(--spacing-6)'
        }}>
          {files.map((file, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: idx < files.length - 1 ? '1px solid var(--color-border)' : 'none',
              fontSize: 'var(--font-size-xs)'
            }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                {file.matchedName && (
                  <div style={{ color: 'var(--color-success)', marginTop: 2 }}>
                    ✓ Cocok dengan: {file.matchedName}
                  </div>
                )}
                {file.error && (
                  <div style={{ color: 'var(--color-danger)', marginTop: 2 }}>
                    ⚠ {file.error}
                  </div>
                )}
              </div>
              <div>
                {file.status === 'WAITING' && (
                  <span className="badge badge--neutral">Menunggu</span>
                )}
                {file.status === 'SCANNING' && (
                  <span className="badge badge--primary" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    Memindai...
                  </span>
                )}
                {file.status === 'SUCCESS' && (
                  <span className="badge badge--success">Berhasil</span>
                )}
                {file.status === 'FAILED' && (
                  <span className="badge badge--danger">Gagal</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="dialog__footer">
          <button className="btn btn--primary" onClick={onClose} disabled={!isFinished}>
            {isFinished ? 'Tutup' : 'Memproses...'}
          </button>
        </div>
      </div>
    </div>
  )
}
