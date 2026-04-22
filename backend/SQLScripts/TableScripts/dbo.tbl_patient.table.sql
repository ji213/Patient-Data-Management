-- Check if the table exists in the 'dbo' schema
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tbl_patient]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.tbl_patient (
        PatientID INT PRIMARY KEY IDENTITY(1,1),
        FirstName NVARCHAR(50) NOT NULL,
        LastName NVARCHAR(50) NOT NULL,
        SSN NVARCHAR(11) NOT NULL, -- Format: XXX-XX-XXXX
        DateOfBirth DATE NOT NULL,
        PublicPatientID VARCHAR(12) NOT NULL UNIQUE, -- 12 INT String
        Gender CHAR(1) CHECK (Gender IN('M', 'F')),
        Email NVARCHAR(100),
        PhoneNumber NVARCHAR(20),
        AddressLine1 NVARCHAR(255),
        City NVARCHAR(100),
        State NVARCHAR(50),
        ZipCode NVARCHAR(20),
        InsuranceProvider NVARCHAR(100),
        IsActive BIT DEFAULT 1,
        CreatedDt DATETIME DEFAULT GETDATE(),
        UpdatedDt DATETIME 
    );
    
    -- Create the index for faster lookups on PublicPatientID
    CREATE INDEX IX_tbl_patient_PublicID ON dbo.tbl_patient(PublicPatientID);
    
    PRINT 'Table [dbo].[tbl_patient] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[tbl_patient] already exists. Skipping creation.';
END