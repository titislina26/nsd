import { createWorker } from 'tesseract.js'

/**
 * Perform client-side OCR on an image file using Tesseract.js
 * @param {File} file - The image file of the KTP
 * @param {function} onProgress - Callback for progress updates
 * @returns {Promise<{ name: string, nik: string, rawText: string }>}
 */
export async function performKtpOcr(file, onProgress = () => {}) {
  // Use createWorker from tesseract.js
  // For Indonesian KTP, 'ind' or 'eng' language pack works. Let's use 'ind' (Indonesian) or 'eng'
  // Indonesian 'ind' is better, but 'eng' is also fast and usually preloaded. Let's use 'ind+eng' or 'ind'
  const worker = await createWorker('ind', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })

  try {
    const { data: { text } } = await worker.recognize(file)
    await worker.terminate()

    const parsed = parseKtpText(text)
    return {
      ...parsed,
      rawText: text
    }
  } catch (error) {
    await worker.terminate()
    throw error
  }
}

/**
 * Heuristics to parse Indonesian KTP OCR text
 */
function parseKtpText(text) {
  const result = { name: '', nik: '' }
  if (!text) return result

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // 1. Find NIK (usually 16-digit number)
  for (const line of lines) {
    // Remove common OCR character mismatches for numbers (e.g. 'O'/'D' instead of '0', 'I'/'L' instead of '1')
    // We clean punctuation and look for sequence of digits
    const cleanedDigits = line.replace(/[^0-9]/g, '')
    if (cleanedDigits.length === 16 && !result.nik) {
      result.nik = cleanedDigits
    }
  }

  // 2. Find Nama
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lowerLine = line.toLowerCase()
    
    if (lowerLine.includes('nama')) {
      // Try matching "Nama: [Name]" or "Nama : [Name]" or "Nama - [Name]"
      const match = line.match(/nama\s*[:\-]?\s*(.+)/i)
      if (match && match[1]) {
        result.name = cleanName(match[1])
        break
      } else if (i + 1 < lines.length) {
        // If "Nama" is on its own line (or has no suffix), check the next line
        result.name = cleanName(lines[i+1])
        break
      }
    }
  }

  // Fallback: If no name found under "nama", find the first alphabetical line that fits a typical Indonesian name structure
  if (!result.name) {
    for (const line of lines) {
      const clean = cleanName(line)
      if (
        clean.length > 4 && 
        !clean.toLowerCase().includes('republik') && 
        !clean.toLowerCase().includes('indonesia') && 
        !clean.toLowerCase().includes('kartu') && 
        !clean.toLowerCase().includes('tanda') && 
        !clean.toLowerCase().includes('penduduk') && 
        !clean.toLowerCase().includes('provinsi') && 
        !clean.toLowerCase().includes('nik') &&
        !clean.toLowerCase().includes('kabupaten') && 
        !clean.toLowerCase().includes('kota') &&
        !clean.toLowerCase().includes('gol. darah') &&
        !clean.toLowerCase().includes('goldarah') &&
        !clean.toLowerCase().includes('lahir') &&
        !clean.toLowerCase().includes('alamat') &&
        !clean.toLowerCase().includes('kecamatan')
      ) {
        result.name = clean
        break
      }
    }
  }

  return result
}

function cleanName(str) {
  return str
    .replace(/[^a-zA-Z\s]/g, '') // remove non-alphabetic chars
    .replace(/\s+/g, ' ')       // collapse multiple spaces
    .trim()
    .toUpperCase()
}
