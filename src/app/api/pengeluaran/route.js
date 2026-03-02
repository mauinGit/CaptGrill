import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// GET all expenses
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const category = searchParams.get('category');

    const where = {};
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
    if (category) {
      where.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return apiResponse(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    return apiError('Gagal mengambil data pengeluaran', 500);
  }
}

// CREATE expense
export async function POST(request) {
  try {
    const body = await request.json();
    const { category, description, amount, date } = body;

    if (!category || !amount || !date) {
      return apiError('Kategori, nominal, dan tanggal harus diisi', 400);
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        description: description || '',
        amount: parseInt(amount),
        date: new Date(date),
      },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'CREATE_EXPENSE',
          detail: `Menambahkan pengeluaran: ${category} - Rp${amount}`,
        },
      });
    }

    return apiResponse(expense, 201);
  } catch (error) {
    console.error('Create expense error:', error);
    return apiError('Gagal menambahkan pengeluaran', 500);
  }
}
