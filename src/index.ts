import dotenv from 'dotenv';
import { getConnection } from './config/dbConfig.js'; // Note the .js extension!

dotenv.config();

console.log("--- Attempting Database Connection ---");


// async function controlling start up sequence
const startServer = async () => {
    try {
        // Waits for the connection to be established
        const pool = await getConnection();

        console.log("✅ Database verified. Server is ready on Port:", process.env.PORT);

    } catch (error) {
        console.error("Could not start server due to DB error.");
        process.exit(1);
    }
};

startServer();