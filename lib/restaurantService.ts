
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Realistic Franchise Data for Fallback
const FRANCHISES = [
    { name: '김밥천국', category: '분식' }, { name: '이디야커피', category: '카페' },
    { name: '스타벅스', category: '카페' }, { name: '메가커피', category: '카페' },
    { name: '투썸플레이스', category: '카페' }, { name: '홍콩반점0410', category: '중식' },
    { name: '교촌치킨', category: '치킨' }, { name: 'BHC치킨', category: '치킨' },
    { name: 'BBQ치킨', category: '치킨' }, { name: '엽기떡볶이', category: '분식' },
    { name: '신전떡볶이', category: '분식' }, { name: '명랑핫도그', category: '분식' },
    { name: '롯데리아', category: '패스트푸드' }, { name: '맘스터치', category: '패스트푸드' },
    { name: '버거킹', category: '패스트푸드' }, { name: '맥도날드', category: '패스트푸드' },
    { name: '써브웨이', category: '패스트푸드' }, { name: '한솥도시락', category: '한식' },
    { name: '본죽', category: '한식' }, { name: '새마을식당', category: '한식' },
    { name: '역전우동0410', category: '일식' }, { name: '국수나무', category: '한식' },
    { name: '김가네', category: '분식' }, { name: '파리바게뜨', category: '베이커리' },
    { name: '뚜레쥬르', category: '베이커리' }, { name: '배스킨라빈스', category: '디저트' },
    { name: '던킨', category: '디저트' }, { name: '설빙', category: '디저트' },
    { name: '채선당', category: '한식' }, { name: '샤브향', category: '한식' },
    { name: '쿠우쿠우', category: '일식' }, { name: '명륜진사갈비', category: '한식' }
];

async function fetchFromOSM(lat: number, lng: number, radius: number = 1500) {
    try {
        // Expanded query to catch more places
        const query = `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](around:${radius},${lat},${lng});
        node["amenity"="fast_food"](around:${radius},${lat},${lng});
        node["amenity"="cafe"](around:${radius},${lat},${lng});
        node["amenity"="bar"](around:${radius},${lat},${lng});
        node["amenity"="pub"](around:${radius},${lat},${lng});
        node["shop"="bakery"](around:${radius},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'EzLunch/1.0 (me@example.com)' // Prevent blocking
            }
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.elements.map((el: any) => ({
            id: `osm-${el.id}`,
            name: el.tags.name || el.tags['name:ko'] || '이름 없는 곳',
            category: el.tags.cuisine || el.tags.amenity || '식당',
            lat: el.lat,
            lng: el.lon,
            distance: null, // Calculated later
            rating: 0, // OSM doesn't have ratings
            address: null,
            isOpen: Math.random() > 0.3, // Mock open status (70% open)
            source: 'osm'
        })).filter((item: any) => item.name !== '이름 없는 곳');
    } catch (e) {
        console.warn('OSM Fetch Error:', e);
        return [];
    }
}

async function fetchFromOSMWithRetry(lat: number, lng: number) {
    // Try 1km first
    let data = await fetchFromOSM(lat, lng, 1000);
    if (data.length > 0) return data;

    // Try 3km
    data = await fetchFromOSM(lat, lng, 3000);
    if (data.length > 0) return data;

    // Try 5km (Wide area)
    return await fetchFromOSM(lat, lng, 5000);
}

// Helper function to get restaurants (shared logic)
export async function getRestaurants(lat: number, lng: number, menu: string | null = null, radius: number = 1500) {
    try {
        let results: any[] = [];
        let source = 'mock';

        // 1. Google Places API (Placeholder)
        if (GOOGLE_MAPS_API_KEY) {
            // ... 
        }

        // 2. OpenStreetMap (OSM)
        if (results.length === 0) {
            // Use the specific radius requested by the user
            const osmResults = await fetchFromOSM(lat, lng, radius);
            if (osmResults.length > 0) {
                results = osmResults;
                source = 'osm';
            }
        }

        // 3. Realistic Mock Data (Franchises & Context Aware)
        // If results from OSM are empty OR if we have a menu and OSM didn't cover it well (we can't easily know, so we fallback if empty filtered)
        // Actually, if OSM returns data but filtering removes everything, users get nothing.
        // So we should append mock data if filtering leads to 0 results.

        // Let's optimize: We get results (OSM or empty). We filter them.
        // If count is 0, we generate mock data.

        // First, filter existing results (if any)
        if (menu && menu !== '맛집') {
            results = results.filter(r =>
                r.name.includes(menu) ||
                (r.category && r.category.includes(menu)) ||
                // Expanded mapping
                (menu === '한식' && ['한식', '국밥', '찌개', '분식', '고기'].some(c => r.name.includes(c) || r.category?.includes(c))) ||
                (menu === '중식' && ['중식', '짜장', '짬뽕', '반점', '마라'].some(c => r.name.includes(c) || r.category?.includes(c))) ||
                (menu === '일식' && ['일식', '초밥', '우동', '돈까스', '소바', '라멘'].some(c => r.name.includes(c) || r.category?.includes(c))) ||
                (menu === '양식' && ['양식', '파스타', '피자', '스테이크', '버거'].some(c => r.name.includes(c) || r.category?.includes(c))) ||
                (menu === '카페' && ['카페', '커피', '디저트'].some(c => r.name.includes(c) || r.category?.includes(c)))
            );
        }

        // If no results after filtering (or no OSM data), generate Mock
        if (results.length === 0) {
            source = 'mock-forced';

            // Generate basic random franchises
            let mockCandidates = Array.from({ length: 15 }).map((_, index) => {
                const franchise = FRANCHISES[Math.floor(Math.random() * FRANCHISES.length)];
                // ... random offsets ...
                const latOffset = (Math.random() - 0.5) * 0.005;
                const lngOffset = (Math.random() - 0.5) * 0.005;
                return {
                    id: `mock-${index}`,
                    name: franchise.name,
                    category: franchise.category,
                    lat: lat + latOffset,
                    lng: lng + lngOffset,
                    distance: null,
                    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
                    address: '가상 주소',
                    isOpen: true,
                    source: 'mock-realistic'
                };
            });

            // If a specific menu was requested, Force-Generate matching items
            if (menu && menu !== '맛집') {
                const forcedMocks = [
                    { name: `맛있는 ${menu}`, category: menu },
                    { name: `${menu} 전문점`, category: menu },
                    { name: `소문난 ${menu}`, category: menu },
                    { name: `${menu}천국`, category: menu },
                    { name: `${menu}월드`, category: menu }
                ].map((item, idx) => ({
                    id: `mock-forced-${idx}`,
                    name: item.name,
                    category: item.category,
                    lat: lat + (Math.random() - 0.5) * 0.003,
                    lng: lng + (Math.random() - 0.5) * 0.003,
                    distance: null,
                    rating: (Math.random() * 1.0 + 4.0).toFixed(1),
                    address: `${menu} 맛집 거리`,
                    isOpen: true,
                    source: 'mock-forced'
                }));
                // Prepend forced mocks
                mockCandidates = [...forcedMocks, ...mockCandidates];
            }

            // Apply filter again to the mixed mock data (generic + forced)
            if (menu && menu !== '맛집') {
                results = mockCandidates.filter(r =>
                    r.name.includes(menu) ||
                    (r.category && r.category.includes(menu))
                );
            } else {
                results = mockCandidates;
            }
        }
        // ... (Distance calculation logic follows)

        // Calculate distance and Sort
        results = results.map(place => {
            const R = 6371e3;
            const φ1 = lat * Math.PI / 180;
            const φ2 = place.lat * Math.PI / 180;
            const Δφ = (place.lat - lat) * Math.PI / 180;
            const Δλ = (place.lng - lng) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;
            return { ...place, distance: Math.round(d) };
        }).sort((a, b) => a.distance - b.distance);

        return { restaurants: results, source };
    } catch (error) {
        console.error(error);
        return { restaurants: [], source: 'error', error: 'Internal Server Error' };
    }
}
