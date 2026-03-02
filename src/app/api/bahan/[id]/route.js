import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// UPDATE ingredient
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, unit, stock, minStock } = body;

    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(unit && { unit }),
        ...(stock !== undefined && { stock: parseFloat(stock) }),
        ...(minStock !== undefined && { minStock: parseFloat(minStock) }),
      },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'UPDATE_INGREDIENT',
          detail: `Mengupdate bahan: ${ingredient.name}`,
        },
      });
    }

    return apiResponse(ingredient);
  } catch (error) {
    console.error('Update ingredient error:', error);
    return apiError('Gagal mengupdate bahan', 500);
  }
}

// DELETE ingredient
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const ingredient = await prisma.ingredient.delete({
      where: { id: parseInt(id) },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'DELETE_INGREDIENT',
          detail: `Menghapus bahan: ${ingredient.name}`,
        },
      });
    }

    return apiResponse({ message: 'Bahan berhasil dihapus' });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    return apiError('Gagal menghapus bahan', 500);
  }
}
