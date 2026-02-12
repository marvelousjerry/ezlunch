import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { username: 'admin' },
        });

        if (existingUser) {
            return NextResponse.json({ message: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash('ezdesign123!', 10);
        const user = await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
            },
        });

        return NextResponse.json({ message: 'Admin created', user: { id: user.id, username: user.username } });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create admin', details: error }, { status: 500 });
    }
}
