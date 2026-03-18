import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const DEMO_AUTH_COOKIE = 'crispy_demo_auth';

export function proxy(request: NextRequest) {
    const isAuthenticated =
        request.cookies.get(DEMO_AUTH_COOKIE)?.value === '1';

    if (isAuthenticated) {
        return NextResponse.next();
    }

    const loginUrl = new URL('/login', request.url);
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
