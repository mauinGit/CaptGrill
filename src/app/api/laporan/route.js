import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// GET laporan pemasukan & pengeluaran
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return apiError('Parameter from dan to harus diisi', 400);
    }

    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    // Get income from transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      include: {
        user: { select: { name: true } },
        details: {
          include: { menu: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalIncome = transactions.reduce((sum, t) => sum + t.finalPrice, 0);

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return apiResponse({
      period: { from, to },
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
      transactions,
      expenses,
    });
  } catch (error) {
    console.error('Get report error:', error);
    return apiError('Gagal mengambil laporan', 500);
  }
}
