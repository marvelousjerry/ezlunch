import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Using a placeholder or the key from env if provided
    const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`, {
            headers: {
                'Authorization': `KakaoAK ${KAKAO_API_KEY}`
            }
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Kakao API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
