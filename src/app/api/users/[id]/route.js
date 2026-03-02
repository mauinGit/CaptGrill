import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { apiResponse, apiError } from '@/lib/utils';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, password, name, role } = body;

    const updateData = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const reqUserId = request.headers.get('x-user-id');
    if (reqUserId) {
      await prisma.log.create({
        data: {
          userId: parseInt(reqUserId),
          action: 'UPDATE_USER',
          detail: `Mengupdate akun: ${user.name}`,
        },
      });
    }

    return apiResponse(user);
  } catch (error) {
    console.error('Update user error:', error);
    return apiError('Gagal mengupdate akun', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Delete related records first to avoid foreign key constraints
    // 1. Delete transaction details for this user's transactions
    const userTransactions = await prisma.transaction.findMany({
      where: { userId },
      select: { id: true },
    });
    if (userTransactions.length > 0) {
      await prisma.transactionDetail.deleteMany({
        where: { transactionId: { in: userTransactions.map((t) => t.id) } },
      });
      await prisma.transaction.deleteMany({ where: { userId } });
    }

    // 2. Delete attendances, salaries, logs
    await prisma.attendance.deleteMany({ where: { userId } });
    await prisma.salary.deleteMany({ where: { userId } });
    await prisma.log.deleteMany({ where: { userId } });

    const user = await prisma.user.delete({
      where: { id: userId },
    });

    const reqUserId = request.headers.get('x-user-id');
    if (reqUserId) {
      await prisma.log.create({
        data: {
          userId: parseInt(reqUserId),
          action: 'DELETE_USER',
          detail: `Menghapus akun: ${user.name}`,
        },
      });
    }

    return apiResponse({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    return apiError('Gagal menghapus akun', 500);
  }
}
