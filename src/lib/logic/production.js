/**
 * Section 16.2 & 16.3 — Produksi Bahan
 * - Kartu resep disabled kalau ada 1 bahan dasar yang tidak cukup untuk 1x produksi.
 * - Jumlah Produksi maksimal dibatasi oleh bahan dasar yang paling terbatas.
 */

export function isRecipeProducible(composition, currentStock) {
  return composition.every(({ bahanId, jumlah }) => {
    const tersedia = currentStock[bahanId] ?? 0;
    return tersedia >= jumlah;
  });
}

/**
 * Hitung jumlah maksimal produksi yang bisa dilakukan berdasarkan
 * bahan dasar paling terbatas (floor division per bahan, ambil minimum).
 * Return 0 kalau resep tidak bisa diproduksi sama sekali.
 */
export function calcMaxProduction(composition, currentStock) {
  if (composition.length === 0) return 0;
  let max = Infinity;
  for (const { bahanId, jumlah } of composition) {
    if (jumlah <= 0) continue;
    const tersedia = currentStock[bahanId] ?? 0;
    const maxForThis = Math.floor(tersedia / jumlah);
    max = Math.min(max, maxForThis);
  }
  return max === Infinity ? 0 : max;
}

/**
 * Ringkasan konsumsi bahan & hasil produksi untuk jumlah produksi tertentu.
 * Dipakai untuk menampilkan preview di modal "Konfirmasi Produksi".
 */
export function calcProductionSummary(composition, jumlahProduksi, hasilPerProduksi = 1) {
  const consumed = {};
  for (const { bahanId, jumlah } of composition) {
    consumed[bahanId] = jumlah * jumlahProduksi;
  }
  return {
    consumed,
    hasil: hasilPerProduksi * jumlahProduksi,
  };
}

/**
 * Validasi apakah jumlah produksi yang diminta masih dalam batas maksimal.
 */
export function isProductionQtyValid(jumlahProduksi, maxProduksi) {
  return Number.isInteger(jumlahProduksi) && jumlahProduksi >= 1 && jumlahProduksi <= maxProduksi;
}
