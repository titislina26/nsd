import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

/**
 * Merge class names with clsx + tailwind-merge
 */
export function cn(...inputs) {
  return clsx(inputs)
}

/**
 * Format number to Indonesian Rupiah string
 * @param {number} amount 
 * @returns {string} e.g., "Rp 1.500.000"
 */
export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0'
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount)
}

/**
 * Format number with abbreviated suffix
 * @param {number} num 
 * @returns {string} e.g., "150.2 Jt" or "1.5 M"
 */
export function formatRupiahShort(num) {
  if (num == null || isNaN(num)) return 'Rp 0'
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} Jt`
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} Rb`
  return `Rp ${num}`
}

/**
 * Format date string with date-fns
 * @param {string|Date} date 
 * @param {string} fmt - date-fns format pattern
 * @returns {string}
 */
export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '-'
    return format(d, fmt, { locale: localeId })
  } catch {
    return '-'
  }
}

/**
 * Generate sequential ID with prefix
 * @param {string} prefix - e.g., "EXP", "TEC", "TSK"
 * @param {number} seq - sequence number
 * @returns {string} e.g., "EXP-2026-0001"
 */
export function generateId(prefix, seq) {
  const year = new Date().getFullYear()
  const padded = String(seq).padStart(4, '0')
  return `${prefix}-${year}-${padded}`
}

/**
 * Simple sequential counter for IDs
 */
let idCounter = 100
export function nextId(prefix) {
  idCounter++
  return generateId(prefix, idCounter)
}

/**
 * Calculate percentage
 */
export function calcPercentage(part, total) {
  if (!total || total === 0) return 0
  return Math.round((part / total) * 100)
}

/**
 * String similarity check (simple Jaccard-like)
 * Used for name matching in technician verification
 */
export function nameSimilarity(a, b) {
  if (!a || !b) return 0
  const normalize = s => s.toLowerCase().trim().replace(/\s+/g, ' ')
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1

  const wordsA = new Set(na.split(' '))
  const wordsB = new Set(nb.split(' '))
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])
  return intersection.size / union.size
}

/**
 * Check if a value is a valid positive number
 */
export function isValidAmount(val) {
  const num = typeof val === 'string' ? parseFloat(val.replace(/[.,\s]/g, '')) : val
  return !isNaN(num) && num > 0
}

/**
 * Check if date string is valid
 */
export function isValidDate(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return isValid(d)
}

/**
 * Get status badge variant
 */
export function getDocStatusVariant(status) {
  switch (status) {
    case 'APPROVED': return 'primary'
    case 'DONE': return 'success'
    case 'NOT_YET': return 'warning'
    default: return 'neutral'
  }
}

export function getDisbursementStatusVariant(status) {
  switch (status) {
    case 'PAID': return 'success'
    case 'UNPAID': return 'danger'
    default: return 'neutral'
  }
}

export function getVerificationStatusVariant(status) {
  switch (status) {
    case 'VERIFIED': return 'success'
    case 'REJECTED': return 'danger'
    case 'UNVERIFIED': return 'neutral'
    default: return 'neutral'
  }
}

/**
 * Area colors for charts
 */
export const AREA_COLORS = {
  JAWA: '#6366f1',
  PAPUA: '#10b981',
  SUMATERA: '#f59e0b',
  KALIMANTAN: '#ec4899',
  SULAWESI: '#8b5cf6',
  BALI_NUSA: '#06b6d4',
  MALUKU: '#f97316',
}

/**
 * Task type labels
 */
export const TASK_TYPE_LABELS = {
  INSTALLATION: 'Instalasi',
  MIGRATION: 'Migrasi',
  DISMANTLE: 'Dismantle',
  RELOCATION: 'Relokasi',
}

export const TASK_TYPE_COLORS = {
  INSTALLATION: '#6366f1',
  MIGRATION: '#10b981',
  DISMANTLE: '#f59e0b',
  RELOCATION: '#ec4899',
}

/**
 * Area labels
 */
export const AREA_LABELS = {
  JAWA: 'Jawa',
  PAPUA: 'Papua',
  SUMATERA: 'Sumatera',
  KALIMANTAN: 'Kalimantan',
  SULAWESI: 'Sulawesi',
  BALI_NUSA: 'Bali & Nusa Tenggara',
  MALUKU: 'Maluku',
}

/**
 * Bank options
 */
export const BANK_OPTIONS = [
  'BCA',
  'Mandiri',
  'BNI',
  'BRI',
  'BSI',
  'CIMB Niaga',
  'Danamon',
  'Permata',
  'BTN',
  'OCBC NISP',
]

/**
 * Expense categories
 */
export const EXPENSE_CATEGORIES = [
  'Tiket Pesawat',
  'Sewa Mobil',
  'Akomodasi',
  'Bensin',
  'Transportasi Lokal',
  'Makan',
  'Peralatan Teknis',
  'Lain-lain',
]
