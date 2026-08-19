import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// PATCH attendance — soft reject (update status + reason, no permanent delete)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rejectReason } = body;

    if (!rejectReason || !rejectReason.trim()) {
      return apiError('Alasan penolakan wajib diisi', 400);
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { name: true } } },
    });

    if (!attendance) return apiError('Data absensi tidak ditemukan', 404);
    if (attendance.status === 'DITOLAK') return apiError('Absensi ini sudah ditolak sebelumnya', 400);

    const updated = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        status: 'DITOLAK',
        rejectReason: rejectReason.trim(),
      },
      include: { user: { select: { name: true } } },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'REJECT_ATTENDANCE',
          detail: `Admin menolak absensi ${attendance.user?.name}: ${rejectReason.trim()}`,
        },
      });
    }

    return apiResponse(updated);
  } catch (error) {
    console.error('Reject attendance error:', error);
    return apiError('Gagal menolak absensi', 500);
  }
}

// NOTE: DELETE is intentionally removed per spec §11.3
// Attendance data must not be permanently deleted for audit trail integrity.
