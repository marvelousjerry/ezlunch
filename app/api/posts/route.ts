import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Local storage path
const DATA_PATH = path.join(process.cwd(), 'data', 'posts.json');

// Helper to ensure data directory and file exist
function ensureDataFile() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify([]));
}

export async function GET() {
    try {
        ensureDataFile();
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const posts = JSON.parse(data);
        // Sort by newest
        const sorted = posts.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return NextResponse.json(sorted);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

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

export async function POST(request: Request) {
    try {
        ensureDataFile();
        const body = await request.json();
        const { title, artist, content, password } = body;

        if (!title || !artist) {
            return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 });
        }

        const videoId = await searchYouTubeVideoId(`${artist} ${title}`);

        const newPost = {
            id: Math.random().toString(36).substring(2, 11),
            videoId: videoId || null,
            title,
            artist,
            content: content || '',
            author: '익명',
            password: password || '0000',
            createdAt: new Date().toISOString()
        };

        const data = fs.readFileSync(DATA_PATH, 'utf8');
        const posts = JSON.parse(data);
        posts.push(newPost);
        fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2));

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error('Failed to create post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        ensureDataFile();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const password = searchParams.get('password');
        const isAdmin = searchParams.get('admin') === 'true';

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const data = fs.readFileSync(DATA_PATH, 'utf8');
        let posts = JSON.parse(data);

        const postIndex = posts.findIndex((p: any) => p.id === id);
        if (postIndex === -1) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        if (!isAdmin && posts[postIndex].password !== password) {
            return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 403 });
        }

        posts.splice(postIndex, 1);
        fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        ensureDataFile();
        const body = await request.json();
        const { id, title, artist, content, password, admin } = body;

        const data = fs.readFileSync(DATA_PATH, 'utf8');
        let posts = JSON.parse(data);

        const postIndex = posts.findIndex((p: any) => p.id === id);
        if (postIndex === -1) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        if (admin !== true && posts[postIndex].password !== password) {
            return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 403 });
        }

        posts[postIndex] = {
            ...posts[postIndex],
            title: title !== undefined ? title : posts[postIndex].title,
            artist: artist !== undefined ? artist : posts[postIndex].artist,
            content: content !== undefined ? content : posts[postIndex].content,
        };

        fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2));
        return NextResponse.json(posts[postIndex]);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
