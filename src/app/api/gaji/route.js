import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// GET salary records
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where = {};
    if (userId) where.userId = parseInt(userId);

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        user: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(salaries);
  } catch (error) {
    console.error('Get salary error:', error);
    return apiError('Gagal mengambil data gaji', 500);
  }
}

// Calculate & create salary
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, period, dailyRate } = body;

    if (!userId || !period || !dailyRate) {
      return apiError('userId, period, dan dailyRate harus diisi', 400);
    }

    // Parse period (format: "2024-01")
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Count attendance days
    const attendanceCount = await prisma.attendance.count({
      where: {
        userId: parseInt(userId),
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSalary = attendanceCount * parseInt(dailyRate);

    const salary = await prisma.salary.create({
      data: {
        userId: parseInt(userId),
        period,
        totalDays: attendanceCount,
        dailyRate: parseInt(dailyRate),
        totalSalary,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    const reqUserId = request.headers.get('x-user-id');
    if (reqUserId) {
      await prisma.log.create({
        data: {
          userId: parseInt(reqUserId),
          action: 'CREATE_SALARY',
          detail: `Menghitung gaji ${salary.user.name} periode ${period}: Rp${totalSalary}`,
        },
      });
    }

    return apiResponse(salary, 201);
  } catch (error) {
    console.error('Create salary error:', error);
    return apiError('Gagal menghitung gaji', 500);
  }
}
