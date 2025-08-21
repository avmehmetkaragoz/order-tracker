import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Korunmayacak public path'ler
const publicPaths = ['/login', '/api/auth']

// Statik dosyalar ve Next.js internal path'leri
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/images',
  '/sw.js'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Statik dosyalar için middleware'i atla
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Public path'ler için middleware'i atla
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Authentication cookie'sini kontrol et
  const authCookie = request.cookies.get('auth-token')
  
  // Eğer authentication cookie'si yoksa login sayfasına yönlendir
  if (!authCookie || authCookie.value !== process.env.AUTH_SECRET) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Authentication başarılı, devam et
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Tüm request path'leri için çalış, aşağıdakiler hariç:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}