import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all menus with ingredients + stock availability
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

    // Compute isStockSufficient for each menu (spec §7.3)
    const menusWithStock = menus.map((menu) => {
      let isStockSufficient = true;
      if (menu.menuIngredients && menu.menuIngredients.length > 0) {
        for (const mi of menu.menuIngredients) {
          const currentStock = parseFloat(mi.ingredient?.stock ?? 0);
          const needed = parseFloat(mi.quantity ?? 0);
          if (currentStock < needed) {
            isStockSufficient = false;
            break;
          }
        }
      }
      return { ...menu, isStockSufficient };
    });

    return apiResponse(menusWithStock);
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
