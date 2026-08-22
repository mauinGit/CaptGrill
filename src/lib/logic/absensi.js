/**
 * Section 18.3 & 18.5 — Validasi Absensi Kasir
 * - Lokasi valid jika jarak ke resto <= 100 meter (radius tetap).
 * - Satu Tujuan (Shift 1 / Shift 2 / Buat Bahan) hanya boleh dikirim 1x per hari.
 */

export const MAX_RADIUS_METERS = 100;
const EARTH_RADIUS_METERS = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Jarak antara 2 titik koordinat (haversine formula), dalam meter. */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function isLocationValid(distanceMeters, maxRadius = MAX_RADIUS_METERS) {
  return distanceMeters <= maxRadius;
}

/**
 * Cek apakah karyawan sudah absen untuk Tujuan tertentu HARI INI.
 * @param {Array<{tujuan:string, tanggal:string, status:string}>} absensiHariIni - absensi milik karyawan yang sama, tanggal hari ini saja
 * @param {string} tujuan - 'Shift 1' | 'Shift 2' | 'Buat Bahan'
 */
export function hasAbsenToday(absensiHariIni, tujuan) {
  return absensiHariIni.some((a) => a.tujuan === tujuan);
}

/**
 * Tentukan apakah submit absensi baru diizinkan untuk suatu Tujuan.
 * Ditolak kalau Tujuan itu sudah pernah diabsen hari ini (apapun statusnya --
 * termasuk yang sudah Ditolak, karena itu tetap sudah "dipakai" untuk hari itu
 * kecuali desain lanjutan memutuskan sebaliknya).
 */
export function canSubmitAbsensi(absensiHariIni, tujuan) {
  return !hasAbsenToday(absensiHariIni, tujuan);
}
