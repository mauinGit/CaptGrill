import { google } from 'googleapis';

/**
 * Google Sheets API Utility — CaptGrill
 * 
 * Menyediakan fungsi untuk menulis, membaca, mengupdate, dan menghapus data
 * di Google Spreadsheet secara otomatis.
 * 
 * Env variables yang dibutuhkan:
 * - GOOGLE_SHEETS_SPREADSHEET_ID
 * - GOOGLE_SHEETS_CLIENT_EMAIL
 * - GOOGLE_SHEETS_PRIVATE_KEY
 */

let sheetsClient = null;

/**
 * Cek apakah Google Sheets sudah dikonfigurasi
 */
export function isGoogleSheetsConfigured() {
  return !!(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
  );
}

/**
 * Inisialisasi Google Sheets client (singleton)
 */
function getClient() {
  if (sheetsClient) return sheetsClient;

  if (!isGoogleSheetsConfigured()) {
    console.warn('[GoogleSheets] Belum dikonfigurasi. Skipping...');
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      // Private key dari .env perlu replace \\n menjadi newline actual
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const SPREADSHEET_ID = () => process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// ============================================================
// HEADER DEFINITIONS
// ============================================================

const HEADERS = {
  Transaksi: ['No Order', 'Tanggal & Waktu', 'Kasir', 'Item', 'Via Bayar', 'Shift', 'Subtotal', 'Diskon', 'Total'],
  Pengeluaran: ['ID', 'Tanggal', 'Kategori', 'Deskripsi', 'Nominal'],
  Absensi: ['ID', 'Nama Karyawan', 'Tanggal', 'Jam Masuk', 'Tujuan / Shift', 'Status Foto', 'Status Lokasi'],
  Gaji: ['ID', 'Nama Karyawan', 'Periode', 'Hari Shift', 'Rate Shift', 'Gaji Shift', 'Kali Produksi', 'Rate Produksi', 'Gaji Produksi', 'Total Gaji'],
};

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Pastikan sheet (tab) ada. Jika belum, buat baru dengan header.
 */
async function ensureSheet(sheetName) {
  const sheets = getClient();
  if (!sheets) return false;

  try {
    // Cek apakah sheet sudah ada
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID(),
    });

    const sheetExists = spreadsheet.data.sheets?.some(
      (s) => s.properties.title === sheetName
    );

    if (!sheetExists) {
      // Buat sheet baru
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID(),
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: sheetName },
            },
          }],
        },
      });

      // Tambahkan header row
      if (HEADERS[sheetName]) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID(),
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [HEADERS[sheetName]],
          },
        });

        // Bold & freeze header row
        const sheetId = await getSheetId(sheetName);
        if (sheetId !== null) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID(),
            requestBody: {
              requests: [
                {
                  repeatCell: {
                    range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                    cell: {
                      userEnteredFormat: {
                        textFormat: { bold: true },
                        backgroundColor: { red: 0.9, green: 0.95, blue: 0.9 },
                      },
                    },
                    fields: 'userEnteredFormat(textFormat,backgroundColor)',
                  },
                },
                {
                  updateSheetProperties: {
                    properties: {
                      sheetId,
                      gridProperties: { frozenRowCount: 1 },
                    },
                    fields: 'gridProperties.frozenRowCount',
                  },
                },
              ],
            },
          });
        }
      }

      console.log(`[GoogleSheets] Sheet "${sheetName}" dibuat.`);
    }

    return true;
  } catch (error) {
    console.error(`[GoogleSheets] Gagal memastikan sheet "${sheetName}":`, error.message);
    return false;
  }
}

/**
 * Dapatkan Sheet ID (numeric) dari sheet name
 */
async function getSheetId(sheetName) {
  const sheets = getClient();
  if (!sheets) return null;

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID(),
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties.title === sheetName
    );

    return sheet?.properties?.sheetId ?? null;
  } catch {
    return null;
  }
}

/**
 * Tambah baris baru ke sheet
 */
async function appendRow(sheetName, values, retries = 3) {
  const sheets = getClient();
  if (!sheets) return;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await ensureSheet(sheetName);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID(),
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [values],
        },
      });

      console.log(`[GoogleSheets] Baris ditambahkan ke "${sheetName}"`);
      return;
    } catch (error) {
      console.error(`[GoogleSheets] Gagal append ke "${sheetName}" (attempt ${attempt}/${retries}):`, error.message);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
}

/**
 * Cari baris berdasarkan value di kolom tertentu
 * @returns {number|null} Row index (1-based, including header)
 */
async function findRow(sheetName, columnIndex, searchValue) {
  const sheets = getClient();
  if (!sheets) return null;

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID(),
      range: `${sheetName}!A:Z`,
    });

    const rows = result.data.values || [];
    for (let i = 1; i < rows.length; i++) {  // Skip header (row 0)
      if (String(rows[i][columnIndex]) === String(searchValue)) {
        return i + 1; // 1-based row number
      }
    }
    return null;
  } catch (error) {
    console.error(`[GoogleSheets] Gagal mencari baris di "${sheetName}":`, error.message);
    return null;
  }
}

/**
 * Update baris tertentu
 */
async function updateRow(sheetName, rowNumber, values) {
  const sheets = getClient();
  if (!sheets) return;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID(),
      range: `${sheetName}!A${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [values],
      },
    });

    console.log(`[GoogleSheets] Baris ${rowNumber} di "${sheetName}" diupdate`);
  } catch (error) {
    console.error(`[GoogleSheets] Gagal update baris di "${sheetName}":`, error.message);
  }
}

/**
 * Hapus baris tertentu
 */
async function deleteRow(sheetName, rowNumber) {
  const sheets = getClient();
  if (!sheets) return;

  try {
    const sheetId = await getSheetId(sheetName);
    if (sheetId === null) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID(),
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1, // 0-based
              endIndex: rowNumber,
            },
          },
        }],
      },
    });

    console.log(`[GoogleSheets] Baris ${rowNumber} di "${sheetName}" dihapus`);
  } catch (error) {
    console.error(`[GoogleSheets] Gagal hapus baris di "${sheetName}":`, error.message);
  }
}

/**
 * Tulis ulang seluruh sheet (untuk full sync)
 */
async function writeFullSheet(sheetName, allRows) {
  const sheets = getClient();
  if (!sheets) return;

  try {
    await ensureSheet(sheetName);

    const headers = HEADERS[sheetName] || [];
    const data = [headers, ...allRows];

    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID(),
      range: `${sheetName}!A:Z`,
    });

    // Write all data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID(),
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: data },
    });

    console.log(`[GoogleSheets] Full sync "${sheetName}" selesai (${allRows.length} baris)`);
  } catch (error) {
    console.error(`[GoogleSheets] Gagal full sync "${sheetName}":`, error.message);
    throw error;
  }
}

// ============================================================
// HIGH-LEVEL SYNC FUNCTIONS
// ============================================================

/**
 * Shift helper
 */
function getShift(createdAt) {
  const hour = new Date(createdAt).getHours();
  return hour >= 6 && hour < 15 ? 'Shift 1' : 'Shift 2';
}

/**
 * Sync satu transaksi baru ke Google Sheets (fire-and-forget)
 */
export function syncTransactionToSheet(transaction) {
  if (!isGoogleSheetsConfigured()) return;

  // Fire and forget — jangan await agar tidak blocking response
  const items = transaction.details?.map((d) => `${d.menu?.name} x${d.quantity}`).join(', ') || '-';
  const dateStr = new Date(transaction.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  appendRow('Transaksi', [
    transaction.orderNumber || `#${transaction.id}`,
    dateStr,
    transaction.user?.name || '-',
    items,
    transaction.paymentMethod || 'Cash',
    getShift(transaction.createdAt),
    transaction.totalPrice,
    transaction.discount || 0,
    transaction.finalPrice,
  ]).catch((err) => console.error('[GoogleSheets] Sync transaksi gagal:', err.message));
}

/**
 * Sync satu pengeluaran baru ke Google Sheets (fire-and-forget)
 */
export function syncExpenseToSheet(expense) {
  if (!isGoogleSheetsConfigured()) return;

  const dateStr = new Date(expense.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });

  appendRow('Pengeluaran', [
    expense.id,
    dateStr,
    expense.category,
    expense.description || '-',
    expense.amount,
  ]).catch((err) => console.error('[GoogleSheets] Sync pengeluaran gagal:', err.message));
}

/**
 * Update pengeluaran di Google Sheets (fire-and-forget)
 */
export function updateExpenseInSheet(expense) {
  if (!isGoogleSheetsConfigured()) return;

  (async () => {
    try {
      const rowNumber = await findRow('Pengeluaran', 0, String(expense.id));
      if (rowNumber) {
        const dateStr = new Date(expense.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
        await updateRow('Pengeluaran', rowNumber, [
          expense.id,
          dateStr,
          expense.category,
          expense.description || '-',
          expense.amount,
        ]);
      }
    } catch (err) {
      console.error('[GoogleSheets] Update pengeluaran gagal:', err.message);
    }
  })();
}

/**
 * Hapus pengeluaran dari Google Sheets (fire-and-forget)
 */
export function deleteExpenseFromSheet(expenseId) {
  if (!isGoogleSheetsConfigured()) return;

  (async () => {
    try {
      const rowNumber = await findRow('Pengeluaran', 0, String(expenseId));
      if (rowNumber) {
        await deleteRow('Pengeluaran', rowNumber);
      }
    } catch (err) {
      console.error('[GoogleSheets] Hapus pengeluaran gagal:', err.message);
    }
  })();
}

/**
 * Full sync semua data ke Google Sheets
 * Digunakan untuk sinkronisasi awal atau perbaikan data
 */
export async function fullSyncToSheets(prisma, from, to) {
  if (!isGoogleSheetsConfigured()) {
    throw new Error('Google Sheets belum dikonfigurasi. Isi GOOGLE_SHEETS_* di file .env');
  }

  const startDate = new Date(from);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(to);
  endDate.setHours(23, 59, 59, 999);

  // Sync Transaksi
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
    },
    include: {
      user: { select: { name: true } },
      details: {
        include: { menu: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const txRows = transactions.map((t) => {
    const items = t.details?.map((d) => `${d.menu?.name} x${d.quantity}`).join(', ') || '-';
    const dateStr = new Date(t.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    return [
      t.orderNumber || `#${t.id}`,
      dateStr,
      t.user?.name || '-',
      items,
      t.paymentMethod || 'Cash',
      getShift(t.createdAt),
      t.totalPrice,
      t.discount || 0,
      t.finalPrice,
    ];
  });

  await writeFullSheet('Transaksi', txRows);

  // Sync Pengeluaran
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  const exRows = expenses.map((e) => {
    const dateStr = new Date(e.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    return [e.id, dateStr, e.category, e.description || '-', e.amount];
  });

  await writeFullSheet('Pengeluaran', exRows);

  // Sync Absensi
  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  });

  const attRows = attendances.map((a) => {
    const dateStr = new Date(a.date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    const timeStr = new Date(a.clockIn).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
    return [
      a.id,
      a.user?.name || '-',
      dateStr,
      timeStr,
      a.purpose || 'Shift 1',
      a.photo ? 'Ada' : '-',
      a.latitude && a.longitude ? 'Valid' : 'N/A',
    ];
  });

  await writeFullSheet('Absensi', attRows);

  // Sync Gaji
  const fromPeriod = from.substring(0, 7);
  const toPeriod = to.substring(0, 7);
  const salaries = await prisma.salary.findMany({
    where: {
      period: { gte: fromPeriod, lte: toPeriod },
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const salaryRows = salaries.map((s) => [
    s.id,
    s.user?.name || '-',
    s.period,
    s.shiftDays || 0,
    s.shiftRate || s.dailyRate || 0,
    s.gajiShift || 0,
    s.produksiDays || 0,
    s.produksiRate || 0,
    s.gajiProduksi || 0,
    s.totalSalary,
  ]);

  await writeFullSheet('Gaji', salaryRows);

  return {
    transactions: txRows.length,
    expenses: exRows.length,
    attendances: attRows.length,
    salaries: salaryRows.length,
  };
}
