import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Singleton instance

export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        // Fallback or empty if DB not ready (to prevent crash in dev if not set up)
        return NextResponse.json([]);
    }
}

// Helper to scrape YouTube video ID (Server-side)
async function searchYouTubeVideoId(query: string): Promise<string | null> {
    try {
        const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await res.text();
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        return match ? match[1] : null;
    } catch (e) {
        console.error('YouTube Scrape Error:', e);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, artist, content, password } = body;

        if (!title || !artist) {
            return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 });
        }

        // Try to fetch real video ID
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

        // If it's a field error (like password or videoId not existing in DB yet), 
        // we can't do much without a migration, but we should at least log it properly.
        const errorMessage = error.message || 'Failed to create post';

        return NextResponse.json({
            error: '게시글 저장에 실패했습니다. DB 동기화가 필요할 수 있습니다.',
            details: errorMessage
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const password = searchParams.get('password');
        const isAdmin = searchParams.get('admin') === 'true'; // Admin bypass

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Get post to check password (cast to any for fields added manually to schema)
        const post = await (prisma.post as any).findUnique({
            where: { id }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Verify password if not admin
        if (!isAdmin && post.password !== password) {
            return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, title, artist, content, password, admin } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Get post to check password
        const post = await (prisma.post as any).findUnique({
            where: { id }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Verify password if not admin
        if (admin !== true && post.password !== password) {
            return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
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
        console.error('Failed to update post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}
