import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { apiError } from '@/lib/utils';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return apiError('Username dan password harus diisi', 400);
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return apiError('Username atau password salah', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return apiError('Username atau password salah', 401);
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    // Log login activity
    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        detail: `${user.name} (${user.role}) berhasil login`,
      },
    });

    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, 
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Terjadi kesalahan server', 500);
  }
}
