
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "newshub.db"

schema = """
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS bbc_image (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS sign (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        utilisateur VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        gender VARCHAR(255),
        motdepass VARCHAR(255),
        disabled INTEGER
    );

    CREATE TABLE IF NOT EXISTS following_liste (
        user_id INTEGER,
        topics VARCHAR(256),
        FOREIGN KEY (user_id) REFERENCES sign(id)
    );

    CREATE TABLE IF NOT EXISTS history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        category_name VARCHAR(255),
        title VARCHAR(2048),
        link VARCHAR(2048),
        source VARCHAR(255),
        image TEXT,
        published VARCHAR(255),
        summary TEXT,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES sign(id)
    );

    CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name VARCHAR(255),
        title VARCHAR(2048) NOT NULL,
        link VARCHAR(2048) NOT NULL,
        source VARCHAR(255),
        image TEXT,
        published VARCHAR(255),
        summary TEXT,
        trending INTEGER
    );

    CREATE TABLE IF NOT EXISTS notification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        notification VARCHAR(255) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES sign(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS preferences (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        preferences TEXT
    );

    CREATE TABLE IF NOT EXISTS radio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100),
        photo VARCHAR(255),
        genre VARCHAR(50),
        description VARCHAR(256),
        link TEXT
    );

    CREATE TABLE IF NOT EXISTS saved (
        saved_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_name VARCHAR(255),
        title VARCHAR(2048),
        link VARCHAR(2048),
        source VARCHAR(255),
        image TEXT,
        published VARCHAR(255),
        summary TEXT,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES sign(id) ON DELETE CASCADE
    );
"""

with sqlite3.connect(DB_PATH) as conn:
    conn.executescript(schema)

print(f"Database created successfully: {DB_PATH}")