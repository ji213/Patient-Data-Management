// frontend/src/types.Patient.ts
// ?  = optional

export interface Patient {
    PublicPatientID: string;
    FirstName: string;
    LastName: string;
    SSN: string;
    DateOfBirth: string;
    Gender?: 'M' | 'F' | '';
    Email?: string;
    PhoneNumber?: string;
    InsuranceProvider?: string;
    AddressLine1?: string;
    City?: string;
    State?: string;
    ZipCode?: string;
    IsActive: boolean;
    CreatedDt: string;
    UpdatedDt: string;
}