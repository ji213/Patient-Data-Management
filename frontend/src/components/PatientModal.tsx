import React, {useState , useEffect } from 'react';
import { patientService } from '../api/patientService';
import type { Patient } from '../types/Patient';
import Select from 'react-select';


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
                    <input name="FirstName" style={sharedInputStyle} placeholder="First Name" value={formData.FirstName} onChange={handleChange} required />
                    <input name="LastName" style={sharedInputStyle} placeholder="Last Name" value={formData.LastName} onChange={handleChange} required />
                    <input name="SSN" style={sharedInputStyle} placeholder="SSN (XXX-XX-XXXX)" value={formData.SSN} onChange={handleChange} maxLength={11} inputMode='numeric' />
                    <input name="DateOfBirth" style={sharedInputStyle} type="date" value={formData.DateOfBirth} onChange={handleChange} required />
                    
                    <select name="Gender" style={sharedInputStyle} value={formData.Gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>

                    <input name="PhoneNumber" style={sharedInputStyle} placeholder="Phone" value={formData.PhoneNumber} onChange={handleChange} />
                    <input name="Email" style={sharedInputStyle} type="email" placeholder="Email" value={formData.Email} onChange={handleChange} />
                    
                    {/* Address Info */}
                    <input name="AddressLine1" style={sharedInputStyle} placeholder="Address" value={formData.AddressLine1} onChange={handleChange} />
                    <input name="City"style={sharedInputStyle}  placeholder="City" value={formData.City} onChange={handleChange} />
                    <Select
                        options={stateOptions}
                        placeholder="State"
                        // Connects the component to your formData state
                        value={stateOptions.find(opt => opt.value === formData.State) || null}
                        // Manually updates formData since this isn't a standard input event
                        onChange={(selectedOption) => {
                            setFormData(prev =>({ ...prev, State: selectedOption ? selectedOption.value : '' }));
                        }}
                        styles={customSelectStyles}
                    />
                    <input name="ZipCode" style={sharedInputStyle} placeholder="Zip" value={formData.ZipCode} onChange={handleChange} />
                    <input name="InsuranceProvider" style={sharedInputStyle} placeholder="Insurance" value={formData.InsuranceProvider} onChange={handleChange} />

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

const sharedInputStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    height: '38px', // Force all fields to this height
    boxSizing: 'border-box', // Crucial to ensure padding doesn't add to the height
    width: '100%'
};

const customSelectStyles = {
    control: (base: any) => ({
        ...base,
        height: '38px',
        minHeight: '38px',
        borderColor: '#ccc',
        borderRadius: '4px',
        fontSize: '14px',
        boxShadow: 'none',
        '&:hover': { borderColor: '#ccc' }
    }),
    valueContainer: (base: any) => ({
        ...base,
        height: '38px',
        padding: '0 10px',
    }),
    indicatorsContainer: (base: any) => ({
        ...base,
        height: '38px',
    }),
};

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

const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const stateOptions = US_STATES.map(state => ({ value: state, label: state }));