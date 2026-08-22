/**
 * Logic skala sumbu Y untuk Grafik Keuangan (Dashboard & Laporan).
 * Skala bertingkat (tier tetap), BUKAN hardcode angka tunggal, BUKAN
 * auto-scale bebas — tapi memilih tier terkecil dari deret tetap yang
 * >= nilai data tertinggi.
 *
 * Deret dasar: 1jt, 2jt, 3jt, 5jt -> lanjut x10 tiap level:
 * 10jt, 20jt, 30jt, 50jt -> 100jt, 200jt, 300jt, 500jt -> dst.
 */

const BASE_MULTIPLIERS = [1, 2, 3, 5];
const JUTA = 1_000_000;

/** Generate deret tier sampai batas tertentu (default cukup untuk kebutuhan UMKM: sampai 1 miliar). */
export function generateTiers(upperBoundInclusive = 1_000 * JUTA) {
  const tiers = [];
  let magnitude = JUTA; // mulai dari skala jutaan
  while (magnitude <= upperBoundInclusive) {
    for (const m of BASE_MULTIPLIERS) {
      const value = m * magnitude;
      if (value <= upperBoundInclusive) tiers.push(value);
    }
    magnitude *= 10;
  }
  return tiers.sort((a, b) => a - b);
}

export const TIERS = generateTiers();

/**
 * Pilih nilai maksimum sumbu Y: tier terkecil yang >= nilai data tertinggi.
 * Kalau data 0/kosong semua, pakai tier terendah (1 juta) sebagai default.
 */
export function getYAxisMax(maxDataValue) {
  if (!maxDataValue || maxDataValue <= 0) return TIERS[0];
  const found = TIERS.find((t) => t >= maxDataValue);
  return found ?? TIERS[TIERS.length - 1];
}
