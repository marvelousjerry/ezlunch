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
        const { title, artist, content } = body;

        if (!title || !artist) {
            return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 });
        }

        // Try to fetch real video ID
        const videoId = await searchYouTubeVideoId(`${artist} ${title}`);

        const newPost = await prisma.post.create({
            data: {
                id: videoId || undefined, // undefined lets Prisma use default(cuid()) if not found
                title,
                artist,
                content: content || '',
                author: '익명'
            }
        });

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error('Failed to create post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.post.delete({
            where: {
                id: id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
