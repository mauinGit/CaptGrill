import prisma from '@/lib/prisma';
import { fullSyncToSheets, isGoogleSheetsConfigured } from '@/lib/googleSheets';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// POST — Full sync data ke Google Sheets
export async function POST(request) {
  try {
    // Hanya ADMIN yang boleh sync
    const role = request.headers.get('x-user-role');
    if (role !== 'ADMIN') {
      return apiError('Hanya admin yang boleh melakukan sync', 403);
    }

    if (!isGoogleSheetsConfigured()) {
      return apiError(
        'Google Sheets belum dikonfigurasi. Tambahkan GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL, dan GOOGLE_SHEETS_PRIVATE_KEY di file .env',
        400
      );
    }

    const body = await request.json();
    const { from, to } = body;

    if (!from || !to) {
      return apiError('Parameter from dan to harus diisi', 400);
    }

    const result = await fullSyncToSheets(prisma, from, to);

    // Log activity
    const userId = request.headers.get('x-user-id');
    if (userId) {
      await prisma.log.create({
        data: {
          userId: parseInt(userId),
          action: 'SYNC_SHEETS',
          detail: `Full sync Google Sheets: ${result.transactions} transaksi, ${result.expenses} pengeluaran (${from} s/d ${to})`,
        },
      });
    }

    return apiResponse({
      message: 'Sync ke Google Sheets berhasil!',
      synced: result,
    });
  } catch (error) {
    console.error('Sync sheets error:', error);
    return apiError('Gagal sync ke Google Sheets: ' + (error.message || ''), 500);
  }
}

// GET — Cek status konfigurasi Google Sheets
export async function GET() {
  return apiResponse({
    configured: isGoogleSheetsConfigured(),
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || null,
  });
}
