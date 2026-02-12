import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { postId } = await request.json();

        // Get client IP for unique voting (per place/device)
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        // Use transaction to ensure consistency
        const result = await prisma.$transaction(async (tx) => {
            const existingLike = await (tx as any).like.findUnique({
                where: {
                    postId_ip: { postId, ip }
                }
            });

            if (existingLike) {
                // Remove like
                await (tx as any).like.delete({
                    where: { id: existingLike.id }
                });
                const updatedPost = await (tx as any).post.update({
                    where: { id: postId },
                    data: { likes: { decrement: 1 } }
                });
                return { likes: updatedPost.likes, liked: false };
            } else {
                // Add like
                await (tx as any).like.create({
                    data: { postId, ip }
                });
                const updatedPost = await (tx as any).post.update({
                    where: { id: postId },
                    data: { likes: { increment: 1 } }
                });
                return { likes: updatedPost.likes, liked: true };
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Like toggle failed:', error);
        return NextResponse.json({ error: '좋아요 처리에 실패했습니다.', details: error.message }, { status: 500 });
    }
}
