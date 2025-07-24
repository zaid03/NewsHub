const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'zaid',    
    password: 'zaid.123', 
    database: 'newshub'     
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Admin Stats API Endpoints
app.get('/admin/stats/articles', (req, res) => {
    const query = 'SELECT COUNT(*) as count FROM news';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ count: results[0].count });
    });
});

app.get('/admin/stats/users', (req, res) => {
    const query = 'SELECT COUNT(*) as count FROM sign';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ count: results[0].count });
    });
});

app.get('/admin/stats/views', (req, res) => {
    const query = 'SELECT COUNT(*) as count FROM history';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ count: results[0].count });
    });
});

app.get('/admin/stats/saved', (req, res) => {
    const query = 'SELECT COUNT(*) as count FROM saved';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ count: results[0].count });
    });
});

app.get('/admin/articles', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const query = `
        SELECT id, title, published, trending 
        FROM news 
        ORDER BY published DESC LIMIT ${limit} OFFSET ${offset}
    `;
    
    db.query(query, [limit, offset], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ articles: results, page, limit });
    });
});

app.delete('/admin/articles/:id', (req, res) => {
    const articleId = req.params.id;
    const query = 'DELETE FROM news WHERE id = ?';
    
    db.query(query, [articleId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, message: 'Article deleted successfully' });
    });
});

app.get('/admin/users', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const query = `
        SELECT id, utilisateur, email, gender, disabled
        FROM sign LIMIT ${limit} OFFSET ${offset}
    `;
    
    db.query(query, [limit, offset], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ users: results, page, limit });
    });
});

app.delete('/admin/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = 'DELETE FROM sign WHERE id = ?';
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    });
});

app.post('/admin/articles/clean', (req, res) => {
    const query = 'DELETE FROM news WHERE published < DATE_SUB(NOW(), INTERVAL 15 DAY)';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, deleted: results.affectedRows });
    });
});

// Most followed topics API
app.get('/admin/analytics/topics', (req, res) => {
    const query = `
        SELECT topics, COUNT(*) as followers 
        FROM following_liste 
        WHERE topics IS NOT NULL AND topics != '' 
        GROUP BY topics 
        ORDER BY followers DESC 
        LIMIT 3
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        const formattedResults = results.map((row, index) => ({
            rank: index + 1,
            topic: row.topics,
            followers: row.followers,
            position: index === 0 ? 'Most Followed' : 
                     index === 1 ? 'Second Most' : 'Third Most'
        }));
        
        res.json({ 
            success: true, 
            topTopics: formattedResults,
            totalCategories: results.length
        });
    });
});

// Radio statistics API
app.get('/admin/analytics/radio', (req, res) => {
    const queries = [
        // Total radios count
        'SELECT COUNT(*) as total FROM radio WHERE name IS NOT NULL AND name != ""',
        // Count by genre working 
        'SELECT genre, COUNT(*) as count FROM radio WHERE genre IS NOT NULL GROUP BY genre'
    ];
    
    Promise.all(queries.map(query => {
        return new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }))
    .then(([totalResult, genreResults]) => {
        const total = totalResult[0].total;
        const genreStats = {};
        
        console.log('Genre query results:', genreResults);
        
        genreResults.forEach(row => {
            genreStats[row.genre.toLowerCase()] = row.count;
        });
        
        console.log('Genre stats:', genreStats);
        
        res.json({
            success: true,
            totalRadios: total,
            musicRadios: genreStats.music || 0,
            newsRadios: genreStats.news || 0,
            genreBreakdown: genreResults
        });
    })
    .catch(err => {
        console.error('Radio analytics error:', err);
        res.status(500).json({ error: 'Database error' });
    });
});

app.listen(PORT, () => {
    console.log(`Admin API server running on http://localhost:${PORT}`);
});