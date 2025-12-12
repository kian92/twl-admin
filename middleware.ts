import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get locale from cookie
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';

  // Create response
  const response = NextResponse.next();

  // Add locale to request headers for next-intl
  response.headers.set('x-next-intl-locale', locale);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
