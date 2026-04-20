import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all users (admin only)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return apiResponse(users);
  } catch (error) {
    console.error('Get users error:', error);
    return apiError('Gagal mengambil data pengguna', 500);
  }
}

// CREATE user
export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, name, role } = body;

    if (!username || !password || !name) {
      return apiError('Username, password, dan nama harus diisi', 400);
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return apiError('Username sudah digunakan', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'KASIR',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'CREATE_USER',
          detail: `Membuat akun: ${name} (${role || 'KASIR'})`,
        },
      });
    }

    return apiResponse(user, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return apiError('Gagal membuat akun', 500);
  }
}
