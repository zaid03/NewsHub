import pymysql
from dotenv import load_dotenv
import os

load_dotenv()

def create_connection():
    try:
        print("Connecting to database...")
        print(os.getenv("DB_HOST"))
        print(os.getenv("DB_USER"))
        print(os.getenv("DB_PASSWORD"))
        print(os.getenv("DB_NAME"))

        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except pymysql.MySQLError as e:  
        print(f"Error in connecting to database {e}")
        return None