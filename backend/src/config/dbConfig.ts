// Defines how we talk to SQL

import sql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';


// LOAD 
dotenv.config();

const config: sql.config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME,
    driver: process.env.DRIVER, 
    options: {
        trustedConnection: true,
        trustServerCertificate: true 
    }
};

// This variable will hold our single connection pool
let pool: sql.ConnectionPool | null = null;


// perform handshake
export const getConnection = async () => {
    try {
        // if a pool already exists and is connected, return it
        if (pool) return pool;

        // create a new one
        pool = await new sql.ConnectionPool(config).connect();
        console.log('✅ Connected to MSSQL via Windows Authentication');
        return pool;

    } catch (err) {
        console.error('❌ Database Connection Failed: ', err);
        pool = null; // Reset pool on failure so we can try again
        throw err;
    }
};