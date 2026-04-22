SET NOCOUNT ON;

DECLARE @Counter INT = 1;
DECLARE @MaxRows INT = 1000;

-- 1. Setup Random Pools
DECLARE @FirstNames TABLE (ID INT IDENTITY(1,1), Val VARCHAR(50))
INSERT INTO @FirstNames VALUES ('James'),('Elena'),('Marcus'),('Sarah'),('David'),('Aisha'),('Robert'),('Lucia'),('Kevin'),('Grace'),('Samuel'),('Emily'),('Victor'),('Amara'),('Liam'),('Isabella'),('Noah'),('Chloe'),('Oscar'),('Sophia'),('Michael'),('Emma'),('John'),('Olivia'),('William'),('Ava'),('Chris'),('Mia'),('Anthony'),('Layla');

DECLARE @LastNames TABLE (ID INT IDENTITY(1,1), Val VARCHAR(50))
INSERT INTO @LastNames VALUES ('Miller'),('Rodriguez'),('Chen'),('O''Connor'),('Kim'),('Khan'),('Taylor'),('Silva'),('Smyth'),('Lee'),('Jackson'),('Davis'),('Ngo'),('Okonkwo'),('Wilson'),('Martini'),('Garcia'),('Dupont'),('Hernandez'),('Muller'),('Smith'),('Johnson'),('Williams'),('Brown'),('Jones'),('Wright'),('Lopez'),('Hill'),('Scott'),('Green');

-- 2. Accurate City/State/AreaCode Mapping
DECLARE @Locations TABLE (ID INT IDENTITY(1,1), City VARCHAR(50), State VARCHAR(2), AreaCode VARCHAR(3))
INSERT INTO @Locations VALUES 
('New York', 'NY', '212'), ('Brooklyn', 'NY', '718'), ('Los Angeles', 'CA', '310'), ('San Francisco', 'CA', '415'),
('Houston', 'TX', '713'), ('Dallas', 'TX', '214'), ('Miami', 'FL', '305'), ('Orlando', 'FL', '407'),
('Chicago', 'IL', '312'), ('Seattle', 'WA', '206'), ('Boston', 'MA', '617'), ('Atlanta', 'GA', '404'),
('Denver', 'CO', '303'), ('Phoenix', 'AZ', '602'), ('Austin', 'TX', '512'), ('San Diego', 'CA', '619');

DECLARE @Insurances TABLE (ID INT IDENTITY(1,1), Val VARCHAR(50))
INSERT INTO @Insurances VALUES ('Blue Cross'),('Aetna'),('Kaiser'),('Medicare'),('UnitedHealth'),('Cigna'),('Humana');

-- 3. The Generation Loop
WHILE @Counter <= @MaxRows
BEGIN
    -- Pick random names
    DECLARE @RF VARCHAR(50) = (SELECT TOP 1 Val FROM @FirstNames ORDER BY NEWID());
    DECLARE @RL VARCHAR(50) = (SELECT TOP 1 Val FROM @LastNames ORDER BY NEWID());
    
    -- Pick a valid City/State/AreaCode combo
    DECLARE @City VARCHAR(50), @State VARCHAR(2), @AC VARCHAR(3);
    SELECT TOP 1 @City = City, @State = State, @AC = AreaCode FROM @Locations ORDER BY NEWID();

    INSERT INTO dbo.tbl_patient (
        FirstName, LastName, SSN, DateOfBirth, Gender, Email, 
        PhoneNumber, AddressLine1, City, State, ZipCode, InsuranceProvider
    )
    SELECT 
        @RF,
        @RL,
        -- SSN: Fully randomized digits, not based on counter
        CONCAT(
            CAST(FLOOR(RAND()*899) + 100 AS VARCHAR), '-', 
            CAST(FLOOR(RAND()*89) + 10 AS VARCHAR), '-', 
            RIGHT('0000' + CAST(FLOOR(RAND()*9999) AS VARCHAR), 4)
        ),
        -- DOB
        DATEADD(DAY, - (ABS(CHECKSUM(NEWID())) % (365 * 62) + (365 * 18)), GETDATE()),
        CASE WHEN ABS(CHECKSUM(NEWID())) % 2 = 0 THEN 'Male' ELSE 'Female' END,
        -- Email
        LOWER(CONCAT(@RF, '.', @RL, @Counter, '@fakeemail.com')),
        -- Phone: Uses the correct Area Code for the City + random 7 digits
        CONCAT(@AC, '-', CAST(FLOOR(RAND()*899) + 100 AS VARCHAR), '-', RIGHT('0000' + CAST(FLOOR(RAND()*9999) AS VARCHAR), 4)),
        CONCAT(FLOOR(RAND()*9000) + 100, ' ', (SELECT TOP 1 Val FROM (VALUES ('Oak St'),('Maple Ave'),('Washington Blvd'),('Lakeview Dr'),('Park Rd')) AS T(Val) ORDER BY NEWID())),
        @City,
        @State,
        RIGHT('00000' + CAST(ABS(CHECKSUM(NEWID())) % 99999 AS VARCHAR), 5),
        (SELECT TOP 1 Val FROM @Insurances ORDER BY NEWID());

    SET @Counter = @Counter + 1;
END

PRINT 'Successfully generated 1000 high-quality random patients.';