const cheerio = require('cheerio');

async function testScraping() {
    // Final attempt: JSON API with precise Referer
    const placeId = '8552691';
    const url = `https://place.map.kakao.com/main/v/${placeId}`;

    console.log(`Fetching JSON API (Final Try): ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `https://place.map.kakao.com/${placeId}`,
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`First 100 chars: ${text.substring(0, 100)}`);

        try {
            const data = JSON.parse(text);
            console.log('--- API Response Data ---');
            console.log('Name:', data.basicInfo?.placenamefull);
            console.log('Main Photo:', data.basicInfo?.mainphotourl);

            if (data.menuInfo) {
                console.log(`--- Menu Info (${data.menuInfo.menuList.length} items) ---`);
                data.menuInfo.menuList.forEach(m => {
                    console.log(`- ${m.menu}: ${m.price}`);
                });
            }
        } catch (e) {
            console.log('Not valid JSON');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

testScraping();
