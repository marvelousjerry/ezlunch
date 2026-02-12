const fetch = require('node-fetch');

async function testScrape(placeUrl) {
    console.log('Testing URL:', placeUrl);
    try {
        const res = await fetch(placeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await res.text();
        console.log('HTML Length:', html.length);

        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        console.log('Image Match:', imageMatch ? imageMatch[1] : 'NOT FOUND');

        const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
        console.log('Description Match:', descMatch ? descMatch[1] : 'NOT FOUND');

        // Check if there are other meta tags or titles
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');

    } catch (e) {
        console.error('Error:', e.message);
    }
}

// Test with a sample Kakao place ID (Toegyero 307 area - CJ Center nearby)
// Example ID for 'CJ 제일제당센터' is not a restaurant, let's find a restaurant.
// Let's use a common one if possible, or just dummy ID to see HTML structure
testScrape('https://place.map.kakao.com/10543662'); // Example: A restaurant near CJ
