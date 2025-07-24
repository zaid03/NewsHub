require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetchNews = require('./fetch_news');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
const { connect } = require('http2');

const app = express();
const PORT = 3000;
app.use('/styles', express.static(path.join(__dirname, '../styles')));
app.use('/components',express.static(path.join(__dirname, '../components')));
app.use('/src', express.static(path.join(__dirname, '../src')));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(express.static(path.join(__dirname, '../')));


app.use(cors());
app.use(bodyParser.json());
app.use(
    session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true,
    })
);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 500,
    queueLimit: 0
});

// const connectToDatabase = async () => {
//     console.log('DB Config:', {
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME,
//     });
//     return mysql.createConnection({
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME,
//     });
// };

//sign route
app.post('/api/sign', async (req, res) => {
    console.log('Sign route hit');
    let connection;
    try {
        const { utilisateurr, email, gender, motdepasss} = req.body;

        const errors = {};

        if (!utilisateurr) errors.utilisateurr = "User name required.";
        if (!email) errors.threeemail = "Email required.";
        if (!gender) errors.gendererror = "Gender required.";
        if (!motdepasss) errors.motdepasss = "Password required.";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [existingUser] = await connection.execute('SELECT * FROM sign WHERE email = ?', [email]);
        console.log('Existing user check:', existingUser);

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                errors: {
                    twoemail: "this email is already registered.",
                }
              });
        }
        console.log('Validation errors:', errors);
        const [result] = await connection.execute(
            'INSERT INTO sign (utilisateur, email, gender, motdepass) VALUES (?, ?, ?, ?)',
            [utilisateurr, email, gender, motdepasss]
        );
        const user_id = result.insertId;
        req.session.user_id = user_id;
        res.json({ success: true, user_id ,message: "Inscription réussie." });
    } catch (error) {
        console.error('Error during sign-up:', error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

//login route
app.post('/api/login', async (req, res) => {
    let connection;
    try {
        const { utilisateur, motdepass } = req.body;

        if (!utilisateur || !motdepass) {
            return res.status(400).json({ success: false, message: 'utilisateur et mot de passe requis.' });
        }

        console.log('Login attempt:', { utilisateur, motdepass });
        connection = await pool.getConnection();

        const [rows] = await connection.execute(
            'SELECT id, utilisateur, gender, motdepass FROM sign WHERE utilisateur = ? AND  (disabled IS NULL OR disabled = 0)',
            [utilisateur]
        );
        console.log('Query result:', rows);

        if (rows.length > 0) {
            const user = rows[0];

            if (motdepass === user.motdepass) {
                req.session.user_id = user.id;
                req.session.utilisateur = user.utilisateur || '';

                console.log('User ID from database:', user.id);

                return res.json({
                    success: true,
                    user_id: user.id,
                    nom: user.utilisateur || '',
                    gender: user.gender || '',
                    message: 'Connexion réussie.',
                });
            } else {
                return res.status(401).json({ success: false, message: 'Mot de passe incorrect.' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'utilisateur introuvable.' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
    }finally {
        if (connection) connection.release();
    }
});

//news route for preferences
app.get('/api/news/preferences', async (req, res) => {
    let connection;
    try {
        const user_id = req.query.user_id;

        console.log('Query parameters:', { user_id });

        if (!user_id) {
            console.error('User ID is missing');
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        try {
            connection = await pool.getConnection();
            console.log('Database connection successful');
        } catch (connError) {
            console.error('Database connection failed:', connError);
            return res.status(500).json({ 
                success: false, 
                message: 'Database connection failed', 
                error: connError.message 
            });
        }

        const [preferencesRows] = await connection.execute(
            'SELECT preferences FROM preferences WHERE user_id = ?',
            [user_id]
        );

        if (preferencesRows.length === 0) {
            console.error('No preferences found for user:', user_id);
            return res.status(404).json({ success: false, message: 'No preferences found for this user.' });
        }

        const preferences = preferencesRows[0].preferences.split(',').map(pref => pref.trim());
        console.log('User preferences:', preferences);

        if (preferences.length === 0) {
            console.error('Preferences array is empty');
            return res.status(404).json({ success: false, message: 'No preferences found for this user.' });
        }

        const sql = `SELECT * FROM news WHERE category_name IN (${preferences.map(() => '?').join(', ')}) AND image is not null ORDER BY published DESC`;
        console.log('Executing SQL:', sql);
        console.log('With parameters:', preferences);

        const [newsRows] = await connection.execute(sql, preferences);

        console.log(`Found ${newsRows.length} news items`);
        return res.json({ success: true, news: newsRows });
    } catch (error) {
        console.error('Unhandled error in /api/news/preferences:', error);
        res.status(500).json({ 
            success: false, 
            message: 'News query failed', 
            error: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
});

//news route for other descover
app.get('/api/news/nonpreferences', async (req, res) => {
    console.log('Non-preferences route hit');
    let connection;
    try {
        console.log('Received request for /api/news/nonpreferences');
        const user_id = req.query.user_id;

        console.log('Query parameters:', { user_id });

        if (!user_id) {
            console.error('User ID is missing');
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        try {
            connection = await pool.getConnection();
            console.log('Database connection successful');
        } catch (connError) {
            console.error('Database connection failed:', connError);
            return res.status(500).json({ 
                success: false, 
                message: 'Database connection failed', 
                error: connError.message 
            });
        }

        const [preferencesRows] = await connection.execute(
            'SELECT preferences FROM preferences WHERE user_id = ?',
            [user_id]
        );

        if (preferencesRows.length === 0) {
            console.error('No preferences found for user:', user_id);
            return res.status(404).json({ success: false, message: 'No preferences found for this user.' });
        }

        const preferences = preferencesRows[0].preferences.split(',').map(pref => pref.trim());
        console.log('User preferences:', preferences);

        if (preferences.length === 0) {
            console.error('Preferences array is empty');
            return res.status(404).json({ success: false, message: 'No preferences found for this user.' });
        }

        const sql = `SELECT * FROM news WHERE category_name NOT IN (${preferences.map(() => '?').join(', ')}) AND image is not null ORDER BY published DESC`;
        console.log('Executing SQL:', sql);
        console.log('With parameters:', preferences);

        const [newsRows] = await connection.execute(sql, preferences);

        console.log(`Found ${newsRows.length} news items`);
        return res.json({ success: true, news: newsRows });
    } catch (error) {
        console.error('Unhandled error in /api/news/preferences:', error);
        res.status(500).json({ 
            success: false, 
            message: 'News query failed', 
            error: error.message 
        });
    } finally {
        if (connection) connection.release();
    }
});

//preferences route
app.post('/api/pref', async (req, res) => {
    console.log('Preferences route hit');
    let connection;
    try{
        const { user_id, preferences } = req.body;
        console.log('User ID:', user_id);
        console.log('Topics:', preferences); 

        if (!preferences) {
            return res.status(400).json({ success: false, message: 'Sujets requis.' });
        }

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID requis.' });
        }

        const preferencesString = Array.isArray(preferences) ? preferences.join(', ') : preferences;

        connection = await pool.getConnection();
        console.log('Database connected');

        await connection.execute(
            'INSERT INTO preferences (user_id, preferences) VALUES (?, ?)',
            [user_id, preferencesString]
        );
        res.json({ success: true, message: "Inscription réussie." });
    }catch (error) {
        console.error('Error during preferences submission:', error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    } finally {
        if (connection) connection.release();
    }
});

//notification route
app.post('/api/notification', async (req,res) => {
    console.log('Notification route hit');
    let connection;
    try{
        const { user_id, notifications } = req.body;
        console.log('User ID:', user_id);
        console.log('notifications:', notifications);

        if (!notifications) {
            return res.status(400).json({ success: false, message: 'Sujets requis.' });
        }

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID requis.' });
        }

        const notificationstring = Array.isArray(notifications) ? notifications.join(', ') : notifications;

        connection = await pool.getConnection();
        console.log('Database connected');

        await connection.execute(
            'INSERT INTO notification (user_id, notification) VALUES (?, ?)',
            [user_id, notificationstring]
        );
        res.json({ success: true, message: "Inscription réussie." });
    }catch(error){
        console.error('Error during notification submission:', error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
})

//route for following news 
app.post('/api/follow', async (req, res) => {
    console.log('Follow route hit');
    let connection;
    try {
        const { user_id, topics } = req.body;
        console.log('User ID:', user_id);
        console.log('Topics:', topics);

        if (!user_id || !topics) {
            return res.status(400).json({ success: false, message: 'User ID and Topics are required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const topicsString = Array.isArray(topics) ? topics.join(', ') : topics;
        await connection.execute(
            'INSERT INTO following_liste (user_id, topics) VALUES (?, ?)',
            [user_id, topicsString]
        );
        res.json({ success: true, message: "Followed successfully." });
    } catch (error) {
        console.error('Error during follow submission:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
});


//route to unfollow news
app.post('/api/unfollow', async (req, res) => {
    console.log('Unfollow route hit');
    let connection;
    try {
        const { user_id, topics } = req.body;
        console.log('User ID:', user_id);
        console.log('Topics:', topics);

        if (!user_id || !topics) {
            return res.status(400).json({ success: false, message: 'User ID and Topics are required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const topicsString = Array.isArray(topics) ? topics.join(', ') : topics;
        await connection.execute(
            'DELETE FROM following_liste WHERE user_id = ? AND topics = ?',
            [user_id, topicsString]
        );
        res.json({ success: true, message: "Unfollowed successfully." });
    } catch (error) {
        console.error('Error during unfollow submission:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
})


//route to get followed news
app.post('/api/followed', async (req, res) => {
    console.log('Followed route hit');
    let connection;
    try{
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'SELECT topics FROM following_liste WHERE user_id = ?',
            [user_id]
        );

        res.json({ success: true, followedTopics: rows });
    } catch (error) {
        console.error('Error during followed topics retrieval:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
})

//route to fetch news you're following
app.post('/api/news/following', async (req, res) => {
    console.log('Following news route hit');
    let connection;
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'SELECT topics FROM following_liste WHERE user_id = ?',
            [user_id]
        );

        console.log('Followed topics retrieved:', rows);
        if (rows.length === 0) {
            return res.json({ success: true, news: [] });
        }

        const followedTopics = rows.map(row => row.topics);
        console.log('Followed topics:', followedTopics);

        const sql = `SELECT * FROM news WHERE source IN (${followedTopics.map(() => '?').join(', ')}) and image is not null ORDER BY published DESC `;
        console.log('Executing SQL:', sql);
        
        const [newsRows] = await connection.execute(sql, followedTopics);
        
        res.json({ success: true, news: newsRows });
    } catch (error) {
        console.error('Error during following news retrieval:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
})

//route to fetch by categories
app.post('/api/categories', async (req, res) => {
    console.log('Categories route hit');
    let connection;
    try {
        const { category } = req.body;

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute('SELECT * FROM news where category_name = ? AND image IS NOT NULL ORDER BY published DESC', [category]

        );
        console.log('Categories retrieved:', rows);

        res.json({ success: true, categories: rows });
    } catch (error) {
        console.error('Error during categories retrieval:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
})

//api to fetch by source
app.post('/api/source', async (req, res) => {
    console.log('Source route hit');
    let connection;
    try {
        const { source } = req.body;

        if (!source) {
            return res.status(400).json({ success: false, message: 'Source is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute('SELECT * FROM news where source = ? AND image IS NOT NULL ORDER BY published DESC', [source]

        );
        console.log('Source retrieved:', rows);

        res.json({ success: true, source: rows });
    } catch (error) {
        console.error('Error during source retrieval:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
})

//route to fetch radio
app.post('/api/radio', async (req, res) =>{
    console.log("radio route hit");
    let connection;
    try{
        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute('SELECT * FROM radio');
        console.log('Radio stations retrieved:', rows);

        res.json({ success: true, radio: rows });
    } catch (error) {
        console.error('Error during radio stations retrieval:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
})

// route to fetch news by trending
app.get('/api/trending/bring', async (req, res) =>{
    console.log("Trending route hit");
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Database connected');
        const[rows] = await connection.execute('SELECT * FROM news WHERE trending is not null ORDER BY trending DESC limit 8');
        console.log('Trending news retrieved:', rows);

        res.json({ success: true, trending: rows });
    } catch (error) {
        console.error('Error during trending news retrieval:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
})

// route to send trending
app.post('/api/trending/add', async (req, res) => {
    console.log("Trending route hit");
    let connection;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ success: false, message: "Title is required." });
    }

    try {
        connection = await pool.getConnection();
        console.log("database connected");

        const [result] = await connection.execute(
            `UPDATE news 
             SET trending = 
                CASE 
                    WHEN trending IS NULL OR trending = '' THEN 1
                    ELSE trending + 1
                END
             WHERE title = ?`,
            [title]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "News item not found." });
        }

        console.log("Trending news updated successfully");
        res.json({ success: true, message: "Trending news updated successfully." });
    } catch (error) {
        console.error('Error during trending news update:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        if (connection) connection.release();
    }
});

// route to fetch news by newest
// app.get('/api/newest-added', async (req, res) => {
//     console.log("fetching newest news route hit");
//     let connection;

//     try {
//         connection = await pool.getConnection();
//         console.log('Database connected');
        
//         const [rows] = await connection.execute(
//             'SELECT * FROM news ORDER BY published DESC LIMIT 3'
//         );
//         console.log('Newest news retrieved:', rows);

//         res.json({ success: true, newest: rows });
//     } catch (error) {
//         console.error('Error during newest news retrieval:', error);
//         res.status(500).json({ success: false, message: "Internal server error." });
//     } finally {
//         if (connection) connection.release();
//     }
// });

//route to call trending news in order 
app.get('/api/trending-now', async (req, res) => {
    console.log("trending news route is hit");
    let connection;
    try{
        connection = await pool.getConnection();
        console.log("connected to databse");

        const [rows] = await connection.execute('SELECT * FROM news where ( trending is not null and trending <> 0 ) ORDER BY trending DESC');
        console.log("trending recieved: ", rows);

        res.json({success: true, trending: rows});
    } catch (e){
        console.log("error during trending news retrieval:", e);
        res.status(500).json({success: false, message: "Internal server error."});
    } finally {
        if (connection) connection.release();
    }
});

// route for inserting news into saved
app.post('/api/saved/add', async (req, res) => {
    console.log("insertion news into saved route hit");
    let connection;
    try {
        const { user_id, category_name, title, link, source, image, published, summary} = req.body;

        connection = await pool.getConnection();
        console.log("connected to database");
        const[rows] = await connection.execute('INSERT INTO saved (user_id, category_name, title, link, source, image, published, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, category_name, title,link, source, image, published, summary]);
        console.log('article has been saved:', rows);

        res.json({ success: true, saved: rows });
    }catch (error) {
        console.error('Error saving article:', error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

//route to select saved news from db
app.post('/api/saved/select', async (req, res) => {
    console.log("slecting saved articles route hit");
    let connection;
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'select * from saved where user_id = ? ORDER BY saved_at DESC',
            [user_id]
        );

        res.json({ success: true, saved: rows });
    }catch (error) {
        console.error('Error during selecting articles:', error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

//route to delete saved news from table
app.post('/api/saved/delete', async (req, res) => {
    console.log("deleting saved articles route hit");
    let connection;
    try {
        const { user_id, link } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        if(!link){
            return res.status(400).json({ success: false, message: "Article's link is required." });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'delete from saved where user_id = ? and link = ? ',
            [user_id, link]
        );

        if (rows.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Article not found or already deleted." 
            });
        }

        res.json({ 
            success: true, 
            message: "Article deleted successfully" 
        });
    }catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

//route to clear all saved articles
app.post('/api/saved/clear-all', async (req, res) => {
    console.log("clearing all saved articles route hit");
    let connection;
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [result] = await connection.execute(
            'DELETE FROM saved WHERE user_id = ?',
            [user_id]
        );

        console.log(`Deleted ${result.affectedRows} articles`);
        res.json({ 
            success: true, 
            message: "All articles cleared successfully",
            deletedCount: result.affectedRows 
        });
    }catch (error) {
        console.error('Error clearing all articles:', error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route for user personal info
app.post('/api/settings/info', async (req, res) => {
    console.log("personal info route hit!");
    let connection
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'select utilisateur, email, gender from sign where id = ?',
            [user_id]
        );

        res.json({ success: true, user_info: rows });
    }catch (error) {
        console.error("Error selecting user's info:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route for saved articles occurence
app.post('/api/settings/saved_Articles', async (req, res) => {
    console.log("saved_Articles info route hit!");
    let connection
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'select user_id, count(100) from saved where user_id = ? group by user_id ',
            [user_id]
        );

        res.json({ success: true, articles: rows });
    }catch (error) {
        console.error("Error selecting saved articles:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route for following source occurence
app.post('/api/settings/following_sources', async (req, res) => {
    console.log("following_sources info route hit!");
    let connection
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'select user_id, count(100) from following_liste where user_id = ? group by user_id',
            [user_id]
        );

        res.json({ success: true, sources: rows });
    }catch (error) {
        console.error("Error selecting followed sources:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route for articles read occurence
app.post('/api/settings/articles_read', async (req, res) => {
    console.log("articles_read info route hit!");
    let connection
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'select user_id, count(*) from history where user_id = ? group by user_id',
            [user_id]
        );

        res.json({ success: true, history: rows });
    }catch (error) {
        console.error("Error selecting articles read:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route for preferences selection
app.post('/api/settings/preferences', async (req, res) => {
    console.log("articles_read info route hit!");
    let connection
    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            'select preferences from preferences where user_id = ?',
            [user_id]
        );

        res.json({ success: true, history: rows });
    }catch (error) {
        console.error("Error selecting followed topics:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route to update categories  
app.post('/api/settings/preferences-update', async (req, res) => {
    console.log("preferences update route hit!");
    let connection
    try {
        const { user_id, preferences } = req.body;
        console.log('User ID:', user_id);
        console.log('preferences:', preferences);

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        if(!preferences || !Array.isArray(preferences)){
            return res.status(400).json({ success: false, message: 'Preferences array is required.' });
        }

        const preferencesString = preferences.join(', ');
        console.log('STring is:', preferencesString);

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            "UPDATE preferences SET preferences = ? WHERE user_id = ?",
            [preferencesString, user_id]
        );

        console.log('Update result:', rows);

        if (rows.affectedRows > 0) {
            res.json({ success: true, message: 'Preferences updated successfully' });
        } else {
            res.json({ success: false, message: 'No preferences found for this user' });
        }

    }catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route to update user personal info 
app.post('/api/settings/user-info-update', async (req, res) => {
    console.log("update user personal info route hit!");
    let connection
    try {
        const { user_id, name, email, password } = req.body;

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        if(!name || !email){
            return res.status(400).json({ success: false, message: 'Name and email are required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        let query;
        let params;

        if (password && password.trim() !== '') {
            query = "UPDATE sign SET utilisateur = ?, email = ?, motdepass = ? WHERE id = ?";
            params = [name, email, password, user_id];
            console.log('Updating with password');
        } else {
            query = "UPDATE sign SET utilisateur = ?, email = ? WHERE id = ?";
            params = [name, email, user_id];
            console.log('Updating without password');
        }

        const [rows] = await connection.execute(query, params);

        console.log('Update result:', rows);

        if (rows.affectedRows > 0) {
            res.json({ success: true, message: 'User info updated successfully' });
        } else {
            res.json({ success: false, message: 'No user found with this ID' });
        }

    }catch (error) {
        console.error("Error updating user info:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

// settings route to disable account
app.post('/api/disable', async (req, res) => {
    console.log("disabling info route hit!");
    let connection
    try {
        const { user_id} = req.body;

        if(!user_id){
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        const [rows] = await connection.execute(
            "UPDATE sign SET disabled = 1 WHERE id = ?",
            [user_id]
        );

        res.json({ success: true, message: 'account diabled successfully' });

    }catch (error) {
        console.error("Error updating user info:", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }finally {
        if (connection) connection.release();
    }
});

//route to add news into history
app.post('/api/history/add', async (req, res) => {
    console.log('history adding route hit');
    let connection;
    try {
        const { user_id, category_name, title, link, source, image, published, summary} = req.body;
        console.log('User ID:', user_id);
        console.log(category_name, title, link, source, image, published, summary);

        if (!user_id || !category_name || !title || !link || !source || !image || !published || !summary) {
            return res.status(400).json({ success: false, message: 'User ID and other items are required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        
        const [rows] = await connection.execute(
            'INSERT INTO history (user_id, category_name, title, link, source, image, published, summary) VALUES (?, ?, ?, ?, ?, ?, ?,?)',
            [user_id, category_name, title, link, source, image, published, summary]
        );
        res.json({ success: true, message: "item added to history succesfully." });
    } catch (error) {
        console.error('Error adding item to history:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
});

//route to select history item for a user
app.post('/api/history/select', async (req, res) => {
    console.log('history adding route hit');
    let connection;
    try {
        const { user_id} = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        
        const [rows] = await connection.execute(
            'select * from history where user_id = ? ORDER BY read_at DESC',
            [user_id]
        );
        res.json({ success: true, articles: rows });
    } catch (error) {
        console.error('Error selecting items from history:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }finally {
        if (connection) connection.release();
    }
});

//api to search news by source category or title
app.post('/api/search', async (req, res) => {
    console.log('Search route hit');
    let connection;
    try {
        const { searchTerm } = req.body;
        console.log('Search term:', searchTerm);

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search term is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        // Use wildcards for LIKE search
        const searchPattern = `%${searchTerm}%`;
        
        const [rows] = await connection.execute(
            `SELECT * FROM news 
             WHERE (category_name LIKE ? 
                OR title LIKE ? 
                OR source LIKE ?) 
             AND image IS NOT NULL 
             ORDER BY published DESC`,
            [searchPattern, searchPattern, searchPattern]
        );

        console.log(`Found ${rows.length} search results for: ${searchTerm}`);
        res.json({ success: true, results: rows, searchTerm: searchTerm });
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        if (connection) connection.release();
    }
});

//route to search in saved items
app.post('/api/saved/search', async (req, res) => {
    console.log('Saved search route hit');
    let connection;
    try {
        const { user_id, searchTerm } = req.body;
        console.log('User ID:', user_id);
        console.log('Search term:', searchTerm);

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search term is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        // Use wildcards for LIKE search
        const searchPattern = `%${searchTerm}%`;
        
        const [rows] = await connection.execute(
            `SELECT * FROM saved 
             WHERE user_id = ? 
             AND (category_name LIKE ? 
                OR title LIKE ? 
                OR source LIKE ?) 
             ORDER BY saved_at DESC`,
            [user_id, searchPattern, searchPattern, searchPattern]
        );

        console.log(`Found ${rows.length} saved search results for user ${user_id}, term: ${searchTerm}`);
        res.json({ success: true, results: rows, searchTerm: searchTerm });
    } catch (error) {
        console.error('Error during saved search:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        if (connection) connection.release();
    }
});

//route to search in history
app.post('/api/history/search', async (req, res) => {
    console.log('History search route hit');
    let connection;
    try {
        const { user_id, searchTerm } = req.body;
        console.log('User ID:', user_id);
        console.log('Search term:', searchTerm);

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search term is required.' });
        }

        connection = await pool.getConnection();
        console.log('Database connected');

        // Use wildcards for LIKE search
        const searchPattern = `%${searchTerm}%`;
        
        const [rows] = await connection.execute(
            `SELECT * FROM history 
             WHERE user_id = ? 
             AND (category_name LIKE ? 
                OR title LIKE ? 
                OR source LIKE ?) 
             ORDER BY read_at DESC`,
            [user_id, searchPattern, searchPattern, searchPattern]
        );

        console.log(`Found ${rows.length} history search results for user ${user_id}, term: ${searchTerm}`);
        res.json({ success: true, results: rows, searchTerm: searchTerm });
    } catch (error) {
        console.error('Error during history search:', error);
        res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        if (connection) connection.release();
    }
});

//to start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
