import dotenv from 'dotenv';
import express from 'express';
import { getConnection } from './config/dbConfig.js'; // Note the .js extension!
import patientRoutes from './routes/patientRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// allows the server to handle JSON 
app.use(express.json()); 

// main page
app.get('/', (req, res) => {
    res.send('Welcome to the Patient Management API. The server is up and running!');
});

// GET route
app.use('/api/patients', patientRoutes);

// async function controlling start up sequence
const startServer = async () => {
    try {
        // Waits for the connection to be established
        // const pool = await getConnection();
        await getConnection();

        app.listen(PORT, () => {
            console.log(`✅ Server is running on http://localhost:${PORT}`);
            console.log(`🚀 Test the API at http://localhost:${PORT}/api/patients`);
        });


    } catch (err) {
        console.error("Could not start server due to DB error: ", err);
        process.exit(1);
    }
};

startServer();