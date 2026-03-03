import { Request, Response } from 'express'
import { getConnection } from '../config/dbConfig.js'
import { generatePublicPatientID } from '../utils/idGenerator.js';
import { formatName, nameRegex, ssnRegex, dateRegex, ALLOWED_GENDERS, emailRegex, phoneRegex, zipRegex } from '../utils/stringUtils.js';

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
        FROM dbo.tbl_patient t WHERE t.IsActive = 1 `

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
            .query('SELECT * FROM dbo.tbl_patient t WHERE t.PublicPatientID = @pid');

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
    // Initialize variables
    let isInserted = false;
    let retryCount = 0;

    const maxRetries = 5;

    while(!isInserted && retryCount < maxRetries){
        let publicID = generatePublicPatientID();

        try{

            const pool = await getConnection();
            const request = pool.request();

            // Extract all fields
            let {
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

            const sanitizedFirstName = formatName(FirstName);
            const sanitizedLastName = formatName(LastName);

            if (sanitizedFirstName.length < 2 || sanitizedLastName.length < 2){
                return res.status(400).json({
                    status: 400,
                    message: "Names must be at least 2 characters long",
                    error: "POST_NAME_LENGTH_ERROR"
                });
            }

            if(!nameRegex.test(sanitizedFirstName) || !nameRegex.test(sanitizedLastName)){
                return res.status(400).json({
                    status: 400,
                    message: "Names contain invalid characters",
                    error: "POST_NAME_INVALID_CHAR"
                });
            }
            // Validate SSN Format

            if(!ssnRegex.test(SSN)){
                return res.status(400).json({
                    status: 400,
                    message: "Invalid SSN format. Expected XXX-XX-XXXX",
                    error: "POST_INVALID_SSN_FORMAT"
                });
            }


            // Validate DateOfBirth
            // Check format
            if (!dateRegex.test(DateOfBirth)){
                return res.status(400).json({
                    status: 400,
                    message: "DOB must be in YYYY-MM-DD format",
                    error: "POST_INVALID_DOB_FORMAT"
                });
            }

            const dob = new Date(DateOfBirth);

            // check if it is a real date
            if(isNaN(dob.getTime())){
                return res.status(400).json({
                    status: 400,
                    message: "Invalid Date value",
                    error: "POST_INVALID_DOB_VALUE"
                });
            }

            const today = new Date();
            if (dob > today){
                return res.status(400).json({
                    status: 400,
                    message: "DOB cannot be in future",
                    error: "POST_DOB_OUTOFBOUNDS"
                });
            }

            // establish insert string
            // dont close brackets yet, close at end
            let insertString = `INSERT INTO dbo.tbl_patient ( 
            FirstName
            , LastName
            , SSN 
            , DateOfBirth
            , PublicPatientID `;
            // establish values string
            let valuesString = `VALUES ( @FirstName, @LastName, @SSN, @DateOfBirth, @PublicPatientID`;

            request.input('FirstName', sanitizedFirstName);
            request.input('LastName', sanitizedLastName);
            request.input('SSN', SSN);
            request.input('DateOfBirth', DateOfBirth);
            request.input('PublicPatientID', publicID);


            if(Gender){
                // Validate Gender Format
                Gender = Gender.toUpperCase().trim();

                if(!ALLOWED_GENDERS.includes(Gender)){
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid Gender supplied, please supply M or F",
                        error: "POST_INVALID_GENDER"
                    });
                }

                // Add to strings
                insertString += `, Gender`;
                valuesString += `, @Gender`;

                request.input('Gender', Gender);

            }
        
            if(Email){
                // Validate Email Format
                Email = Email.trim().toLowerCase();

                if(!emailRegex.test(Email)){
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid Email Format",
                        error: "POST_INVALID_EMAIL_FORMAT"
                    });
                }

                // Add to Strings
                insertString += `, Email`;
                valuesString += `, @Email`;

                request.input('Email', Email);
            }

            if(PhoneNumber){
                // Validate Phone Number
                // Remove everything that is not a number

                const digitsOnly = PhoneNumber.replace(/\D/g, '');

                if(!phoneRegex.test(digitsOnly)){
                    return res.status(400).json({
                        status: 400,
                        message: "Phone number must be exactly 10 digits.",
                        error: "INVALID_PHONE_FORMAT"
                    });
                }

                PhoneNumber = digitsOnly;


                // Add to Strings
                insertString += `, PhoneNumber`;
                valuesString += `, @PhoneNumber`;

                request.input('PhoneNumber', PhoneNumber);
            }
        
        

            // For address, we need all 4 variables supplied to post the data, 
            // if any of the address fields are missing if one of them are supplied, raise error

            if (AddressLine1 && City && State && ZipCode ){
                // Validate AddressLine1
                AddressLine1 = AddressLine1.trim();
                // Validate City
                City = City.trim();

                // Validate State
                State = State.trim().toUpperCase();

                if(!US_STATES.has(State)){
                    return res.status(400).json({ 
                        status: 400,
                        message: "Invalid State abbreviation. Please provide a valid US state.",
                        error: "POST_INVALID_STATE"
                    });
                }
                // Validate ZipCode
                ZipCode = ZipCode.trim();
                if(!zipRegex.test(ZipCode)){
                    return res.status(400).json({ 
                        status: 400,
                        message: "Zip Code must be exactly 5 digits.",
                        error: "POST_INVALID_ZIP"
                    });
                }

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
                InsuranceProvider = InsuranceProvider.trim();

                if(InsuranceProvider.length === 0){
                    return res.status(400).json({
                        status: 400,
                        message: "Insurance Provider cannot be empty if provided",
                        error: "POST_EMPTY_INSURANCE"
                    });
                }

                if(InsuranceProvider.length> 100){
                    return res.status(400).json({
                        status: 400,
                        message: "Insurance Provider name is too long (max 100 char)",
                        error: "POST_INVALID_INSURANCE"
                    });
                }



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

            isInserted = true;

            res.status(201).json({
                status: 201,
                message: "Patient created successfully"
            });


        } catch(err: any){

            // Error Handling for "Unique Constraint Violation" (SQL Error 2627)
            if(err.number === 2627){
                console.warn(`Collision detected on PublicPatientID ${publicID}. Retrying...`);
            }
            else{
                console.error("POST ERROR: ", err);
                res.status(500).json({
                    status: 500,
                    message: "Internal Server Error",
                    error: "FATAL_POST_ERROR"
                });

            }
            
        }

    }

};

export const deletePatient = async (req: Request, res: Response) =>{
    try {
        let {publicId} = req.params;
        const pool = await getConnection();
        const request = pool.request();

        let query = `UPDATE dbo.tbl_patient 
                SET IsActive = 0, 
                    UpdatedDt = GETDATE() 
                WHERE PublicPatientID = @publicId 
                AND IsActive = 1`;

        request.input('publicId', publicId);

        // Basic Validation
        if (!publicId || publicId.length !== 12){
            return res.status(400).json({
                status: 400,
                message: "Invalid PublicID Format... expects 12 digits",
                error: "DELETE_INVALID_PUBLIC_ID"
            });
        }

        const result = await request.query(query);

        //Check if anything was actually updated
        if (result.rowsAffected[0] === 0){
            return res.status(404).json({
                status: 404,
                message: "Patient not found or already deactivated",
                error: "DELETE_TARGET_NOT_FOUND"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Patient successfully deactivated"
        });

        

    } catch (err) {
        console.error("DELETE ERROR: ", err);
        res.status(500).json({
            status: 500,
            message: "Failed to deactivate patient",
            error: "INTERNAL_ERROR"
        });
    }

};

export const patchPatient = async (req: Request, res: Response) =>{
    try {
        let { publicId } = req.params;
        let updates = req.body;

        const keys = Object.keys(updates);

        if(keys.length === 0){
            return res.status(400).json({
                status: 400,
                message: "No updated fields provided",
                error: "PATCH_NO_UPDATES"
            });
        }

        // Only allow updates to columns that actually exist
        const allowedColumns = ['FirstName', 'LastName', 'SSN', 'DateOfBirth', 'Gender', 'Email', 'PhoneNumber', 'InsuranceProvider', 'AddressLine1', 'City', 'State', 'ZipCode'];

        const invalidKeys = keys.filter(key => !allowedColumns.includes(key));

        if (invalidKeys.length > 0){
            return res.status(400).json({
                status: 400,
                message: `Invalid fields provided: ${invalidKeys.join(', ')}`,
                error: "INVALID_UPDATE_FIELDS"
            });
        }

        const pool = await getConnection();
        const request = pool.request();
        request.input('publicId', publicId);

        // Dynamically build set clause
        let setClause = " ";
        keys.forEach((key, index) =>{
            const value = updates[key];

            // Validation block
            // FirstName
            if (key === 'FirstName'){
                
                const sanitizedFirstName = formatName(value);
                if (sanitizedFirstName.length < 2 ){
                    return res.status(400).json({
                        status: 400,
                        message: "Names must be at least 2 characters long",
                        error: "PATCH_NAME_LENGTH_ERROR"
                    });
                }
            }
            // LastName
            if (key === 'LastName'){
                const sanitizedLastName = formatName(value);

                if (sanitizedLastName.length < 2){
                    return res.status(400).json({
                        status: 400,
                        message: "Names must be at least 2 characters long",
                        error: "PATCH_NAME_LENGTH_ERROR"
                    });
                }
            }

            // SSN
            if (key === 'SSN'){
                if(!ssnRegex.test(value)){
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid SSN format. Expected XXX-XX-XXXX",
                        error: "PATCH_INVALID_SSN_FORMAT"
                    });
                }
            }
            //dob
            if (key === 'DateOfBirth'){
                if (!dateRegex.test(value)){
                    return res.status(400).json({
                        status: 400,
                        message: "DOB must be in YYYY-MM-DD format",
                        error: "PATCH_INVALID_DOB_FORMAT"
                    });
                }

                const dob = new Date(value);

                // check if it is a real date
                if(isNaN(dob.getTime())){
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid Date value",
                        error: "PATCH_INVALID_DOB_VALUE"
                    });
                }

                const today = new Date();
                if (dob > today){
                    return res.status(400).json({
                        status: 400,
                        message: "DOB cannot be in future",
                        error: "PATCH_DOB_OUTOFBOUNDS"
                    });
                }
            }
            //GENDER
            if(key === 'Gender'){
                // Validate Gender Format
                value.toUpperCase().trim();

                if(!ALLOWED_GENDERS.includes(value)){
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid Gender supplied, please supply M or F",
                        error: "POST_INVALID_GENDER"
                    });
                }
                // potentially need to overrite updates[key] with new value

                
            }
            //Email
            if(key === 'Email'){

            }
            //Phone Number
            if(key === 'PhoneNumber'){

            }
            //Insurance Provider
            if(key === 'Insurance Provider'){

            }
            //Address Line 1
            if(key === 'AddressLine1'){

            }
            //City
            if(key === 'City'){

            }
            //State
            if(key === 'State'){

            }
            //ZipCode
            if(key === 'ZipCode'){

            }

            request.input(key, updates[key]);
            setClause += `${key} = @${key}, `;

        });

        // Updated timestamp
        setClause += `UpdatedDt = GETDATE()`;

        const query = `
            UPDATE dbo.tbl_patient 
            SET ${setClause}
            WHERE PublicPatientID = @publicId AND IsActive = 1
        `

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0){
            return res.status(404).json({
                status: 404,
                message: "Patient not found... nothing updated",
                error: "PATCH_NO_UPDATE"
            });
        }

        res.json({
            message: "Patient updated successfully"
        });

    } catch(err: any){
        if(err.status){
            return res.status(err.status).json({
                status: err.status,
                message: err.message,
                error: err.error
            });
        }

        // Generic error
        console.error("PATCH ERROR: ", err);
        res.status(500).json({ error: "PATCH_FAILURE"});
    }
}