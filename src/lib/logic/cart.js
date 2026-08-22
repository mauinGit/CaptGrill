/**
 * Logic keranjang (cart) POS Kasir — Halaman Transaksi & Konfirmasi Pembayaran.
 * - Total keranjang, diskon (clamped di 0, tidak boleh negatif), dan kembalian.
 */

/** @param {Array<{price:number, qty:number}>} items */
export function calcCartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function calcCartItemCount(items) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * Total akhir setelah diskon. Tidak boleh pernah negatif (clamp ke 0)
 * meskipun diskon yang diinput lebih besar dari subtotal.
 */
export function calcFinalTotal(subtotal, diskon) {
  const safeDiskon = Math.max(0, diskon || 0);
  return Math.max(0, subtotal - safeDiskon);
}

/**
 * Kembalian untuk pembayaran Cash. Return null kalau metode bukan Cash
 * (karena kembalian tidak relevan untuk QRIS/Grab/GoFood - Section soal
 * field "Uang Dibayar" yang hanya muncul untuk Cash).
 */
export function calcKembalian(uangDibayar, totalAkhir, metodePembayaran) {
  if (metodePembayaran !== 'Cash') return null;
  return (uangDibayar || 0) - totalAkhir;
}

/**
 * Tombol "Konfirmasi & Bayar" boleh aktif jika:
 * - metode non-Cash (selalu dianggap pas/exact), ATAU
 * - metode Cash DAN uang dibayar >= total akhir
 */
export function canConfirmPayment({ metodePembayaran, uangDibayar, totalAkhir }) {
  if (metodePembayaran !== 'Cash') return true;
  return (uangDibayar || 0) >= totalAkhir;
}
