import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// GET all recipes with compositions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const recipes = await prisma.recipe.findMany({
      where: search ? {
        name: { contains: search },
      } : undefined,
      include: {
        ingredient: true,
        compositions: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return apiResponse(recipes);
  } catch (error) {
    console.error('Get recipes error:', error);
    return apiError('Gagal mengambil data resep', 500);
  }
}

// CREATE recipe
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, ingredientId, compositions } = body;

    if (!name || !ingredientId) {
      return apiError('Nama bahan dan bahan hasil harus diisi', 400);
    }

    if (!compositions || compositions.length === 0) {
      return apiError('Komposisi bahan harus diisi minimal 1', 400);
    }

    // Check duplicate name
    const existing = await prisma.recipe.findFirst({ where: { name: { equals: name } } });
    if (existing) {
      return apiError(`Resep "${name}" sudah ada`, 400);
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        ingredientId: parseInt(ingredientId),
        compositions: {
          create: compositions
            .filter((c) => c.ingredientId && c.quantity)
            .map((c) => ({
              ingredientId: parseInt(c.ingredientId),
              quantity: parseFloat(c.quantity),
            })),
        },
      },
      include: {
        ingredient: true,
        compositions: {
          include: { ingredient: true },
        },
      },
    });

    // Log
    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'CREATE_RECIPE',
          detail: `Menambahkan resep: ${name}`,
        },
      });
    }

    return apiResponse(recipe, 201);
  } catch (error) {
    console.error('Create recipe error:', error);
    return apiError('Gagal menambahkan resep: ' + (error.message || ''), 500);
  }
}
