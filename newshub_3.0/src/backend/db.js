const mysql = require('mysql2/promise');
require('dotenv').config();

const connecttodb = async () => {
    try{
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        console.log("connected to db successfully");
        return connection;
    } catch (error) {
        console.error("Error connecting to the database:", error);
        throw error;
    }
};

module.exports = connecttodb;