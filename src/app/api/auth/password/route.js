import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { apiResponse, apiError } from '@/lib/utils';

// Change password (user knows old password)
export async function PUT(request) {
  try {
    const { username, oldPassword, newPassword } = await request.json();

    if (!username || !oldPassword || !newPassword) {
      return apiError('Semua field harus diisi', 400);
    }

    if (newPassword.length < 4) {
      return apiError('Password baru minimal 4 karakter', 400);
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return apiError('Username tidak ditemukan', 404);
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return apiError('Password lama salah', 401);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        detail: `${user.name} mengubah password sendiri`,
      },
    });

    return apiResponse({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    return apiError('Gagal mengubah password', 500);
  }
}

// Forgot password (admin authorizes)
export async function POST(request) {
  try {
    const { username, adminPassword, newPassword } = await request.json();

    if (!username || !adminPassword || !newPassword) {
      return apiError('Semua field harus diisi', 400);
    }

    if (newPassword.length < 4) {
      return apiError('Password baru minimal 4 karakter', 400);
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      return apiError('Username tidak ditemukan', 404);
    }

    // Find admin accounts and verify admin password
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    let authorizedAdmin = null;
    for (const admin of admins) {
      const isValid = await bcrypt.compare(adminPassword, admin.password);
      if (isValid) {
        authorizedAdmin = admin;
        break;
      }
    }

    if (!authorizedAdmin) {
      return apiError('Password admin salah', 401);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { password: hashed },
    });

    await prisma.log.create({
      data: {
        userId: authorizedAdmin.id,
        action: 'RESET_PASSWORD',
        detail: `Admin reset password untuk: ${targetUser.name}`,
      },
    });

    return apiResponse({ message: 'Password berhasil direset' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return apiError('Gagal mereset password', 500);
  }
}
