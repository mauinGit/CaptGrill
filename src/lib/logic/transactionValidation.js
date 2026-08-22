/**
 * Section 4 — Validasi Stok Transaksi
 *
 * Aturan:
 * - Cek SEMUA bahan dulu (untuk semua item di cart, dikali qty) sebelum
 *   memotong stok apapun (atomic: semua berhasil atau semua batal).
 * - Kalau ada 1 saja bahan yang tidak cukup, transaksi ditolak seluruhnya,
 *   tidak ada stok yang terpotong sebagian.
 *
 * @param {Array<{menuId:string, qty:number}>} cartItems
 * @param {Object<string, Array<{bahanId:string, jumlah:number}>>} menuCompositions
 *        map menuId -> komposisi bahan per 1 porsi
 * @param {Object<string, number>} currentStock map bahanId -> stok saat ini
 * @returns {{valid:boolean, errors:Array<{bahanId:string, dibutuhkan:number, tersedia:number}>, requiredTotals:Object<string,number>}}
 */
export function validateStockForTransaction(cartItems, menuCompositions, currentStock) {
  const requiredTotals = {};

  for (const { menuId, qty } of cartItems) {
    const composition = menuCompositions[menuId] || [];
    for (const { bahanId, jumlah } of composition) {
      requiredTotals[bahanId] = (requiredTotals[bahanId] || 0) + jumlah * qty;
    }
  }

  const errors = [];
  for (const [bahanId, dibutuhkan] of Object.entries(requiredTotals)) {
    const tersedia = currentStock[bahanId] ?? 0;
    if (tersedia < dibutuhkan) {
      errors.push({ bahanId, dibutuhkan, tersedia });
    }
  }

  return { valid: errors.length === 0, errors, requiredTotals };
}

/**
 * Terapkan pengurangan stok HANYA jika validasi lolos (atomic commit).
 * Melempar error kalau dipanggil dalam kondisi tidak valid — mencegah
 * pemanggil tidak sengaja memotong stok sebagian.
 */
export function commitStockDeduction(cartItems, menuCompositions, currentStock) {
  const validation = validateStockForTransaction(cartItems, menuCompositions, currentStock);
  if (!validation.valid) {
    const err = new Error('Stok tidak cukup untuk memproses transaksi');
    err.details = validation.errors;
    throw err;
  }

  const newStock = { ...currentStock };
  for (const [bahanId, dibutuhkan] of Object.entries(validation.requiredTotals)) {
    newStock[bahanId] = newStock[bahanId] - dibutuhkan;
  }
  return newStock;
}
