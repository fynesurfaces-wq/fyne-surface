import { NextRequest, NextResponse } from 'next/server';

/** Public browsing stays open. Checkout and account pages require a customer session. */
export function middleware(request: NextRequest) {
  if (request.cookies.has('fyn_customer') || request.cookies.has('fyn_customer_refresh')) return NextResponse.next();
  const login = new URL('/login', request.url);
  login.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = { matcher: ['/checkout/:path*', '/account/:path*', '/order-success/:path*'] };
