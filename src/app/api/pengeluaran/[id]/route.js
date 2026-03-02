import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { category, description, amount, date } = body;

    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(amount && { amount: parseInt(amount) }),
        ...(date && { date: new Date(date) }),
      },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'UPDATE_EXPENSE',
          detail: `Mengupdate pengeluaran ID: ${id}`,
        },
      });
    }

    return apiResponse(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    return apiError('Gagal mengupdate pengeluaran', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'DELETE_EXPENSE',
          detail: `Menghapus pengeluaran ID: ${id}`,
        },
      });
    }

    return apiResponse({ message: 'Pengeluaran berhasil dihapus' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return apiError('Gagal menghapus pengeluaran', 500);
  }
}
