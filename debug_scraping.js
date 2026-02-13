
const fs = require('fs');

async function captureHtml() {
    const query = encodeURIComponent('태극당');
    const url = `https://search.daum.net/search?w=tot&q=${query}`;

    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = await res.text();
        console.log(`HTML Length: ${html.length}`);

        fs.writeFileSync('debug_daum.html', html);
        console.log('Saved to debug_daum.html');

    } catch (e) {
        console.error('Error:', e);
    }
}

captureHtml();
