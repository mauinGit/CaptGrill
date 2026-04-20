import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// Calculate & create salary with 2 components: Shift + Produksi Bahan
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, period, shiftRate, produksiRate } = body;

    if (!userId || !period) {
      return apiError('userId dan period harus diisi', 400);
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return apiError('userId tidak valid', 400);
    }

    // Validate user exists
    const userExists = await prisma.user.findUnique({ where: { id: parsedUserId } });
    if (!userExists) {
      return apiError('Karyawan tidak ditemukan', 404);
    }

    const parsedShiftRate = parseInt(shiftRate) || 0;
    const parsedProduksiRate = parseInt(produksiRate) || 0;

    if (parsedShiftRate === 0 && parsedProduksiRate === 0) {
      return apiError('Minimal satu rate gaji harus diisi', 400);
    }

    // Parse period (format: "2024-01")
    const [year, month] = period.split('-').map(Number);
    if (!year || !month) {
      return apiError('Format periode tidak valid (gunakan YYYY-MM)', 400);
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const dateFilter = {
      userId: parsedUserId,
      date: { gte: startDate, lte: endDate },
    };

    // Count shift attendance (Shift 1 + Shift 2)
    const shiftDays = await prisma.attendance.count({
      where: {
        ...dateFilter,
        OR: [
          { purpose: 'Shift 1' },
          { purpose: 'Shift 2' },
          { purpose: null },
        ],
      },
    });

    // Count production attendance (Membuat Bahan)
    const produksiDays = await prisma.attendance.count({
      where: {
        ...dateFilter,
        purpose: 'Membuat Bahan',
      },
    });

    const gajiShift = shiftDays * parsedShiftRate;
    const gajiProduksi = produksiDays * parsedProduksiRate;
    const totalSalary = gajiShift + gajiProduksi;
    const totalDays = shiftDays + produksiDays;

    // Use shiftRate as dailyRate for backward compatibility
    const dailyRate = parsedShiftRate || parsedProduksiRate;

    const salary = await prisma.salary.create({
      data: {
        userId: parsedUserId,
        period,
        totalDays,
        dailyRate,
        totalSalary,
        shiftDays,
        shiftRate: parsedShiftRate,
        gajiShift,
        produksiDays,
        produksiRate: parsedProduksiRate,
        gajiProduksi,
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
          detail: `Menghitung gaji ${salary.user.name} periode ${period}: Shift=${shiftDays}x${parsedShiftRate}, Produksi=${produksiDays}x${parsedProduksiRate}, Total=Rp${totalSalary}`,
        },
      });
    }

    return apiResponse(salary, 201);
  } catch (error) {
    console.error('Create salary error:', error);
    return apiError('Gagal menghitung gaji: ' + (error.message || ''), 500);
  }
}
