import React, {useState , useEffect } from 'react';
import { patientService } from '../api/patientService';
import type { Patient } from '../types/Patient';


interface Props {
    patient: Patient | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const PatientModal = ({ patient, onClose, onSuccess }: Props) => {
    // Init form state
    const [formData, setFormData] = useState<Partial<Patient>>({
        FirstName: '',
        LastName: '',
        SSN: '',
        DateOfBirth: '',
        Gender: '',
        PhoneNumber: '',
        Email: '',
        AddressLine1: '',
        City: '',
        State: '',
        ZipCode: '',
        InsuranceProvider: ''
    });

    // Populate form if editing
    useEffect(() => {
        if (patient) {
            const cleanData = {
                ...patient,
                DateOfBirth: patient.DateOfBirth ? patient.DateOfBirth.split('T')[0] : ''
            }
            setFormData(cleanData);
        } else {
            // Resets the form to empty strings so old data doesn't "stick"
            setFormData({
                FirstName: '',
                LastName: '',
                SSN: '',
                DateOfBirth: '',
                Gender: '',
                PhoneNumber: '',
                Email: '',
                AddressLine1: '',
                City: '',
                State: '',
                ZipCode: '',
                InsuranceProvider: ''
            });
        }
    }, [patient]);

    // Universal Change Handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let displayValue = value;

        //Apply formatting only to the SSN field
        if (name === 'SSN'){
            displayValue = formatSSN(value);
        }

        setFormData(prev => ({ ...prev, [name]: displayValue}));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (patient?.PublicPatientID){
                const {
                    PublicPatientID,
                    IsActive,
                    CreatedDt,
                    UpdatedDt,
                    ...editableData
                } = formData
                // If we have an ID, call PATCH
                await patientService.patchPatient(patient.PublicPatientID, editableData);
            }
            else {
                // If ID is missing, call POST
                await patientService.createPatient(formData as Patient);
            }

            // This tells app.tsx to close the modal and run loadPatients()
            onSuccess();

        } catch(err: any){
            const serverMessage = err.response?.data?.message || "Error saving patient data";
            console.error("Save failed:  ", err);
            alert(`Error saving patient data: ${serverMessage}`);
        }
    };

    return (
            <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h2>{patient ? 'Edit Patient' : 'Add New Patient'}</h2>
                <form onSubmit={handleSubmit} style={formGridStyle}>
                    
                    {/* Basic Info */}
                    <input name="FirstName" placeholder="First Name" value={formData.FirstName} onChange={handleChange} required />
                    <input name="LastName" placeholder="Last Name" value={formData.LastName} onChange={handleChange} required />
                    <input name="SSN" placeholder="SSN (XXX-XX-XXXX)" value={formData.SSN} onChange={handleChange} maxLength={11} inputMode='numeric' />
                    <input name="DateOfBirth" type="date" value={formData.DateOfBirth} onChange={handleChange} required />
                    
                    <select name="Gender" value={formData.Gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>

                    <input name="PhoneNumber" placeholder="Phone" value={formData.PhoneNumber} onChange={handleChange} />
                    <input name="Email" type="email" placeholder="Email" value={formData.Email} onChange={handleChange} />
                    
                    {/* Address Info */}
                    <input name="AddressLine1" placeholder="Address" value={formData.AddressLine1} onChange={handleChange} />
                    <input name="City" placeholder="City" value={formData.City} onChange={handleChange} />
                    <input name="State" placeholder="State" value={formData.State} onChange={handleChange} />
                    <input name="ZipCode" placeholder="Zip" value={formData.ZipCode} onChange={handleChange} />
                    <input name="InsuranceProvider" placeholder="Insurance" value={formData.InsuranceProvider} onChange={handleChange} />

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" style={saveButtonStyle}>Save Patient</button>
                        <button type="button" onClick={onClose} style={cancelButtonStyle}>Cancel</button>
                    </div>
                </form>
            </div>
            </div>
        );

       
};

 // 
const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
};
const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto'
};
const formGridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'
};
const saveButtonStyle = {padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1};
const cancelButtonStyle = {padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1};

// Helper function to format SSN as XXX-XX-XXXX
const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    //Limit to 9 digits
    const limited = digits.substring(0, 9);

    //Inject dashes based on length
    if (limited.length <= 3) return limited;
    if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
};