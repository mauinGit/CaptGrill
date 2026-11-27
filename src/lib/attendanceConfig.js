// Satu-satunya sumber pengaturan lokasi absensi.
// Diatur lewat environment variable (.env lokal / Environment Variables di Vercel):
//   STORE_LATITUDE, STORE_LONGITUDE  → koordinat resto
//   MAX_ATTENDANCE_DISTANCE          → radius maksimal absensi, dalam METER
// Server memakai nilai ini untuk validasi, halaman Absensi Kasir mengambilnya
// lewat GET /api/absensi/config - jadi cukup ubah env lalu restart / redeploy.

function toNumber(value, fallback) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getAttendanceConfig() {
  return {
    storeLat: toNumber(process.env.STORE_LATITUDE, -6.2),
    storeLng: toNumber(process.env.STORE_LONGITUDE, 106.8),
    maxDistance: toNumber(process.env.MAX_ATTENDANCE_DISTANCE, 10),
  };
}
