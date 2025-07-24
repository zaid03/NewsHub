const connecttodb = require('../src/backend/db.js');

(async () => {
    try {
        const connection = await connecttodb();
        console.log('Test: Database connection successful!');
        await connection.end();
    } catch (error) {
        console.error('Test: Database connection failed:', error);
    }
})();