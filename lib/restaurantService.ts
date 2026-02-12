const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
if (!KAKAO_API_KEY) {
    console.error('[RestaurantService] CRITICAL: KAKAO_API_KEY is not defined in environment variables.');
}
console.log(`[RestaurantService] Initialized. Key available: ${!!KAKAO_API_KEY}`);

async function fetchFromKakao(lat: number, lng: number, radius: number = 1500, keyword: string = '맛집') {
    try {
        const keywordsToTry = keyword === '맛집' ? ['식당', '맛집', '음식점'] : [keyword];
        let documents: any[] = [];

        for (const kw of keywordsToTry) {
            const url = `https://dapi.kakao.com/v2/local/search/keyword.json?y=${lat}&x=${lng}&radius=${radius}&query=${encodeURIComponent(kw)}&sort=distance&size=45`;
            console.log(`[Kakao] Trying keyword: ${kw} at ${lat},${lng} (radius: ${radius})`);

            const res = await fetch(url, {
                headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.documents && data.documents.length > 0) {
                    // Accumulate documents from all keywords
                    documents = [...documents, ...data.documents];
                    console.log(`[Kakao] Found ${data.documents.length} places for keyword "${kw}"`);
                }
            } else {
                const err = await res.text();
                console.error(`[Kakao] API Error for "${kw}": Status ${res.status}, Body: ${err}`);
            }
        }

        // Final fallback: Category Search (FD6 = Food) if still empty
        if (documents.length === 0) {
            console.log('[Kakao] No keyword results found. Falling back to category search (FD6)...');
            const catUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&y=${lat}&x=${lng}&radius=${radius}&sort=distance&size=45`;
            const catRes = await fetch(catUrl, {
                headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
            });
            if (catRes.ok) {
                const catData = await catRes.json();
                documents = catData.documents || [];
                console.log(`[Kakao] Category search success: Found ${documents.length} places`);
            } else {
                const err = await catRes.text();
                console.error(`[Kakao] API Error for category search (FD6): Status ${catRes.status}, Body: ${err}`);
            }
        }

        // Deduplicate using a Map with id as key
        const uniqueDocs = new Map();
        documents.forEach(doc => {
            if (!uniqueDocs.has(doc.id)) {
                uniqueDocs.set(doc.id, doc);
            }
        });

        return Array.from(uniqueDocs.values()).map((place: any) => {
            const catName = place.category_name || '';
            const catParts = catName.split(' > ');
            const category = catParts.length > 1 ? catParts[1] : (catParts[0] || '기타');

            return {
                id: place.id,
                name: place.place_name,
                category: category,
                lat: parseFloat(place.y),
                lng: parseFloat(place.x),
                distance: parseInt(place.distance),
                address: place.road_address_name || place.address_name,
                url: place.place_url,
                source: 'kakao'
            };
        });
    } catch (e) {
        console.error('[Kakao] Fatal Fetch Exception:', e);
        return [];
    }
}

// Fixed shared logic
export async function getRestaurants(lat: number, lng: number, menu?: string | null, radius: number = 1000) {
    // Default to CJ CheilJedang Center if not provided or very close to old default
    // We calibrate to exact Toegyero 307 coords: 37.5635, 127.0035
    const targetLat = lat === 37.5615 ? 37.56350 : lat;
    const targetLng = lng === 127.0034 ? 127.00350 : lng;

    try {
        const keyword = menu && menu !== '맛집' ? menu : '맛집';
        const stores = await fetchFromKakao(targetLat, targetLng, radius, keyword);

        // Final sorting by distance as safety
        const sortedStores = stores.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

        return {
            restaurants: sortedStores,
            source: 'kakao'
        };
    } catch (error) {
        console.error('Restaurant Service Error:', error);
        return { error: 'Failed to fetch restaurants' };
    }
}
