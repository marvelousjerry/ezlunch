import { NextResponse } from 'next/server';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Hardcoded admin credentials for now (env vars recommended)
        const ADMIN_USER = process.env.ADMIN_USER || 'admin';
        const ADMIN_PASS = process.env.ADMIN_PASS || 'ezdesign123!';

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            // Create JWT Token
            const token = await signSession({ username, role: 'admin' });

            // Create response
            const response = NextResponse.json({ success: true });

            // Set HttpOnly Cookie
            response.cookies.set('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
