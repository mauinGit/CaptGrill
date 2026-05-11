import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'captgrill-secret');
    const { payload } = await jwtVerify(token, secret);

    // Block write operations for demo users
    if (payload.isDemo) {
      const method = request.method;
      const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      const isApiRoute = pathname.startsWith('/api/');
      const isAuthRoute = pathname.startsWith('/api/auth/');

      if (isWriteMethod && isApiRoute && !isAuthRoute) {
        return NextResponse.json(
          { error: '🔒 Akun demo hanya bisa melihat (view-only). Tidak bisa melakukan perubahan data.' },
          { status: 403 }
        );
      }
    }

    // Role-based access
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/kasir/transaksi', request.url));
    }
    if (pathname.startsWith('/kasir') && payload.role !== 'KASIR') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id.toString());
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.name);
    requestHeaders.set('x-user-demo', payload.isDemo ? 'true' : 'false');

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
