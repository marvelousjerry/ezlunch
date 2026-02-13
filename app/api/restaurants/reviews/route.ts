import { NextResponse } from 'next/server';

const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const name = searchParams.get('name');
    const address = searchParams.get('address');

    if (!KAKAO_API_KEY) {
        return NextResponse.json({ error: 'API key is required' }, { status: 500 });
    }

    let searchQuery = query;
    if (!searchQuery && name) {
        // Construct smart query: "[Name] [District] 맛집"
        let location = '맛집';
        if (address) {
            // Extract district (Gu/Dong) from address
            // Example: "서울 중구 명동2가 ..." -> "명동2가" or "중구"
            const parts = address.split(' ');
            if (parts.length > 1) {
                location = parts[1] + ' ' + (parts[2] || '');
            }
        }
        searchQuery = `${location} ${name} 맛집`;
    }

    if (!searchQuery) {
        return NextResponse.json({ error: 'Query or Name required' }, { status: 400 });
    }

    try {
        // Search Blogs
        const blogRes = await fetch(`https://dapi.kakao.com/v2/search/blog?query=${encodeURIComponent(searchQuery)}&size=5`, {
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });
        const blogData = await blogRes.json();

        // Search Cafes
        const cafeRes = await fetch(`https://dapi.kakao.com/v2/search/cafe?query=${encodeURIComponent(searchQuery)}&size=5`, {
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
