import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET attendance records
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    const where = {};
    if (userId) where.userId = parseInt(userId);
    if (date) {
      where.date = new Date(date);
    } else if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { name: true, username: true } },
      },
      orderBy: { clockIn: 'desc' },
    });

    return apiResponse(attendances);
  } catch (error) {
    console.error('Get attendance error:', error);
    return apiError('Gagal mengambil data absensi', 500);
  }
}

// CREATE attendance
export async function POST(request) {
  try {
    const body = await request.json();
    const { photo, latitude, longitude, purpose } = body;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return apiError('User tidak teridentifikasi', 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendancePurpose = purpose || 'Shift 1';

    // Check if already attended today for this purpose
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date_purpose: {
          userId: parseInt(userId),
          date: today,
          purpose: attendancePurpose,
        },
      },
    });

    if (existing) {
      return apiError(`Anda sudah melakukan absensi "${attendancePurpose}" hari ini`, 400);
    }

    // Validate GPS distance
    const storeLat = parseFloat(process.env.STORE_LATITUDE || '-6.2');
    const storeLon = parseFloat(process.env.STORE_LONGITUDE || '106.8');
    const maxDist = parseFloat(process.env.MAX_ATTENDANCE_DISTANCE || '10');

    console.log("MASUK API");
    console.log("MAX DIST:", maxDist);

    // 🔥 TAMBAHKAN INI
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (!isNaN(userLat) && !isNaN(userLng)) {
      const R = 6371e3;
      const toRad = (x) => (x * Math.PI) / 180;

      const dLat = toRad(userLat - storeLat);
      const dLon = toRad(userLng - storeLon);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(storeLat)) *
          Math.cos(toRad(userLat)) *
          Math.sin(dLon / 2) ** 2;

      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      console.log("DISTANCE:", distance);

      if (distance > maxDist) {
        return apiError(
          `Lokasi Anda terlalu jauh (${Math.round(distance)}m, maks ${maxDist}m)`,
          400
        );
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: parseInt(userId),
        photo: photo || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        purpose: attendancePurpose,
        date: today,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    await prisma.log.create({
      data: {
        userId: parseInt(userId),
        action: 'ATTENDANCE',
        detail: `Absensi berhasil pada ${new Date().toLocaleTimeString('id-ID')}`,
      },
    });

    return apiResponse(attendance, 201);
  } catch (error) {
    console.error('Create attendance error:', error);
    return apiError('Gagal melakukan absensi', 500);
  }
}
