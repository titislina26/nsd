/**
 * Konversi nominal angka ke teks terbilang dalam bahasa Indonesia
 * Sesuai algoritma pada PRD Section 5
 * 
 * @param {number|string} nominal - Angka yang akan dikonversi
 * @returns {string} Teks terbilang (e.g., "Satu Juta Dua Ratus Lima Puluh Ribu Tiga Ratus")
 */
export function terbilang(nominal) {
  const angka = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ]
  let temp = ''

  const n = parseInt(nominal, 10)
  if (isNaN(n) || n === 0) return ''

  if (n < 12) {
    temp = ' ' + angka[n]
  } else if (n < 20) {
    temp = terbilang(n - 10) + ' Belas'
  } else if (n < 100) {
    temp = terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10)
  } else if (n < 200) {
    temp = ' Seratus ' + terbilang(n - 100)
  } else if (n < 1000) {
    temp = terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100)
  } else if (n < 2000) {
    temp = ' Seribu ' + terbilang(n - 1000)
  } else if (n < 1000000) {
    temp = terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000)
  } else if (n < 1000000000) {
    temp = terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000)
  } else if (n < 1000000000000) {
    temp = terbilang(Math.floor(n / 1000000000)) + ' Milyar ' + terbilang(n % 1000000000)
  }

  return temp.trim()
}

/**
 * Konversi nominal ke teks terbilang + " Rupiah"
 * 
 * @param {number|string} amount - Nominal dalam Rupiah
 * @returns {string} e.g., "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilangRupiah(amount) {
  const result = terbilang(amount)
  if (!result) return 'Nol Rupiah'
  return result + ' Rupiah'
}
