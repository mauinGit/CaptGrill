import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

// GET transactions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

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

    if (userId) {
      where.userId = parseInt(userId);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: { select: { name: true } },
        details: {
          include: { menu: { select: { name: true, price: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return apiError('Gagal mengambil data transaksi', 500);
  }
}

// CREATE transaction with auto stock reduction
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, discount, amountPaid, paymentMethod } = body;
    const userId = request.headers.get('x-user-id');

    if (!items || items.length === 0) {
      return apiError('Item transaksi tidak boleh kosong', 400);
    }

    if (!userId) {
      return apiError('User tidak teridentifikasi', 401);
    }

    // Calculate totals
    let totalPrice = 0;
    const itemDetails = [];

    for (const item of items) {
      const menu = await prisma.menu.findUnique({
        where: { id: parseInt(item.menuId) },
        include: {
          menuIngredients: {
            include: { ingredient: true },
          },
        },
      });

      if (!menu) {
        return apiError(`Menu dengan ID ${item.menuId} tidak ditemukan`, 404);
      }

      const subtotal = menu.price * item.quantity;
      totalPrice += subtotal;

      itemDetails.push({
        menuId: menu.id,
        quantity: item.quantity,
        subtotal,
        menuIngredients: menu.menuIngredients,
      });
    }

    const discountAmount = parseInt(discount) || 0;
    const finalPrice = totalPrice - discountAmount;
    const paid = parseInt(amountPaid) || finalPrice;

    // Date string for order number
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction first (orderNumber will be set after)
      const transaction = await tx.transaction.create({
        data: {
          orderNumber: `TEMP-${Date.now()}`,
          userId: parseInt(userId),
          totalPrice,
          discount: discountAmount,
          finalPrice,
          amountPaid: paid,
          paymentMethod: paymentMethod || 'Cash',
          status: 'COMPLETED',
          details: {
            create: itemDetails.map((item) => ({
              menuId: item.menuId,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
      });

      // Generate order number using the real transaction ID
      const orderNumber = `ORD${transaction.id}-${dateStr}`;

      // Update with real order number
      const updated = await tx.transaction.update({
        where: { id: transaction.id },
        data: { orderNumber },
        include: {
          details: {
            include: { menu: { select: { name: true } } },
          },
          user: { select: { name: true } },
        },
      });

      // Reduce ingredient stock (can go negative)
      for (const item of itemDetails) {
        for (const mi of item.menuIngredients) {
          await tx.ingredient.update({
            where: { id: mi.ingredientId },
            data: {
              stock: { decrement: mi.quantity * item.quantity },
            },
          });
        }
      }

      // Log
      await tx.log.create({
        data: {
          userId: parseInt(userId),
          action: 'CREATE_TRANSACTION',
          detail: `Transaksi ${orderNumber} - Total: Rp${finalPrice}`,
        },
      });

      return updated;
    });

    return apiResponse(result, 201);
  } catch (error) {
    console.error('Create transaction error:', error);
    return apiError('Gagal membuat transaksi: ' + (error.message || ''), 500);
  }
}

