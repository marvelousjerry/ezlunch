import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Mock auth for prototype stability
        const isValid = username === 'admin' && password === 'ezdesign123!';

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = jwt.sign({ id: 'admin-id', username: 'admin' }, JWT_SECRET, {
            expiresIn: '1d',
        });

        (await cookies()).set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Login failed', details: error }, { status: 500 });
    }
}
