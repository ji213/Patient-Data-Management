import { Request, Response } from 'express'
import { getConnection } from '../config/dbConfig.js'

const US_STATES = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

const minimumAgeAllowed = 0;
const maximumAgeAllowed = 120;

export const getPatients = async (req: Request, res: Response) => {
    // GET patients, by gender, state, insurance, in age Range (ex: 40-50)
    try{
        const { gender, state, insurance, ageRange } = req.query;
        const pool = await getConnection();
        const request = pool.request();
        const validGenders = ['M', 'F'];

        // BASE QUERY
        let queryString = `SELECT t.FirstName
        , t.LastName
        , t.SSN
        , t.DateOfBirth
        , t.Gender
        , t.Email
        , t.PhoneNumber
        , t.AddressLine1
        , t.City
        , t.State
        , t.ZipCode
        , t.InsuranceProvider
        , t.IsActive
        , t.CreatedDt
        , t.UpdatedDt
        FROM dbo.tbl_patient t WHERE 1=1 `

        // String filters
        if (gender){
            // Standardize case
            const genderUpper = String(gender).trim().toUpperCase();

            // Check length
            if(genderUpper.length !== 1){
                return res.status(400).json({
                    status:400,
                    message:"ERROR: Gender must be passed in as single character",
                    error: "INVALID_PARAMETER_FORMAT"

                });
            }

            if(!validGenders.includes(genderUpper)){
                // if supplied gender is not valid
                return res.status(400).json({
                    status:400,
                    message: "Invalid gender parameter. Must be M or F",
                    error: "INVALID_CHARACTER"
                });
            }
            queryString += ` AND t.Gender = @gender `;
            request.input('gender', gender);

        }
        if (state){
            const stateStr = String(state).trim().toUpperCase();

            // String must be 2 characters exactly
            if (stateStr.length !== 2){
                return res.status(400).json({
                    status:400,
                    message: "State must be a 2 letter string",
                    error: "INVALID_STATE_FORMAT"
                });
            }
            // Check against US states dictionary, must be real state
            if(!US_STATES.has(stateStr)){
                return res.status(400).json({
                    status:400,
                    message: "Invalid state supplied",
                    error: "INVALID_STATE_VALUE"
                });
            }
            queryString += ` AND t.State = @state `;
            request.input('state', state);

        }
        if(insurance){
            queryString += ` AND t.InsuranceProvider = @insurance `;
            request.input('insurance', insurance)

        }

        // Age filtering
        // Take age range and calculate min-max DOB 
        if (typeof ageRange === 'string'){
            const [minAgeStr, maxAgeStr] = ageRange.split('-');

            if( !minAgeStr || !maxAgeStr){
                return res.status(400).json({
                    status: 400,
                    message: "Age range must be in a min-max format",
                    error: "INVALID_AGE_RANGE_FORMAT"
                });
            }

            const minAge = parseInt(minAgeStr as string);
            const maxAge = parseInt(maxAgeStr as string);

            // Ensure min < max
            if (minAge > maxAge){
                return res.status(400).json({
                    status: 400,
                    message: "The minimum age cannot be greater than the maximum age",
                    error: "INVALID_AGE_RANGE_ORDER"
                });
            }
            // Validate boundaries

            if ( minAge < minimumAgeAllowed || maxAge >  maximumAgeAllowed){
                return res.status(400).json({
                    status: 400,
                    message: `Age range must be between ${minimumAgeAllowed} and ${maximumAgeAllowed}.`,
                    error: "AGE_RANGE_OUT_OF_BOUNDS"
                });
            }

            if (!isNaN(minAge) && !isNaN(maxAge)){
                // WHERE DOB BETWEEN (getdate - maxage + 1) AND (getdate - minage)
                queryString += ` AND t.DateOfBirth BETWEEN DATEADD(year, -(@maxAge + 1), GETDATE()) 
                                    AND DATEADD(year, -@minAge, GETDATE()) `;

                request.input('minAge', minAge);
                request.input('maxAge', maxAge);
            }
        }

        // get result
        const result = await request.query(queryString);
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