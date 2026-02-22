import { Request, Response } from 'express'
import { getConnection } from '../config/dbConfig.js'

export const getPatients = async (req: Request, res: Response) => {
    try{
        const pool = await getConnection();

        const result = await pool.request()
            .query('SELECT TOP 20 * FROM tbl_patient');

        // send data back in json format
        res.json(result.recordset);
        
    } catch (err) {
        console.error("SQL ERROR: ", err);
        res.status(500).json({ 
            status:500,
            message: "Failed to fetch patients",
            error: "INTERNAL_ERROR"
        });
    }
};

export const getPatientByID = async (req: Request, res: Response) => {
    try {
        // Grab ID from URL
        const { id } = req.params;

        const pool = await getConnection();

        // Use .input() for security... prevents SQL injection
        // treats the id as a safe value, not executable code
        const result = await pool.request()
            .input('pid', id)
            .query('SELECT * FROM dbo.tbl_patient t WHERE t.PatientID = @pid');

        // ERROR Handling
        // Handle the not found case
        if (result.recordset.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Patient not Found",
                error: "NOT_FOUND"
            });
        }

        // Return the first object, not the whole array
        res.status(200).json(result.recordset[0]);

    } catch (err) {
        console.error("SQL ERROR: ", err);
        res.status(500).json({ 
            status: 500,
            message: "Failed to fetch patient by ID",
            error: "INTERNAL_ERROR"
        }); 
    }

};