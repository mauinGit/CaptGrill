import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// DELETE attendance record
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const attendanceId = parseInt(id);

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { user: { select: { name: true } } },
    });

    if (!attendance) {
      return apiError('Data absensi tidak ditemukan', 404);
    }

    await prisma.attendance.delete({ where: { id: attendanceId } });

    // Log action
    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'DELETE_ATTENDANCE',
          detail: `Admin menghapus absensi ${attendance.user?.name} tanggal ${new Date(attendance.date).toLocaleDateString('id-ID')}`,
        },
      });
    }

    return apiResponse({ message: 'Absensi berhasil dihapus' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    return apiError('Gagal menghapus absensi', 500);
  }
}
