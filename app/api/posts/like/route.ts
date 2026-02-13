import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { postId } = await request.json();

        // Get user ID from header (set by client)
        const userId = request.headers.get('x-user-id') || 'anonymous';

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        // Use transaction to ensure consistency
        const result = await prisma.$transaction(async (tx) => {
            const existingLike = await (tx as any).like.findUnique({
                where: {
                    postId_userId: { postId, userId }
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
                    data: { postId, userId }
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
