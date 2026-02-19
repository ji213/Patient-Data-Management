import dotenv from 'dotenv';
import { poolPromise } from './config/dbConfig.js'; // Note the .js extension!

dotenv.config();

console.log("--- Attempting Database Connection ---");

const startServer = async () => {
    try {
        await poolPromise;
        console.log("Server is ready on Port:", process.env.PORT);
    } catch (error) {
        console.error("Could not start server due to DB error.");
    }
};

startServer();