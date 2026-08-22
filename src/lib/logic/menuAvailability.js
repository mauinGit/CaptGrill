/**
 * Section 7.3 — Status Ketersediaan Menu (Tersedia / Stok Tidak Cukup)
 * Menu dianggap tersedia jika SEMUA bahan komposisinya cukup untuk
 * minimal 1 porsi.
 */
export function isMenuAvailable(composition, currentStock) {
  return composition.every(({ bahanId, jumlah }) => {
    const tersedia = currentStock[bahanId] ?? 0;
    return tersedia >= jumlah;
  });
}

export function getMenuStatusLabel(composition, currentStock) {
  return isMenuAvailable(composition, currentStock) ? 'Tersedia' : 'Stok Tidak Cukup';
}
