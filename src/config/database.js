const { Pool } = require('pg');
const { env } = require('./env');

// Database configuration using environment config
const dbConfig = {
    connectionString: env.DATABASE.URL,
    host: env.DATABASE.HOST,
    port: env.DATABASE.PORT,
    database: env.DATABASE.NAME,
    user: env.DATABASE.USER,
    password: env.DATABASE.PASSWORD,
    ssl: env.DATABASE.SSL,
    max: env.DATABASE.POOL.MAX,
    idleTimeoutMillis: env.DATABASE.POOL.IDLE_TIMEOUT,
    connectionTimeoutMillis: env.DATABASE.POOL.CONNECTION_TIMEOUT,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`Executed query: ${text.substring(0, 100)}... Duration: ${duration}ms`);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function to get a client from pool
const getClient = async () => {
    return await pool.connect();
};

// Helper function for transactions
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    query,
    getClient,
    transaction,
};