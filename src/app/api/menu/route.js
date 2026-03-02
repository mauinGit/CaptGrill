import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// GET all menus with ingredients
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const menus = await prisma.menu.findMany({
      where: {
        ...(search && { name: { contains: search } }),
        ...(category && { category }),
      },
      include: {
        menuIngredients: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return apiResponse(menus);
  } catch (error) {
    console.error('Get menus error:', error);
    return apiError('Gagal mengambil data menu', 500);
  }
}

// CREATE menu
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, price, category, image, ingredients } = body;

    if (!name || !price) {
      return apiError('Nama dan harga harus diisi', 400);
    }

    // Check duplicate name
    const existing = await prisma.menu.findFirst({ where: { name: { equals: name } } });
    if (existing) {
      return apiError(`Menu dengan nama "${name}" sudah ada`, 400);
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        price: parseInt(price),
        category: category || 'Makanan',
        image: image || null,
        menuIngredients: ingredients?.length ? {
          create: ingredients.map((ing) => ({
            ingredientId: parseInt(ing.ingredientId),
            quantity: parseFloat(ing.quantity),
          })),
        } : undefined,
      },
      include: {
        menuIngredients: {
          include: { ingredient: true },
        },
      },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'CREATE_MENU',
          detail: `Menambahkan menu: ${name} - Rp${price}`,
        },
      });
    }

    return apiResponse(menu, 201);
  } catch (error) {
    console.error('Create menu error:', error);
    return apiError('Gagal menambahkan menu', 500);
  }
}
