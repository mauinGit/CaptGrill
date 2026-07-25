import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all live data (transactions, expenses, attendance, salary)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const tab = searchParams.get('tab') || 'all';

    if (!from || !to) {
      return apiError('Parameter from dan to harus diisi', 400);
    }

    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const result = {};

    // Transactions
    if (tab === 'all' || tab === 'transaksi') {
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

      result.transactions = transactions.map((t) => {
        const hour = new Date(t.createdAt).getHours();
        const shift = hour >= 6 && hour < 15 ? 'Shift 1' : 'Shift 2';
        const items = t.details?.map((d) => `${d.menu?.name} x${d.quantity}`).join(', ') || '-';

        return {
          id: t.id,
          orderNumber: t.orderNumber || `#${t.id}`,
          createdAt: t.createdAt,
          kasir: t.user?.name || '-',
          items,
          paymentMethod: t.paymentMethod || 'Cash',
          shift,
          totalPrice: t.totalPrice,
          discount: t.discount || 0,
          finalPrice: t.finalPrice,
          amountPaid: t.amountPaid || 0,
        };
      });

      result.transactionSummary = {
        totalIncome: transactions.reduce((sum, t) => sum + t.finalPrice, 0),
        totalTransactions: transactions.length,
        paymentBreakdown: { Cash: 0, Grab: 0, QRIS: 0, GoFood: 0 },
      };

      transactions.forEach((t) => {
        const method = t.paymentMethod || 'Cash';
        if (result.transactionSummary.paymentBreakdown.hasOwnProperty(method)) {
          result.transactionSummary.paymentBreakdown[method] += t.finalPrice;
        } else {
          result.transactionSummary.paymentBreakdown['Cash'] += t.finalPrice;
        }
      });
    }

    // Expenses
    if (tab === 'all' || tab === 'pengeluaran') {
      const expenses = await prisma.expense.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'desc' },
      });

      result.expenses = expenses.map((e) => ({
        id: e.id,
        date: e.date,
        category: e.category,
        description: e.description || '-',
        amount: e.amount,
      }));

      result.expenseSummary = {
        totalExpense: expenses.reduce((sum, e) => sum + e.amount, 0),
        totalItems: expenses.length,
      };
    }

    // Attendance
    if (tab === 'all' || tab === 'absensi') {
      const attendances = await prisma.attendance.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      });

      result.attendances = attendances.map((a) => ({
        id: a.id,
        name: a.user?.name || '-',
        date: a.date,
        clockIn: a.clockIn,
        purpose: a.purpose || 'Shift 1',
        hasPhoto: !!a.photo,
        hasLocation: !!(a.latitude && a.longitude),
      }));

      result.attendanceSummary = {
        totalRecords: attendances.length,
      };
    }

    // Salary
    if (tab === 'all' || tab === 'gaji') {
      // For salary, use period-based filtering (YYYY-MM format)
      const fromPeriod = from.substring(0, 7);
      const toPeriod = to.substring(0, 7);

      const salaries = await prisma.salary.findMany({
        where: {
          period: { gte: fromPeriod, lte: toPeriod },
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      result.salaries = salaries.map((s) => ({
        id: s.id,
        name: s.user?.name || '-',
        period: s.period,
        shiftDays: s.shiftDays || 0,
        shiftRate: s.shiftRate || s.dailyRate || 0,
        gajiShift: s.gajiShift || 0,
        produksiDays: s.produksiDays || 0,
        produksiRate: s.produksiRate || 0,
        gajiProduksi: s.gajiProduksi || 0,
        totalSalary: s.totalSalary,
      }));

      result.salarySummary = {
        totalSalary: salaries.reduce((sum, s) => sum + s.totalSalary, 0),
        totalEmployees: salaries.length,
      };
    }

    // Overall profit (only when we have both)
    if (result.transactionSummary && result.expenseSummary) {
      result.profit = result.transactionSummary.totalIncome - result.expenseSummary.totalExpense;
    }

    return apiResponse(result);
  } catch (error) {
    console.error('Get live data error:', error);
    return apiError('Gagal mengambil live data', 500);
  }
}
