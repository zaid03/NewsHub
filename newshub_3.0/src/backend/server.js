const express = require('express');
const cors = require('cors');
const fetchNews = require('./fetch_news');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const connecttodb = require('./db');
const db = connecttodb();

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

//sign route
app.post('/api/sign', (req, res) => {
    console.log('Sign route hit');

    try {
        const { utilisateurr, email, gender, motdepasss} = req.body;

        console.log(req.body);
        const errors = {};

        if (!utilisateurr) errors.utilisateurr = "User name required.";
        if (!email) errors.threeemail = "Email required.";
        if (!gender) errors.gendererror = "Gender required.";
        if (!motdepasss) errors.motdepasss = "Password required.";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const existingUser = db.prepare(
            'SELECT * FROM sign WHERE email = ?'
        ).get(email);

        console.log('exiting user: ',existingUser);

        if (existingUser) {
            return res.status(400).json({
                success: false,
                errors: {
                    twoemail: "this email is already registered.",
                }
              });
        }

        const result = db.prepare(
            'INSERT INTO sign (utilisateur, email, gender, motdepass) VALUES (?, ?, ?, ?)'
        ).run(utilisateurr, email, gender, motdepasss);
        console.log('user saved : ',result);

        const user_id = Number(result.lastInsertRowid);
        req.session.user_id = user_id;
        res.json({ 
            success: true, 
            user_id ,message: "Inscription réussie." 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Erreur interne du serveur.", error });
    }
});

// Login route
app.post('/api/login', (req, res) => {
    try {
        const { utilisateur, motdepass } = req.body;

        if (!utilisateur || !motdepass) {
            return res.status(400).json({
                success: false,
                message: 'utilisateur et mot de passe requis.'
            });
        }

        console.log('Login attempt:', { utilisateur });

        const user = db.prepare(`
            SELECT id, utilisateur, gender, motdepass
            FROM sign
            WHERE utilisateur = ?
            AND (disabled IS NULL OR disabled = 0)
        `).get(utilisateur);

        console.log('Query result:', user);

        if (user) {
            if (motdepass === user.motdepass) {
                req.session.user_id = user.id;
                req.session.utilisateur = user.utilisateur || '';

                console.log('User ID from database:', user.id);

                return res.json({
                    success: true,
                    user_id: user.id,
                    nom: user.utilisateur || '',
                    gender: user.gender || '',
                    message: 'Connexion réussie.'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Mot de passe incorrect.'
            });
        }

        return res.status(404).json({
            success: false,
            message: 'utilisateur introuvable.'
        });

    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur.'
        });
    }
});

// News route for preferences
app.get('/api/news/preferences', (req, res) => {
    try {
        const user_id = req.query.user_id;

        console.log('Query parameters:', { user_id });

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const preferencesRow = db.prepare(
            'SELECT preferences FROM preferences WHERE user_id = ?'
        ).get(user_id);

        if (!preferencesRow || !preferencesRow.preferences) {
            return res.status(404).json({
                success: false,
                message: 'No preferences found for this user.'
            });
        }

        const preferences = preferencesRow.preferences
            .split(',')
            .map(pref => pref.trim())
            .filter(Boolean);

        if (preferences.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No preferences found for this user.'
            });
        }

        const placeholders = preferences.map(() => '?').join(', ');

        const sql = `
            SELECT *
            FROM news
            WHERE category_name IN (${placeholders})
            AND image IS NOT NULL
            ORDER BY published DESC
        `;

        const newsRows = db.prepare(sql).all(...preferences);

        console.log(`Found ${newsRows.length} news items`);

        return res.json({
            success: true,
            news: newsRows
        });

    } catch (error) {
        console.error('Error in /api/news/preferences:', error);

        return res.status(500).json({
            success: false,
            message: 'News query failed',
            error: error.message
        });
    }
});

// News route for discovering other categories
app.get('/api/news/nonpreferences', (req, res) => {
    console.log('Non-preferences route hit');

    try {
        const user_id = req.query.user_id;

        console.log('Query parameters:', { user_id });

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const preferencesRow = db.prepare(
            'SELECT preferences FROM preferences WHERE user_id = ?'
        ).get(user_id);

        if (!preferencesRow || !preferencesRow.preferences) {
            return res.status(404).json({
                success: false,
                message: 'No preferences found for this user.'
            });
        }

        const preferences = preferencesRow.preferences
            .split(',')
            .map(pref => pref.trim())
            .filter(Boolean);

        if (preferences.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No preferences found for this user.'
            });
        }

        const placeholders = preferences.map(() => '?').join(', ');

        const sql = `
            SELECT *
            FROM news
            WHERE category_name NOT IN (${placeholders})
            AND image IS NOT NULL
            ORDER BY published DESC
        `;

        const newsRows = db.prepare(sql).all(...preferences);

        console.log(`Found ${newsRows.length} news items`);

        return res.json({
            success: true,
            news: newsRows
        });

    } catch (error) {
        console.error('Error in /api/news/nonpreferences:', error);

        return res.status(500).json({
            success: false,
            message: 'News query failed',
            error: error.message
        });
    }
});

// Preferences route
app.post('/api/pref', (req, res) => {
    console.log('Preferences route hit');

    try {
        const { user_id, preferences } = req.body;

        console.log('User ID:', user_id);
        console.log('Topics:', preferences);

        if (!preferences || (Array.isArray(preferences) && preferences.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Sujets requis.'
            });
        }

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID requis.'
            });
        }

        const preferencesString = Array.isArray(preferences)
            ? preferences.join(', ')
            : preferences;

        db.prepare(
            'INSERT INTO preferences (user_id, preferences) VALUES (?, ?)'
        ).run(user_id, preferencesString);

        return res.json({
            success: true,
            message: "Inscription réussie."
        });

    } catch (error) {
        console.error('Error during preferences submission:', error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Notification route
app.post('/api/notification', (req, res) => {
    console.log('Notification route hit');

    try {
        const { user_id, notifications } = req.body;

        console.log('User ID:', user_id);
        console.log('Notifications:', notifications);

        if (!notifications || (Array.isArray(notifications) && notifications.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Sujets requis.'
            });
        }

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID requis.'
            });
        }

        const notificationString = Array.isArray(notifications)
            ? notifications.join(', ')
            : notifications;

        db.prepare(
            'INSERT INTO notification (user_id, notification) VALUES (?, ?)'
        ).run(user_id, notificationString);

        return res.json({
            success: true,
            message: "Inscription réussie."
        });

    } catch (error) {
        console.error('Error during notification submission:', error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Route for following news
app.post('/api/follow', (req, res) => {
    console.log('Follow route hit');

    try {
        const { user_id, topics } = req.body;

        console.log('User ID:', user_id);
        console.log('Topics:', topics);

        if (!user_id || !topics || (Array.isArray(topics) && topics.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Topics are required.'
            });
        }

        const topicsString = Array.isArray(topics)
            ? topics.join(', ')
            : topics;

        db.prepare(
            'INSERT INTO following_liste (user_id, topics) VALUES (?, ?)'
        ).run(user_id, topicsString);

        return res.json({
            success: true,
            message: "Followed successfully."
        });

    } catch (error) {
        console.error('Error during follow submission:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to unfollow news
app.post('/api/unfollow', (req, res) => {
    console.log('Unfollow route hit');

    try {
        const { user_id, topics } = req.body;

        console.log('User ID:', user_id);
        console.log('Topics:', topics);

        if (!user_id || !topics || (Array.isArray(topics) && topics.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Topics are required.'
            });
        }

        const topicsString = Array.isArray(topics)
            ? topics.join(', ')
            : topics;

        db.prepare(
            'DELETE FROM following_liste WHERE user_id = ? AND topics = ?'
        ).run(user_id, topicsString);

        return res.json({
            success: true,
            message: "Unfollowed successfully."
        });

    } catch (error) {
        console.error('Error during unfollow submission:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to get followed news
app.post('/api/followed', (req, res) => {
    console.log('Followed route hit');

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const rows = db.prepare(
            'SELECT topics FROM following_liste WHERE user_id = ?'
        ).all(user_id);

        return res.json({
            success: true,
            followedTopics: rows
        });

    } catch (error) {
        console.error('Error during followed topics retrieval:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to fetch news you're following
app.post('/api/news/following', (req, res) => {
    console.log('Following news route hit');

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const rows = db.prepare(
            'SELECT topics FROM following_liste WHERE user_id = ?'
        ).all(user_id);

        console.log('Followed topics retrieved:', rows);

        if (rows.length === 0) {
            return res.json({ success: true, news: [] });
        }

        const followedTopics = rows.map(row => row.topics);

        console.log('Followed topics:', followedTopics);

        const placeholders = followedTopics.map(() => '?').join(', ');

        const sql = `
            SELECT *
            FROM news
            WHERE source IN (${placeholders})
            AND image IS NOT NULL
            ORDER BY published DESC
        `;

        const newsRows = db.prepare(sql).all(...followedTopics);

        return res.json({
            success: true,
            news: newsRows
        });

    } catch (error) {
        console.error('Error during following news retrieval:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to fetch news by categories
app.post('/api/categories', (req, res) => {
    console.log('Categories route hit');

    try {
        const { category } = req.body;

        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category is required.'
            });
        }

        const rows = db.prepare(`
            SELECT *
            FROM news
            WHERE category_name = ?
            AND image IS NOT NULL
            ORDER BY published DESC
        `).all(category);

        console.log('Categories retrieved:', rows);

        return res.json({
            success: true,
            categories: rows
        });

    } catch (error) {
        console.error('Error during categories retrieval:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// API to fetch news by source
app.post('/api/source', (req, res) => {
    console.log('Source route hit');

    try {
        const { source } = req.body;

        if (!source) {
            return res.status(400).json({
                success: false,
                message: 'Source is required.'
            });
        }

        const rows = db.prepare(`
            SELECT *
            FROM news
            WHERE source = ?
            AND image IS NOT NULL
            ORDER BY published DESC
        `).all(source);

        console.log('Source retrieved:', rows);

        return res.json({
            success: true,
            source: rows
        });

    } catch (error) {
        console.error('Error during source retrieval:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to fetch radio
app.post('/api/radio', (req, res) => {
    console.log('Radio route hit');

    try {
        const rows = db.prepare('SELECT * FROM radio').all();

        console.log('Radio stations retrieved:', rows);

        return res.json({
            success: true,
            radio: rows
        });

    } catch (error) {
        console.error('Error during radio stations retrieval:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to fetch trending news
app.get('/api/trending/bring', (req, res) => {
    console.log('Trending route hit');

    try {
        const rows = db.prepare(`
            SELECT *
            FROM news
            WHERE trending IS NOT NULL
            ORDER BY trending DESC
            LIMIT 8
        `).all();

        console.log('Trending news retrieved:', rows);

        return res.json({
            success: true,
            trending: rows
        });

    } catch (error) {
        console.error('Error during trending news retrieval:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to send trending
app.post('/api/trending/add', (req, res) => {
    console.log("Trending route hit");

    const { title } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required."
        });
    }

    try {
        const result = db.prepare(`
            UPDATE news
            SET trending =
                CASE
                    WHEN trending IS NULL OR trending = '' THEN 1
                    ELSE trending + 1
                END
            WHERE title = ?
        `).run(title);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "News item not found."
            });
        }

        console.log("Trending news updated successfully");

        return res.json({
            success: true,
            message: "Trending news updated successfully."
        });

    } catch (error) {
        console.error('Error during trending news update:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to fetch trending news in order
app.get('/api/trending-now', (req, res) => {
    console.log("Trending news route is hit");

    try {
        const rows = db.prepare(`
            SELECT *
            FROM news
            WHERE trending IS NOT NULL
            AND trending <> 0
            ORDER BY trending DESC
        `).all();

        console.log("Trending received:", rows);

        return res.json({
            success: true,
            trending: rows
        });

    } catch (error) {
        console.error("Error during trending news retrieval:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route for inserting news into saved
app.post('/api/saved/add', (req, res) => {
    console.log("Insertion news into saved route hit");

    try {
        const {
            user_id,
            category_name,
            title,
            link,
            source,
            image,
            published,
            summary
        } = req.body;

        const result = db.prepare(`
            INSERT INTO saved (
                user_id, category_name, title, link,
                source, image, published, summary
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            user_id,
            category_name,
            title,
            link,
            source,
            image,
            published,
            summary
        );

        console.log('Article has been saved:', result);

        return res.json({
            success: true,
            saved: {
                saved_id: Number(result.lastInsertRowid),
                ...req.body
            }
        });

    } catch (error) {
        console.error('Error saving article:', error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Route to select saved news from DB
app.post('/api/saved/select', (req, res) => {
    console.log("Selecting saved articles route hit");

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const rows = db.prepare(`
            SELECT *
            FROM saved
            WHERE user_id = ?
            ORDER BY saved_at DESC
        `).all(user_id);

        return res.json({
            success: true,
            saved: rows
        });

    } catch (error) {
        console.error('Error during selecting articles:', error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Route to delete saved news from table
app.post('/api/saved/delete', (req, res) => {
    console.log("Deleting saved articles route hit");

    try {
        const { user_id, link } = req.body;

        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        if (!link) {
            return res.status(400).json({
                success: false,
                message: "Article's link is required."
            });
        }

        const result = db.prepare(
            'DELETE FROM saved WHERE user_id = ? AND link = ?'
        ).run(user_id, link);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Article not found or already deleted."
            });
        }

        return res.json({
            success: true,
            message: "Article deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting article:', error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Route to clear all saved articles
app.post('/api/saved/clear-all', (req, res) => {
    console.log("Clearing all saved articles route hit");

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const result = db.prepare(
            'DELETE FROM saved WHERE user_id = ?'
        ).run(user_id);

        console.log(`Deleted ${result.changes} articles`);

        return res.json({
            success: true,
            message: "All articles cleared successfully",
            deletedCount: result.changes
        });

    } catch (error) {
        console.error('Error clearing all articles:', error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route for user personal info
app.post('/api/settings/info', (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const user = db.prepare(`
            SELECT
                COALESCE(utilisateur, '') AS utilisateur,
                COALESCE(email, '') AS email,
                COALESCE(gender, '') AS gender
            FROM sign
            WHERE id = ?
        `).get(user_id);

        return res.json({
            success: true,
            user_info: [user || {
                utilisateur: '',
                email: '',
                gender: ''
            }]
        });

    } catch (error) {
        console.error("Error selecting user's info:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route for saved articles occurrence
app.post('/api/settings/saved_Articles', (req, res) => {
    console.log("Saved articles info route hit!");

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const row = db.prepare(`
            SELECT COUNT(*) AS article_count
            FROM saved
            WHERE user_id = ?
        `).get(user_id);
console.log('Requested user_id:', user_id);
console.log('Query result:', row);

        console.log('saved articles: ',row)

        return res.json({
            success: true,
            article_count: row.article_count
        });

    } catch (error) {
        console.error("Error selecting saved articles:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route for following source occurrence
app.post('/api/settings/following_sources', (req, res) => {
    console.log("Following_sources info route hit!");

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const row = db.prepare(`
            SELECT COUNT(*) AS source_count
            FROM following_liste
            WHERE user_id = ?
        `).get(user_id);

        return res.json({
            success: true,
            source_count: row.source_count
        });

    } catch (error) {
        console.error("Error selecting followed sources:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route for articles read occurrence
app.post('/api/settings/articles_read', (req, res) => {
    console.log("Articles_read info route hit!");

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const row = db.prepare(`
            SELECT COUNT(*) AS article_count
            FROM history
            WHERE user_id = ?
        `).get(user_id);

        return res.json({
            success: true,
            article_count: row.article_count
        });

    } catch (error) {
        console.error("Error selecting articles read:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route for preferences selection
app.post('/api/settings/preferences', (req, res) => {
    console.log("Preferences info route hit!");

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const rows = db.prepare(`
            SELECT preferences
            FROM preferences
            WHERE user_id = ?
        `).all(user_id);

        return res.json({
            success: true,
            history: rows
        });

    } catch (error) {
        console.error("Error selecting followed topics:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route to update categories
app.post('/api/settings/preferences-update', (req, res) => {
    console.log("Preferences update route hit!");

    try {
        const { user_id, preferences } = req.body;

        console.log('User ID:', user_id);
        console.log('Preferences:', preferences);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        if (!preferences || !Array.isArray(preferences)) {
            return res.status(400).json({
                success: false,
                message: 'Preferences array is required.'
            });
        }

        const preferencesString = preferences.join(', ');
        console.log('String is:', preferencesString);

        const result = db.prepare(
            'UPDATE preferences SET preferences = ? WHERE user_id = ?'
        ).run(preferencesString, user_id);

        console.log('Update result:', result);

        if (result.changes > 0) {
            return res.json({
                success: true,
                message: 'Preferences updated successfully'
            });
        }

        return res.json({
            success: false,
            message: 'No preferences found for this user'
        });

    } catch (error) {
        console.error("Error updating preferences:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route to update user personal info
app.post('/api/settings/user-info-update', (req, res) => {
    console.log("Update user personal info route hit!");

    try {
        const { user_id, name, email, password } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required.'
            });
        }

        let query;
        let params;

        if (password && password.trim() !== '') {
            query = `
                UPDATE sign
                SET utilisateur = ?, email = ?, motdepass = ?
                WHERE id = ?
            `;
            params = [name, email, password, user_id];
            console.log('Updating with password');
        } else {
            query = `
                UPDATE sign
                SET utilisateur = ?, email = ?
                WHERE id = ?
            `;
            params = [name, email, user_id];
            console.log('Updating without password');
        }

        const result = db.prepare(query).run(...params);

        console.log('Update result:', result);

        if (result.changes > 0) {
            return res.json({
                success: true,
                message: 'User info updated successfully'
            });
        }

        return res.json({
            success: false,
            message: 'No user found with this ID'
        });

    } catch (error) {
        console.error("Error updating user info:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Settings route to disable account
app.post('/api/disable', (req, res) => {
    console.log("Disabling account route hit!");

    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const result = db.prepare(
            'UPDATE sign SET disabled = 1 WHERE id = ?'
        ).run(user_id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Account disabled successfully'
        });

    } catch (error) {
        console.error("Error disabling account:", error);

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// Route to add news into history
app.post('/api/history/add', (req, res) => {
    console.log('History adding route hit');

    try {
        const {
            user_id,
            category_name,
            title,
            link,
            source,
            image,
            published,
            summary
        } = req.body;

        console.log('User ID:', user_id);
        console.log(category_name, title, link, source, image, published, summary);

        if (!user_id || !category_name || !title || !link || !source || !image || !published || !summary) {
            return res.status(400).json({
                success: false,
                message: 'User ID and other items are required.'
            });
        }

        db.prepare(`
            INSERT INTO history (
                user_id, category_name, title, link,
                source, image, published, summary
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            user_id,
            category_name,
            title,
            link,
            source,
            image,
            published,
            summary
        );

        return res.json({
            success: true,
            message: "item added to history succesfully."
        });

    } catch (error) {
        console.error('Error adding item to history:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to select history items for a user
app.post('/api/history/select', (req, res) => {
    console.log('History selection route hit');

    try {
        const { user_id } = req.body;
        console.log('User ID:', user_id);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        const rows = db.prepare(`
            SELECT *
            FROM history
            WHERE user_id = ?
            ORDER BY read_at DESC
        `).all(user_id);

        return res.json({
            success: true,
            articles: rows
        });

    } catch (error) {
        console.error('Error selecting items from history:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// API to search news by source, category, or title
app.post('/api/search', (req, res) => {
    console.log('Search route hit');

    try {
        const { searchTerm } = req.body;
        console.log('Search term:', searchTerm);

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search term is required.'
            });
        }

        const searchPattern = `%${searchTerm}%`;

        const rows = db.prepare(`
            SELECT *
            FROM news
            WHERE (
                category_name LIKE ?
                OR title LIKE ?
                OR source LIKE ?
            )
            AND image IS NOT NULL
            ORDER BY published DESC
        `).all(searchPattern, searchPattern, searchPattern);

        console.log(`Found ${rows.length} search results for: ${searchTerm}`);

        return res.json({
            success: true,
            results: rows,
            searchTerm: searchTerm
        });

    } catch (error) {
        console.error('Error during search:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to search in saved items
app.post('/api/saved/search', (req, res) => {
    console.log('Saved search route hit');

    try {
        const { user_id, searchTerm } = req.body;

        console.log('User ID:', user_id);
        console.log('Search term:', searchTerm);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search term is required.'
            });
        }

        const searchPattern = `%${searchTerm}%`;

        const rows = db.prepare(`
            SELECT *
            FROM saved
            WHERE user_id = ?
            AND (
                category_name LIKE ?
                OR title LIKE ?
                OR source LIKE ?
            )
            ORDER BY saved_at DESC
        `).all(user_id, searchPattern, searchPattern, searchPattern);

        console.log(`Found ${rows.length} saved search results for user ${user_id}, term: ${searchTerm}`);

        return res.json({
            success: true,
            results: rows,
            searchTerm: searchTerm
        });

    } catch (error) {
        console.error('Error during saved search:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// Route to search in history
app.post('/api/history/search', (req, res) => {
    console.log('History search route hit');

    try {
        const { user_id, searchTerm } = req.body;

        console.log('User ID:', user_id);
        console.log('Search term:', searchTerm);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required.'
            });
        }

        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search term is required.'
            });
        }

        const searchPattern = `%${searchTerm}%`;

        const rows = db.prepare(`
            SELECT *
            FROM history
            WHERE user_id = ?
            AND (
                category_name LIKE ?
                OR title LIKE ?
                OR source LIKE ?
            )
            ORDER BY read_at DESC
        `).all(user_id, searchPattern, searchPattern, searchPattern);

        console.log(`Found ${rows.length} history search results for user ${user_id}, term: ${searchTerm}`);

        return res.json({
            success: true,
            results: rows,
            searchTerm: searchTerm
        });

    } catch (error) {
        console.error('Error during history search:', error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

//to start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});