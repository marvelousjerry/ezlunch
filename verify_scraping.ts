
import * as cheerio from 'cheerio';

async function testScraping() {
    // The user provided URL
    const url = 'https://place.map.kakao.com/8552691';

    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = await res.text();
        const $ = cheerio.load(html);

        console.log('--- Page Title ---');
        console.log($('title').text());

        console.log('--- Meta og:image ---');
        console.log($('meta[property="og:image"]').attr('content'));

        console.log('--- Menu Items (Selector: .list_menu > li) ---');
        $('.list_menu > li').each((i, el) => {
            console.log($(el).text().replace(/\s+/g, ' ').trim());
        });

        console.log('--- Menu Items (Selector: .menu_info) - Alternate ---');
        $('.menu_info').each((i, el) => {
            console.log($(el).text().replace(/\s+/g, ' ').trim());
        });

        // Check if there is basic data in a script tag (often Kakao puts data in JSON format inside <script>)
        console.log('--- Script Tags (checking for JSON data) ---');
        $('script').each((i, el) => {
            const content = $(el).html() || '';
            if (content.includes('menuInfo') || content.includes('MENU_INFO')) {
                console.log(`Found menu data in script length: ${content.length}`);
                console.log(content.substring(0, 200) + '...');
            }
        });

    } catch (e) {
        console.error('Error:', e);
    }
}

testScraping();
