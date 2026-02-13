import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Check if the path is protected (/admin/*)
    if (pathname.startsWith('/admin')) {
        // Allow access to login page
        if (pathname === '/admin/login') {
            const token = request.cookies.get('admin_token')?.value;
            // If already logged in, redirect to dashboard
            if (token && await verifySession(token)) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }

        // Check for session cookie
        const token = request.cookies.get('admin_token')?.value;
        const session = token ? await verifySession(token) : null;

        // If no valid session, redirect to login
        if (!session) {
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
