const connectToDatabase = require('./db');

const fetchNews = async (category = 'all') => {
    let connection;
    try {
        connection = await connectToDatabase();

        let sql;
        let params;

        if (category === 'all') {
            sql = 'SELECT * FROM news ORDER BY published DESC';
            params = [];
        } else {
            sql = 'SELECT * FROM news WHERE category_name = ? ORDER BY published DESC';
            params = [category];
        }

        console.log('Executing SQL:', sql);
        console.log('With parameters:', params);

        const [rows] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Error fetching news:', error);
        throw error;
    } finally {
        // Ensure connection is closed
        if (connection) {
            try {
                await connection.end();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
};

module.exports = fetchNews;