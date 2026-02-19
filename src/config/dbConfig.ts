import sql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';

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

export const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to MSSQL via Windows Authentication');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed: ', err);
        throw err;
    });