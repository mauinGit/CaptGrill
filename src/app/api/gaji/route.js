import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';
import { calculateGaji } from '@/lib/logic/payroll';

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

// Calculate & create salary with 3 components: Shift + Produksi + Bonus
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, period, shiftRate, produksiRate, bonus, bonusNote } = body;

    if (!userId || !period) {
      return apiError('userId dan period harus diisi', 400);
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return apiError('userId tidak valid', 400);
    }

    const userExists = await prisma.user.findUnique({ where: { id: parsedUserId } });
    if (!userExists) {
      return apiError('Karyawan tidak ditemukan', 404);
    }

    const parsedShiftRate = parseInt(shiftRate) || 0;
    const parsedProduksiRate = parseInt(produksiRate) || 0;
    const parsedBonus = parseInt(bonus) || 0;

    if (parsedShiftRate === 0 && parsedProduksiRate === 0) {
      return apiError('Minimal satu rate gaji harus diisi', 400);
    }

    const [year, month] = period.split('-').map(Number);
    if (!year || !month) {
      return apiError('Format periode tidak valid (gunakan YYYY-MM)', 400);
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Fetch all VALID attendance records for this user in this period
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: parsedUserId,
        date: { gte: startDate, lte: endDate },
        status: 'VALID',
      },
      select: { purpose: true, status: true },
    });

    // Map Prisma fields to logic function format:
    // purpose → tujuan, status enum VALID → 'Valid'
    const absensiList = attendanceRecords.map((a) => ({
      tujuan: a.purpose || 'Shift 1',
      status: a.status === 'VALID' ? 'Valid' : 'Ditolak',
    }));

    // Use tested calculateGaji logic
    const gajiResult = calculateGaji({
      absensiList,
      rateShift: parsedShiftRate,
      rateProduksi: parsedProduksiRate,
      bonus: parsedBonus,
    });

    const totalDays = gajiResult.jumlahShift + gajiResult.jumlahProduksi;
    const dailyRate = parsedShiftRate || parsedProduksiRate;

    const salary = await prisma.salary.create({
      data: {
        userId: parsedUserId,
        period, totalDays, dailyRate, totalSalary: gajiResult.total,
        shiftDays: gajiResult.jumlahShift, shiftRate: parsedShiftRate, gajiShift: gajiResult.gajiShift,
        produksiDays: gajiResult.jumlahProduksi, produksiRate: parsedProduksiRate, gajiProduksi: gajiResult.gajiProduksi,
        bonus: parsedBonus, bonusNote: bonusNote || null,
        status: 'DRAFT',
      },
      include: { user: { select: { name: true } } },
    });

    const reqUserId = request.headers.get('x-user-id');
    if (reqUserId) {
      await prisma.log.create({
        data: {
          userId: parseInt(reqUserId),
          action: 'CREATE_SALARY',
          detail: `Menghitung gaji ${salary.user.name} periode ${period}: Total=Rp${gajiResult.total}`,
        },
      });
    }

    return apiResponse(salary, 201);
  } catch (error) {
    console.error('Create salary error:', error);
    return apiError('Gagal menghitung gaji: ' + (error.message || ''), 500);
  }
}

