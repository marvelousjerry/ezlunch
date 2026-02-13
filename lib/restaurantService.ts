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
    // Search for specific categories to maximize results (Kakao API limit per keyword is small)
    const searchKeywords = keyword === '배달'
        ? ['배달 맛집']
        : ['한식', '양식', '중식', '일식', '분식', '치킨', '패스트푸드', '맛집'];

    try {
        // Run fetches in parallel for speed
        const promises = searchKeywords.map(async (kw) => {
            let docs: any[] = [];
            // Fetch up to 3 pages per keyword (45 results per keyword)
            for (let page = 1; page <= 3; page++) {
                const url = `https://dapi.kakao.com/v2/local/search/keyword.json?y=${lat}&x=${lng}&radius=${radius}&query=${encodeURIComponent(kw)}&sort=distance&size=15&page=${page}`;
                try {
                    const res = await fetch(url, { headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` } });
                    if (!res.ok) break;
                    const data = await res.json();
                    if (data.documents && data.documents.length > 0) {
                        docs = [...docs, ...data.documents];
                        if (data.meta?.is_end) break;
                    } else {
                        break;
                    }
                } catch (e) { break; }
            }
            return docs;
        });

        const results = await Promise.all(promises);
        allDocuments = results.flat();


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
                else if (category.includes('카페') || category.includes('커피') || category.includes('디저트') || category.includes('제과') || category.includes('베이커리') || category.includes('떡카페') || category.includes('차') || category.includes('간식') || category.includes('샐러드')) category = '카페/디저트';
                else if (category.includes('술집') || category.includes('호프') || category.includes('와인') || category.includes('바') || category.includes('칵테일') || category.includes('포차')) category = '술집';
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
    let menuInfo: { name: string; price: string }[] = [];

    // 🚨 EMERGENCY FALLBACK: Hardcoded data for known difficult-to-scrape places (User specified)
    // ID 8552691 is Taegukdang
    if (placeId === '8552691' || (name && name.includes('태극당'))) {
        console.log('[Emergency] Using hardcoded data for Taegukdang');
        return {
            imageUrl: 'https://img1.kakaocdn.net/cthumb/local/C800x400.q50/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flocal%2FkakaomapPhoto%2Freview%2F8e0dfdc6dde458d389d03bc49f72ea7e84c3349c%3Foriginal',
            description: '80년 전통의 추억을 담은 빵과 모나카',
            blogReviewUrl: 'https://place.map.kakao.com/8552691',
            rating: '4.4',
            reviewCount: '3,900+',
            menuInfo: [
                { name: '모나카 아이스크림', price: '3,300원' },
                { name: '단팥빵', price: '3,300원' },
                { name: '야채사라다', price: '7,600원' },
                { name: '고방카스테라', price: '6,800원' },
                { name: '슈크림빵', price: '3,000원' }
            ]
        };
    }

    // 1. Priority 1: Kakao Image Search API (Most Reliable in Production)
    if (KAKAO_API_KEY && name) {
        try {
            // Try diverse queries to find a valid image
            const queries = [`${name} 음식`, `${name} 맛집`, `${name} 메뉴`, name];

            for (const query of queries) {
                if (imageUrl) break;

                console.log(`[API] Searching image for: ${query}`);
                const imgRes = await fetch(`https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(query)}&size=1`, {
                    headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
                });

                if (imgRes.ok) {
                    const imgData = await imgRes.json();
                    if (imgData.documents && imgData.documents.length > 0) {
                        imageUrl = imgData.documents[0].thumbnail_url;
                        console.log(`[API] Found image for ${name} via '${query}'`);
                    }
                } else {
                    console.warn(`[API] Image search failed for ${query}: ${imgRes.status}`);
                }
            }
        } catch (e) {
            console.warn('Image Search API failed:', e);
        }
    } else {
        console.warn('[API] Skipping Image Search: No API Key or Name');
    }

    // 2. Priority 2: Blog Search API (Good for thumbnails + deep linking)
    if (!imageUrl && KAKAO_API_KEY && name) {
        try {
            const searchRes = await fetch(`https://dapi.kakao.com/v2/search/blog?query=${encodeURIComponent(name)}&size=1`, {
                headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
            });
            const searchData = await searchRes.json();

            if (searchData.documents && searchData.documents.length > 0) {
                const validDoc = searchData.documents[0];
                if (validDoc?.thumbnail) {
                    imageUrl = validDoc.thumbnail;
                    if (!description) description = validDoc.title.replace(/<[^>]*>?/gm, '');
                    blogReviewUrl = validDoc.url;
                }
            }
        } catch (e) {
            console.warn('Blog Search API failed:', e);
        }
    }

    // 3. Fallback: Scraping (Least Reliable in Cloud Envs)
    if (!imageUrl && placeUrl) {
        try {
            // Try to scrape data from Kakao Place URL
            const res = await fetch(placeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                signal: AbortSignal.timeout(2000)
            });

            if (res.ok) {
                const html = await res.text();
                const $ = cheerio.load(html);

                // Meta Tags - Most reliable for main image and description
                const ogImage = $('meta[property="og:image"]').attr('content');
                if (ogImage) imageUrl = ogImage;

                const ogDesc = $('meta[property="og:description"]').attr('content');
                if (ogDesc) description = ogDesc;

                // Scrape Menu - Attempt multiple selectors
                $('.list_menu > li').each((_, el) => {
                    const name = $(el).find('.loss_word').text().trim();
                    const price = $(el).find('.price_menu').text().trim();
                    if (name) menuInfo.push({ name, price: price || '' });
                });

                // If list_menu failed, try another common selector
                if (menuInfo.length === 0) {
                    $('.menu_list > li').each((_, el) => {
                        const name = $(el).find('.menu_name').text().trim();
                        const price = $(el).find('.price').text().trim();
                        if (name) menuInfo.push({ name, price: price || '' });
                    });
                }

                menuInfo = menuInfo.map(item => ({
                    ...item,
                    price: item.price.replace(/[^0-9,]/g, '') + '원'
                })).filter(item => item.name).slice(0, 5);
            }
        } catch (e) {
            console.warn('Scraping fallback failed:', e);
        }
    }

    return { imageUrl, description, blogReviewUrl, rating, reviewCount, menuInfo };
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
