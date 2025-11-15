import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server';

// create an instance of Clerk middleware to initialize Clerk on the request
const clerk = clerkMiddleware();

export default async function middleware(req: NextRequest) {
  // run Clerk's middleware first - this ensures getAuth works and Clerk can validate the request
  // clerk middleware expects (req, event) signature; provide a placeholder event to satisfy the call
  const clerkResponse = await clerk(req as any, {} as any);
  if (clerkResponse) {
    // if Clerk middleware returned a Response, forward it
    return clerkResponse;
  }

  const { pathname } = req.nextUrl;

  // Allow Next internals, static assets and the home page without auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/' ||
    pathname.startsWith('/api/auth') // allow Clerk auth callbacks
  ) {
    return NextResponse.next();
  }

  const { userId } = getAuth(req);

  // Protect API routes: return 401 when unauthenticated
  if (pathname.startsWith('/api')) {
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return NextResponse.next();
  }

  // For page routes (non-home), redirect unauthenticated users back to home
  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    // include original path so client can show a friendly message/modal if desired
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals and static files
    "/((?!_next|static|[^?]*\\.(?:jpg|jpeg|png|webp|avif|gif|svg|css|js|map|ico)).*)",
    '/api/(.*)',
  ],
};
