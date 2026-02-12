const KAKAO_API_KEY = process.env.KAKAO_API_KEY || '28876a44cae979a7702810fb96089304'; // Harmonized with location search

async function fetchFromKakao(lat: number, lng: number, radius: number = 1500, keyword: string = '맛집') {
    try {
        // We'll try Keyword search first, then Category search as fallback if generic
        const url = `https://dapi.kakao.com/v2/local/search/keyword.json?y=${lat}&x=${lng}&radius=${radius}&query=${encodeURIComponent(keyword)}&sort=distance&size=15`;

        console.log(`[Kakao] Fetching: ${keyword} at ${lat},${lng} (radius: ${radius})`);

        const res = await fetch(url, {
            headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
        });

        console.log(`[Kakao] Status: ${res.status}`);

        if (!res.ok) {
            const err = await res.text();
            console.error('[Kakao] API Error:', err);
            return [];
        }

        const data = await res.json();
        let documents = data.documents || [];

        // If no results for a generic search, try category search (FD6 for Food)
        if (documents.length === 0 && (keyword === '맛집' || keyword === '식당')) {
            console.log('[Kakao] No keyword results, trying category search (FD6)...');
            const catUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&y=${lat}&x=${lng}&radius=${radius}&sort=distance&size=15`;
            const catRes = await fetch(catUrl, {
                headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
            });
            if (catRes.ok) {
                const catData = await catRes.json();
                documents = catData.documents || [];
            }
        }

        console.log(`[Kakao] Found ${documents.length} places`);

        return documents.map((place: any) => {
            // Kakao category_name looks like "음식점 > 한식 > 육류,고기 > 삼겹살"
            // We want a clean category for the roulette
            const catName = place.category_name || '';
            const catParts = catName.split(' > ');
            const category = catParts.length > 1 ? catParts[1] : (catParts[0] || '기타');

            return {
                id: `kakao-${place.id}`,
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
        console.warn('[Kakao] Fetch Error:', e);
        return [];
    }
}

// Helper function to get restaurants (shared logic)
export async function getRestaurants(lat: number, lng: number, menu: string | null = null, radius: number = 1500) {
    try {
        let results: any[] = [];
        let source = 'kakao';

        // 1. Fetch from Kakao (Filter by menu if provided, otherwise search generally)
        const searchQuery = menu && menu !== '맛집' ? menu : '맛집';
        results = await fetchFromKakao(lat, lng, radius, searchQuery);

        // 2. If results are still empty and we had a specific menu, try searching generally for '맛집'
        if (results.length === 0 && searchQuery !== '맛집') {
            results = await fetchFromKakao(lat, lng, radius, '맛집');
        }

        // Final sorting by distance (redundant but safe)
        results = results.sort((a, b) => a.distance - b.distance);

        return { restaurants: results, source };
    } catch (error) {
        console.error(error);
        return { restaurants: [], source: 'error', error: 'Internal Server Error' };
    }
}
