module.exports = { /* db config */ } 
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.stack);
        process.exit(1);
    } else {
        console.log('✅ Connected to PostgreSQL successfully');
        console.log(`📊 Database: ${process.env.DB_NAME}`);
        release();
    }
});

module.exports = pool;