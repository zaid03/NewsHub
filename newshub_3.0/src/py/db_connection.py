import sqlite3
from pathlib import Path
import runpy

DB_PATH = Path(__file__).resolve().parents[2] / "database" / "newshub.db"
INIT_DB_PATH = DB_PATH.parent / "init_db.py"
runpy.run_path(str(INIT_DB_PATH))

def create_connection():
    try:
        db_exists = DB_PATH.exists()
        print("Connecting to SQLite database...")
        connection = sqlite3.connect(DB_PATH)
        connection.row_factory = sqlite3.Row
        if not db_exists:
            print("Database not found. Initializing...")
            with open(INIT_DB_PATH, "r", encoding="utf-8") as file:
                connection.executescript(file.read())
            connection.commit()
            print("Database initialized successfully.")

        return connection
    except sqlite3.Error as e:  
        print(f"Error in connecting to database {e}")
        return None