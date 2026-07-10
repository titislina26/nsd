import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Parse a CSV or Excel file and return an array of objects
 * 
 * @param {File} file - The file to parse
 * @returns {Promise<{ headers: string[], data: object[], errors: string[] }>}
 */
export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase()

  if (extension === 'csv') {
    return parseCSV(file)
  } else if (['xlsx', 'xls'].includes(extension)) {
    return parseExcel(file)
  } else {
    throw new Error(`Unsupported file format: .${extension}. Please use .csv, .xlsx, or .xls`)
  }
}

/**
 * Parse CSV file using PapaParse
 */
function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      encoding: 'UTF-8',
      complete: (results) => {
        const cleanedData = results.data.map((row, idx) => {
          const newRow = { __rowIndex: idx + 1 }
          Object.keys(row).forEach(key => {
            let val = row[key]
            if (val != null) {
              val = String(val).trim()
              if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(val)) {
                const parts = val.split(/[\/\-]/)
                const day = parts[0].padStart(2, '0')
                const month = parts[1].padStart(2, '0')
                const year = parts[2]
                newRow[key] = `${year}-${month}-${day}`
              } else {
                newRow[key] = val
              }
            } else {
              newRow[key] = ''
            }
          })
          return newRow
        })
        resolve({
          headers: results.meta.fields || [],
          data: cleanedData,
          errors: results.errors.map(e => `Row ${e.row + 1}: ${e.message}`),
        })
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      },
    })
  })
}

/**
 * Parse Excel file using SheetJS
 */
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        
        // Use the first sheet
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          reject(new Error('Excel file has no sheets'))
          return
        }

        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        if (jsonData.length < 2) {
          reject(new Error('Excel file has no data rows'))
          return
        }

        const headers = jsonData[0].map(h => String(h).trim())
        const rows = jsonData.slice(1).map((row, idx) => {
          const obj = { __rowIndex: idx + 1 }
          headers.forEach((header, i) => {
            let val = row[i]
            if (val instanceof Date && !isNaN(val.getTime())) {
              // Convert JS Date object to yyyy-mm-dd, adjusting for timezone offset
              const offset = val.getTimezoneOffset()
              const localDate = new Date(val.getTime() - (offset * 60 * 1000))
              obj[header] = localDate.toISOString().split('T')[0]
            } else if (val != null) {
              val = String(val).trim()
              if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(val)) {
                const parts = val.split(/[\/\-]/)
                const day = parts[0].padStart(2, '0')
                const month = parts[1].padStart(2, '0')
                const year = parts[2]
                obj[header] = `${year}-${month}-${day}`
              } else {
                obj[header] = val
              }
            } else {
              obj[header] = ''
            }
          })
          return obj
        }).filter(row => {
          // Skip completely empty rows
          return Object.entries(row).some(([k, v]) => k !== '__rowIndex' && v !== '')
        })

        resolve({
          headers,
          data: rows,
          errors: [],
        })
      } catch (err) {
        reject(new Error(`Excel parsing failed: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Auto-match source headers to target schema fields (fuzzy)
 * 
 * @param {string[]} sourceHeaders - Headers from the uploaded file
 * @param {object[]} targetFields - Array of { key, label, aliases }
 * @returns {object} Mapping: { sourceHeader: targetFieldKey }
 */
export function autoMapColumns(sourceHeaders, targetFields) {
  const mapping = {}

  for (const source of sourceHeaders) {
    const normalized = source.toLowerCase().trim().replace(/[_\-\s]+/g, '')
    let bestMatch = null
    let bestScore = 0

    for (const field of targetFields) {
      // 1. Check exact key match
      if (normalized === field.key.toLowerCase().replace(/[_\-\s]+/g, '')) {
        bestMatch = field.key
        bestScore = 1
        break
      }

      // 2. Check exact label match
      if (normalized === field.label.toLowerCase().replace(/[_\-\s]+/g, '')) {
        bestMatch = field.key
        bestScore = 1
        break
      }

      // 3. Check exact alias match
      if (field.aliases) {
        for (const alias of field.aliases) {
          const normAlias = alias.toLowerCase().replace(/[_\-\s]+/g, '')
          if (normalized === normAlias) {
            if (0.9 > bestScore) {
              bestMatch = field.key
              bestScore = 0.9
            }
          } else if (normalized.includes(normAlias) && normAlias.length > 4) {
            // Only allow partial match if alias is long enough to avoid false positives like 'no'
            if (0.5 > bestScore) {
              bestMatch = field.key
              bestScore = 0.5
            }
          }
        }
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      mapping[source] = bestMatch
    }
  }

  return mapping
}

/**
 * Target schema fields for CARF import
 */
export const CARF_SCHEMA_FIELDS = [
  {
    key: 'document_number',
    label: 'No. Dokumen',
    aliases: ['no dokumen', 'nodokumen', 'document', 'doc number', 'no_dokumen', 'kode dokumen', 'nomor'],
    required: true,
  },
  {
    key: 'pengajuan_number',
    label: 'No. Pengajuan',
    aliases: ['no pengajuan', 'pengajuan no', 'pengajuan number', 'no_pengajuan', 'sequence'],
    required: false,
  },
  {
    key: 'request_date',
    label: 'Tanggal Permintaan',
    aliases: ['tanggal', 'tgl', 'date', 'request_date', 'tanggal pengajuan', 'tanggal permintaan'],
    required: true,
  },
  {
    key: 'technician_name',
    label: 'Nama Teknisi',
    aliases: ['teknisi', 'nama teknisi', 'technician', 'nama', 'pekerja', 'user'],
    required: true,
  },
  {
    key: 'requestor_name',
    label: 'Requestor',
    aliases: ['requestor', 'pembuat', 'pengaju', 'nama requestor'],
    required: true,
  },
  {
    key: 'expense_category',
    label: 'Keterangan',
    aliases: ['keterangan', 'kategori', 'category', 'jenis', 'tipe biaya', 'jenis biaya', 'kategori biaya'],
    required: false,
  },
  {
    key: 'description',
    label: 'Deskripsi Kebutuhan',
    aliases: ['deskripsi', 'detail', 'uraian', 'description', 'keperluan', 'deskripsi kebutuhan'],
    required: true,
  },
  {
    key: 'description_other',
    label: 'Deskripsi Dana Other',
    aliases: ['deskripsi dana other', 'dana other', 'other', 'deskripsi other', 'description other'],
    required: false,
  },
  {
    key: 'amount',
    label: 'Nominal',
    aliases: ['nominal', 'amount', 'jumlah', 'biaya', 'dana', 'total', 'rupiah', 'nilai', 'total pengajuan'],
    required: true,
  },
  {
    key: 'area',
    label: 'Area',
    aliases: ['area', 'wilayah', 'region', 'lokasi', 'daerah'],
    required: false,
  },
]
