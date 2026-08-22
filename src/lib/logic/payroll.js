/**
 * Section 12.1 & 11.4 — Perhitungan Gaji Karyawan
 *
 * - Gaji Shift    = jumlah absensi valid (Tujuan Shift 1/Shift 2) x rateShift
 * - Gaji Produksi = jumlah absensi valid (Tujuan Buat Bahan) x rateProduksi
 * - Bonus         = nominal manual (opsional)
 * - Total         = Gaji Shift + Gaji Produksi + Bonus
 *
 * Catatan (Section 11.4 & 16.5): hanya absensi berstatus "Valid" yang dihitung.
 * Absensi "Ditolak" tidak dihitung sebagai kehadiran.
 */

export function countValidAbsensiByTujuan(absensiList, tujuan) {
  return absensiList.filter((a) => a.tujuan === tujuan && a.status === 'Valid').length;
}

export function calculateGaji({ absensiList, rateShift, rateProduksi, bonus = 0 }) {
  const jumlahShift =
    countValidAbsensiByTujuan(absensiList, 'Shift 1') +
    countValidAbsensiByTujuan(absensiList, 'Shift 2');
  const jumlahProduksi = countValidAbsensiByTujuan(absensiList, 'Buat Bahan');

  const gajiShift = jumlahShift * rateShift;
  const gajiProduksi = jumlahProduksi * rateProduksi;
  const total = gajiShift + gajiProduksi + bonus;

  return {
    jumlahShift,
    jumlahProduksi,
    gajiShift,
    gajiProduksi,
    bonus,
    total,
  };
}
