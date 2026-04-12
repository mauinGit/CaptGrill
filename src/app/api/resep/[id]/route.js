import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// UPDATE recipe
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, ingredientId, compositions } = body;

    // Delete old compositions and recreate
    await prisma.recipeComposition.deleteMany({
      where: { recipeId: parseInt(id) },
    });

    const recipe = await prisma.recipe.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(ingredientId && { ingredientId: parseInt(ingredientId) }),
        compositions: {
          create: (compositions || [])
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

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'UPDATE_RECIPE',
          detail: `Mengupdate resep: ${recipe.name}`,
        },
      });
    }

    return apiResponse(recipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    return apiError('Gagal mengupdate resep', 500);
  }
}

// DELETE recipe
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const recipe = await prisma.recipe.delete({
      where: { id: parseInt(id) },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'DELETE_RECIPE',
          detail: `Menghapus resep: ${recipe.name}`,
        },
      });
    }

    return apiResponse({ message: 'Resep berhasil dihapus' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return apiError('Gagal menghapus resep', 500);
  }
}
