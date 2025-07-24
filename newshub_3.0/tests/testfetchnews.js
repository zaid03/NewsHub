const fetchNews = require('../src/backend/fetch_news');

(async () => {
    try {
        console.log('Testing fetchNews function...');

        // Test case 1: Fetch all news
        const allNews = await fetchNews('all', 5, 0); // Fetch 5 news items starting from offset 0
        console.log('Test Case 1: Fetch all news');
        console.log(allNews);

        // Test case 2: Fetch news from a specific category
        const categoryNews = await fetchNews('technology', 5, 0); // Fetch 5 news items from the "technology" category
        console.log('Test Case 2: Fetch news from "technology" category');
        console.log(categoryNews);

        // Test case 3: Fetch news with a different offset
        const offsetNews = await fetchNews('all', 5, 5); // Fetch 5 news items starting from offset 5
        console.log('Test Case 3: Fetch news with offset');
        console.log(offsetNews);

        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
})();