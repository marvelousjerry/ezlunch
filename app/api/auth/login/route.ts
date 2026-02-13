import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Environment variables for admin credentials
        const ADMIN_USER = process.env.ADMIN_USER || 'admin';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ezdesign123!';

        const isValid = username === ADMIN_USER && password === ADMIN_PASSWORD;

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = jwt.sign({ id: 'admin-id', username: ADMIN_USER }, JWT_SECRET, {
            expiresIn: '1d',
        });

        // Session cookie (no maxAge)
        (await cookies()).set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Login failed', details: error }, { status: 500 });
    }
}
