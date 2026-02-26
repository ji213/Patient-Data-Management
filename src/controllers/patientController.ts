import { Request, Response } from 'express'
import { getConnection } from '../config/dbConfig.js'

const US_STATES = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

const MIN_AGE_ALLOWED = 0;
const MAX_AGE_ALLOWED = 120;

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

            if ( minAge < MIN_AGE_ALLOWED || maxAge >  MAX_AGE_ALLOWED){
                return res.status(400).json({
                    status: 400,
                    message: `Age range must be between ${MIN_AGE_ALLOWED} and ${MAX_AGE_ALLOWED}.`,
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

export const postPatient = async (req: Request, res: Response) => {
    try{
        const pool = await getConnection();
        const request = pool.request();

        // Extract all fields
        const {
            FirstName, LastName, SSN, DateOfBirth,
            Gender, Email, PhoneNumber, AddressLine1,
            City, State, ZipCode, InsuranceProvider
        } = req.body;

        // Validate Minimum Required Fields
        if (!FirstName || !LastName || !SSN || !DateOfBirth){
            return res.status(400).json({
                status: 400,
                message: "Missing required fields: FirstName, LastName, SSN, and DOB are mandatory",
                error: "POST_REQUIRED_FIELDS_MISSING"
            });
        }

        


        // Validate First and Last Name
        // Validate SSN Format
        // Validate DateOfBirth

        // establish insert string
        // dont close brackets yet, close at end
        let insertString = `INSERT INTO dbo.tbl_patient ( 
        FirstName
        , LastName
        , SSN 
        , DateOfBirth `;
        // establish values string
        let valuesString = `VALUES ( @FirstName, @LastName, @SSN, @DateOfBirth`;

        request.input('FirstName', FirstName);
        request.input('LastName', LastName);
        request.input('SSN', SSN);
        request.input('DateOfBirth', DateOfBirth);


        if(Gender){
            // Validate Gender Format

            // Add to strings
            insertString += `, Gender`;
            valuesString += `, @Gender`;

            request.input('Gender', Gender);

        }
        
        if(Email){
            // Validate Email Format

            // Add to Strings
            insertString += `, Email`;
            valuesString += `, @Email`;

            request.input('Email', Email);
        }

        if(PhoneNumber){
            // Validate Phone Number

            // Add to Strings
            insertString += `, PhoneNumber`;
            valuesString += `, @PhoneNumber`;

            request.input('PhoneNumber', PhoneNumber);
        }
        
        

        // For address, we need all 4 variables supplied to post the data, 
        // if any of the address fields are missing if one of them are supplied, raise error

        if (AddressLine1 && City && State && ZipCode ){
            // Validate AddressLine1
            // Validate City
            // Validate State
            // Validate ZipCode

            // Add to Strings
            insertString += `, AddressLine1
            , City
            , State
            , ZipCode `;

            valuesString += `, @AddressLine1, @City, @State, @ZipCode`;

            request.input('AddressLine1', AddressLine1);
            request.input('City', City);
            request.input('State', State);
            request.input('ZipCode', ZipCode);

        } else if (AddressLine1 || City || State || ZipCode){
            // Only partial fields provided.... raise error
            return res.status(400).json({
                status: 400,
                message: "All address fields required if any address fields are provided",
                error: "POST_PARTIAL_ADDRESS_SUPPLIED"
            });
        }
        

        if(InsuranceProvider){
            // Validate InsuranceProvider

            // Add to Strings
            insertString += `, InsuranceProvider`;
            valuesString += `, @InsuranceProvider`;

            request.input('InsuranceProvider', InsuranceProvider);
        }
        
        


        // After all validations, close brackets
        insertString += `)`;
        valuesString += `)`;

        let finalQuery = insertString + valuesString;

        //console.log(` SQL Query: ${finalQuery}`);

        // Insert logic into database
        await request.query(finalQuery);

        res.status(201).json({
            status: 201,
            message: "Patient created successfully"
        });
        

    } catch(err){
        console.error("POST ERROR: ", err);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: "FATAL_POST_ERROR"
        });
    }

};