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

    // Today's transactions
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: 'COMPLETED',
      },
    });

    const todayIncome = todayTransactions.reduce((sum, t) => sum + t.finalPrice, 0);

    // Low stock ingredients (parseFloat for Decimal type)
    const allIngredients = await prisma.ingredient.findMany();
    const lowStock = allIngredients.filter((i) => parseFloat(i.stock) <= parseFloat(i.minStock));

    // Total menus
    const totalMenus = await prisma.menu.count();
    const availableMenus = await prisma.menu.count({ where: { isAvailable: true } });

    // This month income & expense
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: 'COMPLETED',
      },
    });
    const monthIncome = monthTransactions.reduce((sum, t) => sum + t.finalPrice, 0);

    const monthExpenses = await prisma.expense.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const monthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Today's menu sales ranking
    const todayDetails = await prisma.transactionDetail.findMany({
      where: {
        transaction: {
          createdAt: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
        },
      },
      include: {
        menu: { select: { name: true, category: true } },
      },
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

    return apiResponse({
      todayTransactionCount: todayTransactions.length,
      todayIncome,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
      totalMenus,
      availableMenus,
      monthIncome,
      monthExpense,
      monthProfit: monthIncome - monthExpense,
      menuSales,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return apiError('Gagal memuat dashboard', 500);
  }
}
