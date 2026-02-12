import { NextResponse } from 'next/server';
import { getRestaurants } from '@/lib/restaurantService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');
    const menu = searchParams.get('menu');
    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    const radius = radiusStr ? parseInt(radiusStr) : 1500;

    try {
        // 1. Call the logic directly to avoid self-fetch issues
        const data = await getRestaurants(parseFloat(lat), parseFloat(lng), menu, radius);

        if (data.error) throw new Error(data.error);
        const restaurants = data.restaurants || [];

        // 2. Return Store Objects directly
        // Deduplicate by name to avoid showing same store multiple times in roulette if data has duplicates
        const uniqueStores = new Map();

        restaurants.forEach((r: any) => {
            if (!uniqueStores.has(r.name)) {
                uniqueStores.set(r.name, {
                    id: r.id,
                    name: r.name,
                    category: r.category || '기타'
                });
            }
        });

        const storeList = Array.from(uniqueStores.values());

        // 3. Fallback if scan finds too few
        if (storeList.length < 5) {
            const fallbacks = [
                { id: 'fb-1', name: '김밥천국', category: '분식' },
                { id: 'fb-2', name: '스타벅스', category: '카페' },
                { id: 'fb-3', name: '맥도날드', category: '패스트푸드' },
                { id: 'fb-4', name: '홍콩반점0410', category: '중식' },
                { id: 'fb-5', name: '교촌치킨', category: '치킨' }
            ];
            fallbacks.forEach(f => {
                if (!uniqueStores.has(f.name)) storeList.push(f);
            });
        }

        return NextResponse.json({
            stores: storeList,
            count: storeList.length,
            source: data.source // Pass source to frontend
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
    }
}
