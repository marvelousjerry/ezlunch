const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

/**
 * Fetches restaurants from Kakao API using pagination to overcome the 15-result limit.
 */
async function fetchFromKakao(lat: number, lng: number, radius: number = 2000, keyword: string = '맛집') {
    if (!KAKAO_API_KEY) {
        console.error('[Kakao] No API Key provided!');
        return [];
    }

    let allDocuments: any[] = [];

    try {
        // We'll try up to 4 pages to get up to 60 results (15 per page)
        const pages = [1, 2, 3, 4];

        for (const page of pages) {
            const url = `https://dapi.kakao.com/v2/local/search/keyword.json?y=${lat}&x=${lng}&radius=${radius}&query=${encodeURIComponent(keyword)}&sort=distance&size=15&page=${page}`;

            console.log(`[Kakao] Fetching page ${page} for "${keyword}" at ${lat},${lng}`);

            const res = await fetch(url, {
                headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
            });

            if (!res.ok) {
                const err = await res.text();
                console.error(`[Kakao] Page ${page} failed: ${res.status} ${err}`);
                break; // Stop if a page fails
            }

            const data = await res.json();
            if (data.documents && data.documents.length > 0) {
                allDocuments = [...allDocuments, ...data.documents];
                if (data.meta?.is_end) break; // No more results
            } else {
                break;
            }
        }

        // Fallback to category search (FD6) if keyword search returned almost nothing
        if (allDocuments.length < 5) {
            console.log('[Kakao] Keyword search too sparse. Trying Category Search (FD6)...');
            for (const page of [1, 2]) {
                const catUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&y=${lat}&x=${lng}&radius=${radius}&sort=distance&size=15&page=${page}`;
                const catRes = await fetch(catUrl, {
                    headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
                });
                if (catRes.ok) {
                    const catData = await catRes.json();
                    if (catData.documents) {
                        allDocuments = [...allDocuments, ...catData.documents];
                        if (catData.meta?.is_end) break;
                    }
                }
            }
        }

        // Deduplicate
        const uniqueMap = new Map();
        allDocuments.forEach(doc => {
            if (!uniqueMap.has(doc.id)) {
                uniqueMap.set(doc.id, doc);
            }
        });

        return Array.from(uniqueMap.values()).map((place: any) => {
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
        console.error('[Kakao] Global Fetch Error:', e);
        return [];
    }
}

export async function getRestaurants(lat: number, lng: number, menu?: string | null, radius: number = 1000) {
    // Standardize coordinates for CJ Center
    const targetLat = (lat > 37.561 && lat < 37.562) ? 37.56350 : lat;
    const targetLng = (lng > 127.003 && lng < 127.004) ? 127.00350 : lng;

    try {
        // Use fixed radius of 3000 for the initial scan to get everything, 
        // the frontend will filter locally.
        const searchRadius = radius > 3000 ? 3000 : radius;
        const keyword = (menu && menu !== '맛집') ? menu : '맛집';

        const stores = await fetchFromKakao(targetLat, targetLng, searchRadius, keyword);
        const sortedStores = stores.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

        return {
            restaurants: sortedStores,
            source: 'kakao'
        };
    } catch (error) {
        console.error('Restaurant Service Error:', error);
        return { error: 'Internal fetch error' };
    }
}
