import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login' || path === '/register';
  const token = request.cookies.get('token')?.value || '';
  const userData = request.cookies.get('userData')?.value || '';

  // If accessing login/register while already logged in
  if (isPublicPath && token) {
    try {
      const user = JSON.parse(userData);
      // Redirect based on role
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      } else if (user.role === 'pengurus') {
        return NextResponse.redirect(new URL('/dashboard/pengurus', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard/mahasiswa', request.url));
      }
    } catch (error) {
      // If userData is invalid, clear cookies and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('userData');
      return response;
    }
  }

  // If accessing protected path without auth
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based access control
  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      
      // Admin routes protection
      if (path.startsWith('/dashboard/admin') && user.role !== 'admin') {
        if (user.role === 'pengurus') {
          return NextResponse.redirect(new URL('/dashboard/pengurus', request.url));
        } else {
          return NextResponse.redirect(new URL('/dashboard/mahasiswa', request.url));
        }
      }

      // Pengurus routes protection
      if (path.startsWith('/dashboard/pengurus') && user.role !== 'pengurus') {
        if (user.role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        } else {
          return NextResponse.redirect(new URL('/dashboard/mahasiswa', request.url));
        }
      }

      // Mahasiswa routes protection
      if (path.startsWith('/dashboard/mahasiswa') && user.role !== 'mahasiswa') {
        if (user.role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        } else {
          return NextResponse.redirect(new URL('/dashboard/pengurus', request.url));
        }
      }
    } catch (error) {
      // If userData is invalid, clear cookies and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('userData');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};