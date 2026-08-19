import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// UPDATE ingredient data (name, unit, minStock, category — NO stock field)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, unit, minStock, category } = body;

    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(unit && { unit }),
        ...(minStock !== undefined && { minStock: parseFloat(minStock) }),
        ...(category !== undefined && { category: category || null }),
        // NOTE: stock is intentionally NOT updated here — use PATCH for restock
      },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'UPDATE_INGREDIENT',
          detail: `Mengupdate data bahan: ${ingredient.name}`,
        },
      });
    }

    return apiResponse(ingredient);
  } catch (error) {
    console.error('Update ingredient error:', error);
    return apiError('Gagal mengupdate bahan', 500);
  }
}

// RESTOCK ingredient — adds to existing stock (not replace)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { addStock } = body;

    if (addStock === undefined || isNaN(parseFloat(addStock)) || parseFloat(addStock) <= 0) {
      return apiError('Jumlah tambah stok harus lebih dari 0', 400);
    }

    const current = await prisma.ingredient.findUnique({ where: { id: parseInt(id) } });
    if (!current) return apiError('Bahan tidak ditemukan', 404);

    const newStock = parseFloat(current.stock) + parseFloat(addStock);

    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: { stock: newStock },
    });

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'RESTOCK_INGREDIENT',
          detail: `Restock bahan: ${ingredient.name} +${addStock} ${ingredient.unit} (total: ${newStock} ${ingredient.unit})`,
        },
      });
    }

    return apiResponse(ingredient);
  } catch (error) {
    console.error('Restock ingredient error:', error);
    return apiError('Gagal melakukan restock', 500);
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
