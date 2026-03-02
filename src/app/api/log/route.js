import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const logs = await prisma.log.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return apiResponse(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    return apiError('Gagal mengambil log aktivitas', 500);
  }
}
