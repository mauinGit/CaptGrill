import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all ingredients
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const ingredients = await prisma.ingredient.findMany({
      where: search ? {
        name: { contains: search },
      } : undefined,
      orderBy: { name: 'asc' },
    });

    return apiResponse(ingredients);
  } catch (error) {
    console.error('Get ingredients error:', error);
    return apiError('Gagal mengambil data bahan', 500);
  }
}

// CREATE ingredient
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, unit, stock, minStock } = body;

    if (!name || !unit) {
      return apiError('Nama dan satuan harus diisi', 400);
    }

    // Check duplicate name
    const existing = await prisma.ingredient.findFirst({ where: { name: { equals: name } } });
    if (existing) {
      return apiError(`Bahan dengan nama "${name}" sudah ada`, 400);
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        stock: parseFloat(stock) || 0,
        minStock: parseFloat(minStock) || 0,
      },
    });

    // Log
    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'CREATE_INGREDIENT',
          detail: `Menambahkan bahan: ${name}`,
        },
      });
    }

    return apiResponse(ingredient, 201);
  } catch (error) {
    console.error('Create ingredient error:', error);
    return apiError('Gagal menambahkan bahan', 500);
  }
}
