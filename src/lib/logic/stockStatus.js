/**
 * Section 5.2 — Logic Status Stok Bahan
 * Aman   : stok > stokMinimum
 * Menipis: 0 < stok <= stokMinimum
 * Habis  : stok === 0
 */

export function getStockStatus(stok, stokMinimum) {
  if (typeof stok !== 'number' || typeof stokMinimum !== 'number') {
    throw new TypeError('stok dan stokMinimum harus berupa number');
  }
  if (stok < 0) {
    // Stok tidak boleh pernah negatif (lihat Section 4 - validasi transaksi).
    // Kalau logic lain ada bug dan stok jadi negatif, tetap dianggap "Habis"
    // supaya UI tidak menampilkan status yang salah, tapi ini sinyal bug di tempat lain.
    return 'Habis';
  }
  if (stok === 0) return 'Habis';
  if (stok <= stokMinimum) return 'Menipis';
  return 'Aman';
}
