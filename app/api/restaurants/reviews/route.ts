import { NextResponse } from 'next/server';

const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || !KAKAO_API_KEY) {
        return NextResponse.json({ error: 'Query and API key are required' }, { status: 400 });
    }

    try {
        // Search Blogs
        const blogRes = await fetch(`https://dapi.kakao.com/v2/search/blog?query=${encodeURIComponent(query)}&size=5`, {
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        const blogData = await blogRes.json();

        // Search Cafes
        const cafeRes = await fetch(`https://dapi.kakao.com/v2/search/cafe?query=${encodeURIComponent(query)}&size=5`, {
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        const cafeData = await cafeRes.json();

        const reviews = [
            ...(blogData.documents || []).map((doc: any) => ({ ...doc, type: 'blog' })),
            ...(cafeData.documents || []).map((doc: any) => ({ ...doc, type: 'cafe' }))
        ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        return NextResponse.json({ reviews });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
