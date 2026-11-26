const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../database/newshub.db');

const connecttodb = () => {
    try {
        const db = new Database(DB_PATH);

        db.pragma('foreign_keys = ON');

        console.log("Connected to SQLite database successfully");
        return db;

    } catch (error) {
        console.error("Error connecting to the database:", error);
        throw error;
    }
};

module.exports = connecttodb;