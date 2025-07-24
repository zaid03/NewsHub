from db_connection import create_connection

def test_db():
    conn = create_connection()
    if conn:
        print("✅ Database connection test succeeded.")
        conn.close()
    else:
        print("❌ Database connection test failed.")

if __name__ == "__main__":
    test_db()
