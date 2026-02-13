const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

// Categories to exclude from "Lunch" results - MOVED TO FRONTEND DEFAULT SELECTION
// const DENY_CATEGORIES = ['카페', '커피전문점', '술집', '호프', '와인', '칵테일', '간식', '샐러드', '디저트', '제과', '베이커리', '떡카페', '차'];

/**
 * Fetches restaurants from Kakao API.
 * Fetches 5 pages to get maximum results.
 * Returns ALL categories (Frontend handles default selection).
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
            // Fetch 5 pages as requested
            const pages = [1, 2, 3, 4, 5];

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
        if (keyword === '맛집' && allDocuments.length < 45) {
            for (const page of [1, 2, 3]) {
                const catUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&y=${lat}&x=${lng}&radius=${radius}&sort=distance&size=15&page=${page}`;
                const catRes = await fetch(catUrl, { headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` } });
                if (catRes.ok) {
                    const catData = await catRes.json();
                    if (catData.documents) allDocuments = [...allDocuments, ...catData.documents];
                }
            }
        }

        // Deduplicate
        const uniqueMap = new Map();

        allDocuments.forEach(doc => {
            if (uniqueMap.has(doc.id)) return;

            const catName = doc.category_name || '';
            const catParts = catName.split(' > ');
            const rootCategory = catParts[0];
            const subCategory = catParts[1] || '';
            // const leafCategory = catParts[catParts.length - 1]; // No longer used

            // Classification Logic
            let category = subCategory || rootCategory || '기타';
            if (keyword === '배달') {
                category = '배달';
            } else {
                // Simplify category names for UI grouping
                if (category.includes('한식') || rootCategory === '한식') category = '한식';
                else if (category.includes('양식') || rootCategory === '양식') category = '양식';
                else if (category.includes('중식') || rootCategory === '중식') category = '중식';
                else if (category.includes('일식') || rootCategory === '일식') category = '일식';
                else if (category.includes('분식')) category = '분식';
                else if (category.includes('아시아')) category = '아시안';
                else if (category.includes('패스트푸드')) category = '패스트푸드';
                else if (category.includes('치킨')) category = '치킨';
                else if (category.includes('카페') || category.includes('커피')) category = '카페/디저트';
                else if (category.includes('술집') || category.includes('호프') || category.includes('와인') || category.includes('바')) category = '술집';
                else category = category; // Keep original if specific enough, otherwise '기타'
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


import * as cheerio from 'cheerio';

export async function getRestaurantDetails(placeId: string, placeUrl: string, name?: string, address?: string) {
    let imageUrl: string | null = null;
    let description: string | null = null;
    let blogReviewUrl: string | null = null;
    let rating: string | null = null;
    let reviewCount: string | null = null;

    // 1. Try to scrape data from Kakao Place URL (Highest Priority for Image/Rating)
    if (placeUrl) {
        try {
            // Kakao Map Place URL often redirects or requires headers.
            const res = await fetch(placeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (res.ok) {
                const html = await res.text();
                const $ = cheerio.load(html);

                // Meta Tags
                const ogImage = $('meta[property="og:image"]').attr('content');
                if (ogImage) imageUrl = ogImage;

                const ogDesc = $('meta[property="og:description"]').attr('content');
                if (ogDesc) description = ogDesc;

                // Attempt to find rating (Structure might vary, this is a best-effort based on common structures)
                // Note: Kakao often renders these via JS, so static HTML scraping might miss it.
                // We depend mostly on og:image here.
            }
        } catch (e) {
            console.error('Kakao Place Scraping Failed:', e);
        }
    }

    // 2. Fallback: Blog Search (If scraping didn't get an image)
    if (!imageUrl && KAKAO_API_KEY && name) {
        try {
            let query = name;
            if (address) {
                const parts = address.split(' ');
                if (parts.length > 2) {
                    query = `${parts[2]} ${name}`;
                } else if (parts.length > 1) {
                    query = `${parts[1]} ${name}`;
                }
            }

            const searchRes = await fetch(`https://dapi.kakao.com/v2/search/blog?query=${encodeURIComponent(query)}&size=3`, {
                headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
            });
            const searchData = await searchRes.json();

            if (searchData.documents && searchData.documents.length > 0) {
                const validDoc = searchData.documents.find((doc: any) => doc.thumbnail);
                if (validDoc) {
                    imageUrl = validDoc.thumbnail;
                    if (!description) description = validDoc.title.replace(/<[^>]*>?/gm, '');
                    blogReviewUrl = validDoc.url;
                }
            }

            // 3. Fallback: Image Search
            if (!imageUrl) {
                try {
                    const imgRes = await fetch(`https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(query)}&size=1`, {
                        headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
                    });
                    const imgData = await imgRes.json();
                    if (imgData.documents && imgData.documents.length > 0) {
                        imageUrl = imgData.documents[0].thumbnail_url;
                    }
                } catch (imgErr) {
                    console.error('Image search fallback failed', imgErr);
                }
            }

        } catch (e) {
            console.error('Fallback image search failed:', e);
        }
    }

    return { imageUrl, description, blogReviewUrl, rating, reviewCount };
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
