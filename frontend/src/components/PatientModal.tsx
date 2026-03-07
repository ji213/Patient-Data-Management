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
            setFormData(patient);
        }
    }, [patient]);

    // Universal Change Handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (patient?.PublicPatientID){
                // If we have an ID, call PATCH
                await patientService.patchPatient(patient.PublicPatientID, formData);
            }
            else {
                // If ID is missing, call POST
                await patientService.createPatient(formData as Patient);
            }

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
                    <input name="SSN" placeholder="SSN (XXX-XX-XXXX)" value={formData.SSN} onChange={handleChange} />
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