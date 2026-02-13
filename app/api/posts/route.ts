import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function searchYouTubeVideoId(query: string) {
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const res = await fetch(searchUrl);
        const html = await res.text();
        const match = html.match(/"videoId":"([^"]+)"/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Check which posts are liked by the current user
        const postsWithLiked = await Promise.all(posts.map(async (post) => {
            const like = await (prisma.like as any).findUnique({
                where: {
                    postId_ip: { postId: post.id, ip }
                }
            });
            return {
                ...post,
                liked: !!like
            };
        }));

        return NextResponse.json(postsWithLiked);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, artist, content, password } = body;

        if (!title || !artist) {
            return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 });
        }

        const fetchedVideoId = await searchYouTubeVideoId(`${artist} ${title}`);

        const newPost = await (prisma.post as any).create({
            data: {
                videoId: fetchedVideoId || null,
                title,
                artist,
                content: content || '',
                author: '익명',
                password: password || '0000'
            }
        });

        return NextResponse.json(newPost, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create post:', error);
        return NextResponse.json({
            error: '게시글 저장에 실패했습니다.',
            details: error.message
        }, { status: 500 });
    }
}

import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

// ... (keep GET and POST)

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const password = searchParams.get('password');

        // Securely check for admin session
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;
        const isAdmin = token ? await verifySession(token) : false;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const post = await (prisma.post as any).findUnique({
            where: { id }
        });

        if (!post) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        if (!isAdmin && post.password !== password) {
            return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 403 });
        }

        await prisma.post.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, title, artist, content, password } = body;

        // Securely check for admin session
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token')?.value;
        const isAdmin = token ? await verifySession(token) : false;

        const post = await (prisma.post as any).findUnique({
            where: { id }
        });

        if (!post) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        if (!isAdmin && post.password !== password) {
            return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 403 });
        }

        const updatedPost = await (prisma.post as any).update({
            where: { id },
            data: {
                title: title !== undefined ? title : post.title,
                artist: artist !== undefined ? artist : post.artist,
                content: content !== undefined ? content : post.content,
            }
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
