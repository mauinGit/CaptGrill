import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// UPDATE menu
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, category, image, isAvailable, ingredients } = body;

    // Update menu basic info
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseInt(price);
    if (category !== undefined) updateData.category = category;
    if (image !== undefined) updateData.image = image;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    // If ingredients provided, replace them
    if (ingredients) {
      await prisma.menuIngredient.deleteMany({
        where: { menuId: parseInt(id) },
      });

      if (ingredients.length > 0) {
        await prisma.menuIngredient.createMany({
          data: ingredients.map((ing) => ({
            menuId: parseInt(id),
            ingredientId: parseInt(ing.ingredientId),
            quantity: parseFloat(ing.quantity),
          })),
        });
      }
    }

    const menu = await prisma.menu.update({
      where: { id: parseInt(id) },
      data: updateData,
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
          action: 'UPDATE_MENU',
          detail: `Mengupdate menu: ${menu.name}`,
        },
      });
    }

    return apiResponse(menu);
  } catch (error) {
    console.error('Update menu error:', error);
    return apiError('Gagal mengupdate menu', 500);
  }
}

// DELETE menu
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const menu = await prisma.menu.delete({
      where: { id: parseInt(id) },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'DELETE_MENU',
          detail: `Menghapus menu: ${menu.name}`,
        },
      });
    }

    return apiResponse({ message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error('Delete menu error:', error);
    return apiError('Gagal menghapus menu', 500);
  }
}
