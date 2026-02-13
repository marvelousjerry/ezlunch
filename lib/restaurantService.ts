const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

// Categories to exclude from "Lunch" results
const DENY_CATEGORIES = ['카페', '커피전문점', '술집', '호프', '와인', '칵테일', '간식', '샐러드', '디저트', '제과', '베이커리', '떡카페', '차'];

/**
 * Fetches restaurants from Kakao API.
 * 1. Filters out non-meal categories (Cafe, Bar, etc).
 * 2. Supports "Delivery" search.
 */
async function fetchFromKakao(lat: number, lng: number, radius: number = 2000, keyword: string = '맛집') {
    if (!KAKAO_API_KEY) {
        console.error('[Kakao] No API Key provided!');
        return [];
    }

    let allDocuments: any[] = [];
    const searchKeywords = keyword === '배달' ? ['배달 맛집'] : [keyword];

    try {
        for (const kw of searchKeywords) {
            // We'll try up to 3 pages to get results
            const pages = [1, 2, 3];

            for (const page of pages) {
                const url = `https://dapi.kakao.com/v2/local/search/keyword.json?y=${lat}&x=${lng}&radius=${radius}&query=${encodeURIComponent(kw)}&sort=distance&size=15&page=${page}`;

                const res = await fetch(url, {
                    headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
                });

                if (!res.ok) continue;

                const data = await res.json();
                if (data.documents && data.documents.length > 0) {
                    allDocuments = [...allDocuments, ...data.documents];
                    if (data.meta?.is_end) break;
                } else {
                    break;
                }
            }
        }

        // If generic '맛집' search, also try Category Search (FD6 = Food) to ensure variety
        if (keyword === '맛집' && allDocuments.length < 30) {
            for (const page of [1, 2, 3]) {
                const catUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&y=${lat}&x=${lng}&radius=${radius}&sort=distance&size=15&page=${page}`;
                const catRes = await fetch(catUrl, { headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` } });
                if (catRes.ok) {
                    const catData = await catRes.json();
                    if (catData.documents) allDocuments = [...allDocuments, ...catData.documents];
                }
            }
        }

        // Deduplicate & Filter
        const uniqueMap = new Map();

        allDocuments.forEach(doc => {
            if (uniqueMap.has(doc.id)) return;

            const catName = doc.category_name || '';
            const catParts = catName.split(' > ');
            const rootCategory = catParts[0];
            const subCategory = catParts[1] || '';
            const leafCategory = catParts[catParts.length - 1];

            // Filter out Deny Categories
            // If keyword is explicitly '배달', we might be more lenient, but still exclude pure cafes if possible.
            // But if keyword is '맛집', strictly remove restricted categories.
            if (keyword !== '배달') {
                if (DENY_CATEGORIES.some(denied => catName.includes(denied))) return;
            }

            // Classification
            let category = subCategory || rootCategory || '기타';
            if (keyword === '배달') {
                category = '배달';
            } else {
                // Simplify category names
                if (category.includes('한식')) category = '한식';
                else if (category.includes('양식')) category = '양식';
                else if (category.includes('중식')) category = '중식';
                else if (category.includes('일식')) category = '일식';
                else if (category.includes('분식')) category = '분식';
                else if (category.includes('아시아')) category = '아시안';
                else if (category.includes('패스트푸드')) category = '패스트푸드';
                else if (category.includes('치킨')) category = '치킨';
                else category = '기타'; // Group others
            }

            uniqueMap.set(doc.id, {
                id: doc.id,
                name: doc.place_name,
                category: category,
                lat: parseFloat(doc.y),
                lng: parseFloat(doc.x),
                distance: parseInt(doc.distance),
                address: doc.road_address_name || doc.address_name,
                url: doc.place_url,
                phone: doc.phone,
                source: 'kakao'
            });
        });

        return Array.from(uniqueMap.values());
    } catch (e) {
        console.error('[Kakao] Global Fetch Error:', e);
        return [];
    }
}

export async function getRestaurantDetails(placeId: string, placeUrl: string, name?: string) {
    // Instead of scraping which is flaky, we prioritize Blog Search to find an image/description.

    let imageUrl: string | null = null;
    let description: string | null = null;
    let blogReviewUrl: string | null = null;

    if (KAKAO_API_KEY && name) {
        try {
            // Search for "[Name] [District] 맛집" to be more specific if possible, but here just Name
            const query = name + ' 맛집';
            const searchRes = await fetch(`https://dapi.kakao.com/v2/search/blog?query=${encodeURIComponent(query)}&size=3`, {
                headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
            });
            const searchData = await searchRes.json();

            if (searchData.documents && searchData.documents.length > 0) {
                // Find first item with a thumbnail
                const validDoc = searchData.documents.find((doc: any) => doc.thumbnail);
                if (validDoc) {
                    imageUrl = validDoc.thumbnail;
                    description = validDoc.title.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
                    blogReviewUrl = validDoc.url;
                } else {
                    // Fallback to first item even if no thumb? No, we need image.
                    if (searchData.documents[0]) {
                        description = searchData.documents[0].title.replace(/<[^>]*>?/gm, '');
                    }
                }
            }
        } catch (e) {
            console.error('Fallback image search failed:', e);
        }
    }

    return { imageUrl, description, blogReviewUrl };
}

export async function getRestaurants(lat: number, lng: number, menu?: string | null, radius: number = 1000) {
    // Standardize coordinates for CJ Center (Example Fix)
    const targetLat = (lat > 37.561 && lat < 37.562) ? 37.56350 : lat;
    const targetLng = (lng > 127.003 && lng < 127.004) ? 127.00350 : lng;

    try {
        const searchRadius = radius > 3000 ? 3000 : radius;
        let stores: any[] = [];

        // If menu is '배달', search for delivery directly.
        if (menu === '배달') {
            stores = await fetchFromKakao(targetLat, targetLng, searchRadius, '배달');
        } else {
            // Otherwise search for '맛집'
            stores = await fetchFromKakao(targetLat, targetLng, searchRadius, '맛집');
        }

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
