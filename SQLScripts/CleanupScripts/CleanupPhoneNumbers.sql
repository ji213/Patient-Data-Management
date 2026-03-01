-- Clean up phone number records to match new all digit format

-- run the UPDATE
UPDATE dbo.tbl_patient
SET PhoneNumber = REPLACE(PhoneNumber, '-', '')
WHERE PhoneNumber LIKE '%-%';