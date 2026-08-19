import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// PATCH salary — mark as PAID + auto-create Expense
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const salaryId = parseInt(id);

    const salary = await prisma.salary.findUnique({
      where: { id: salaryId },
      include: { user: { select: { name: true } } },
    });

    if (!salary) return apiError('Data gaji tidak ditemukan', 404);
    if (salary.status === 'PAID') return apiError('Gaji ini sudah dibayar sebelumnya', 400);

    // Update salary status to PAID
    const updated = await prisma.salary.update({
      where: { id: salaryId },
      data: { status: 'PAID' },
      include: { user: { select: { name: true } } },
    });

    // Auto-create Expense entry (read-only in Pengeluaran, per spec §8.2 & §9.2)
    await prisma.expense.create({
      data: {
        category: 'Gaji Karyawan',
        description: `Gaji ${salary.user?.name} periode ${salary.period}`,
        amount: salary.totalSalary,
        date: new Date(),
      },
    });

    // Log
    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'PAY_SALARY',
          detail: `Membayar gaji ${salary.user?.name} periode ${salary.period}: Rp${salary.totalSalary}`,
        },
      });
    }

    return apiResponse(updated);
  } catch (error) {
    console.error('Pay salary error:', error);
    return apiError('Gagal memproses pembayaran gaji', 500);
  }
}
