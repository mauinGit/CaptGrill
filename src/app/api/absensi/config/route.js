import { apiResponse } from '@/lib/utils';
import { getAttendanceConfig } from '@/lib/attendanceConfig';

export const dynamic = 'force-dynamic';

// Koordinat resto & radius absensi untuk validasi di halaman Absensi Kasir
export async function GET() {
  return apiResponse(getAttendanceConfig());
}
