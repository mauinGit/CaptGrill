import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET production logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    const where = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    } else if (from && to) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    const logs = await prisma.productionLog.findMany({
      where,
      include: {
        recipe: {
          include: {
            ingredient: true,
          },
        },
        user: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(logs);
  } catch (error) {
    console.error('Get production logs error:', error);
    return apiError('Gagal mengambil data produksi', 500);
  }
}

// PROCESS production — deduct raw ingredients, add output ingredient
export async function POST(request) {
  try {
    const body = await request.json();
    const { recipeId, quantity } = body;
    const userId = request.headers.get('x-user-id');

    if (!recipeId || !quantity || quantity <= 0) {
      return apiError('Resep dan jumlah produksi harus diisi', 400);
    }

    if (!userId) {
      return apiError('User tidak teridentifikasi', 401);
    }

    // Get recipe with compositions
    const recipe = await prisma.recipe.findUnique({
      where: { id: parseInt(recipeId) },
      include: {
        ingredient: true,
        compositions: {
          include: { ingredient: true },
        },
      },
    });

    if (!recipe) {
      return apiError('Resep tidak ditemukan', 404);
    }

    const parsedQty = parseInt(quantity);

    // Build detail string
    const deductions = recipe.compositions.map(
      (c) => `${c.ingredient.name}: -${c.quantity * parsedQty} ${c.ingredient.unit}`
    );
    const outputDetail = `${recipe.ingredient.name}: +${parsedQty} ${recipe.ingredient.unit}`;
    const detailStr = `Produksi ${recipe.name} x${parsedQty}\nBahan terpakai: ${deductions.join(', ')}\nHasil: ${outputDetail}`;

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct raw ingredients
      for (const comp of recipe.compositions) {
        await tx.ingredient.update({
          where: { id: comp.ingredientId },
          data: {
            stock: { decrement: comp.quantity * parsedQty },
          },
        });
      }

      // Add output ingredient
      await tx.ingredient.update({
        where: { id: recipe.ingredientId },
        data: {
          stock: { increment: parsedQty },
        },
      });

      // Create production log
      const log = await tx.productionLog.create({
        data: {
          recipeId: parseInt(recipeId),
          userId: parseInt(userId),
          quantity: parsedQty,
          detail: detailStr,
        },
        include: {
          recipe: {
            include: { ingredient: true },
          },
          user: { select: { name: true } },
        },
      });

      // Also log to general log
      await tx.log.create({
        data: {
          userId: parseInt(userId),
          action: 'PRODUCTION',
          detail: detailStr,
        },
      });

      return log;
    });

    return apiResponse(result, 201);
  } catch (error) {
    console.error('Production error:', error);
    return apiError('Gagal memproses produksi: ' + (error.message || ''), 500);
  }
}
