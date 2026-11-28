import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// SIMPAN URUTAN bahan hasil "Atur Urutan" (tekan-tahan & geser).
// Body: { order: [idBahan, ...] } sesuai urutan tampil yang baru.
export async function PUT(request) {
  try {
    const { order } = await request.json();

    if (!Array.isArray(order) || order.length === 0) {
      return apiError('Urutan bahan tidak boleh kosong', 400);
    }

    const ids = order.map((id) => parseInt(id, 10));
    if (ids.some((id) => !Number.isInteger(id)) || new Set(ids).size !== ids.length) {
      return apiError('Data urutan bahan tidak valid', 400);
    }

    // Pastikan semua bahan memang ada sebelum mengubah apa pun
    const found = await prisma.ingredient.count({ where: { id: { in: ids } } });
    if (found !== ids.length) {
      return apiError('Sebagian bahan tidak ditemukan. Muat ulang halaman lalu coba lagi.', 400);
    }

    // Satu query untuk semua bahan (atomik & cepat, database ada di luar negeri)
    const orders = ids.map((_, index) => index + 1);
    await prisma.$executeRaw`
      UPDATE "ingredients" AS i
      SET "sortOrder" = o.ord
      FROM unnest(${ids}::int[], ${orders}::int[]) AS o(id, ord)
      WHERE i."id" = o.id
    `;

    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId, 10),
          action: 'REORDER_INGREDIENT',
          detail: `Mengatur ulang urutan ${ids.length} bahan`,
        },
      });
    }

    return apiResponse({ message: 'Urutan bahan berhasil disimpan' });
  } catch (error) {
    console.error('Reorder ingredients error:', error);
    return apiError('Gagal menyimpan urutan bahan', 500);
  }
}
