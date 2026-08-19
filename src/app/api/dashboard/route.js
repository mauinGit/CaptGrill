import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
    });
    const todayIncome = todayTransactions.reduce((sum, t) => sum + t.finalPrice, 0);
    const todayTransactionCount = todayTransactions.length;

    // Yesterday's transactions (for delta indicator)
    const yesterdayTransactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: yesterday, lt: today }, status: 'COMPLETED' },
    });
    const yesterdayIncome = yesterdayTransactions.reduce((sum, t) => sum + t.finalPrice, 0);
    const yesterdayTransactionCount = yesterdayTransactions.length;

    // Low stock ingredients — full list with status
    const allIngredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    const lowStockItems = allIngredients
      .filter((i) => parseFloat(i.stock) <= parseFloat(i.minStock))
      .map((i) => {
        const stock = parseFloat(i.stock);
        const minStock = parseFloat(i.minStock);
        return {
          id: i.id,
          name: i.name,
          unit: i.unit,
          stock,
          minStock,
          // status: Habis if stock==0, else Menipis
          status: stock === 0 ? 'HABIS' : 'MENIPIS',
          // progress bar: percentage relative to minStock (0–100)
          progressPercent: minStock > 0 ? Math.min(100, Math.round((stock / minStock) * 100)) : 0,
        };
      });

    // Today's menu sales ranking
    const todayDetails = await prisma.transactionDetail.findMany({
      where: {
        transaction: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
      },
      include: { menu: { select: { name: true, category: true } } },
    });

    const menuSalesMap = {};
    todayDetails.forEach((d) => {
      const menuName = d.menu?.name || 'Unknown';
      const category = d.menu?.category || '';
      if (!menuSalesMap[menuName]) {
        menuSalesMap[menuName] = { name: menuName, category, totalQty: 0, totalRevenue: 0 };
      }
      menuSalesMap[menuName].totalQty += d.quantity;
      menuSalesMap[menuName].totalRevenue += d.subtotal;
    });
    const menuSales = Object.values(menuSalesMap).sort((a, b) => b.totalQty - a.totalQty);

    // Chart data: last 14 days (2 weeks) income vs expense per day
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const last14Transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: fourteenDaysAgo, lt: tomorrow }, status: 'COMPLETED' },
    });
    const last14Expenses = await prisma.expense.findMany({
      where: { date: { gte: fourteenDaysAgo, lte: today } },
    });

    // Build daily chart data (14 days)
    const chartDays = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric' });
      const dayIncome = last14Transactions
        .filter((t) => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) < dayEnd)
        .reduce((s, t) => s + t.finalPrice, 0);
      const dayExpense = last14Expenses
        .filter((e) => {
          const eDate = new Date(e.date);
          return eDate >= dayStart && eDate < dayEnd;
        })
        .reduce((s, e) => s + e.amount, 0);

      chartDays.push({ label: dayLabel, income: dayIncome, expense: dayExpense });
    }

    return apiResponse({
      // Stat cards
      todayTransactionCount,
      todayIncome,
      yesterdayTransactionCount,
      yesterdayIncome,
      // Low stock list
      lowStockCount: lowStockItems.length,
      lowStockItems,
      // Menu terlaris
      menuSales,
      // Chart 14 hari (2 minggu)
      chartData: chartDays,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return apiError('Gagal memuat dashboard', 500);
  }
}
