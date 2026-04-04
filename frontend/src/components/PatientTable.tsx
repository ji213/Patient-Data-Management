// GET display logic

import type { Patient } from "../types/Patient";
import { Trash2,  Edit} from 'lucide-react'; // Icons for future steps?

interface Props {
    patients: Patient[];
    onDelete: (id: string) => void;
    onEdit: (patient: Patient) => void;
}

export const PatientTable = ({ patients, onDelete, onEdit }: Props) =>{

    //format phone number
    const formatPhone = (phone?: string) =>{
        if(!phone) return 'NOT_SUPPLIED';
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;

    };

    // format DOB
    const formatDate = (dateStr: string) =>{
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US').format(date);
    };

    return (
        <div className="table-container">
            <table className="patient-table">
                <thead>
                    <tr style={{ background: '#f4f4f4', textAlign: 'left'}}>
                        <th>Patient ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>SSN</th>
                        <th>DateOfBirth</th>
                        <th>Gender</th>
                        <th>Email</th>
                        <th>Phone Number</th>
                        <th>Address Line 1</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Zip Code</th>
                        <th>Insurance Provider</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map((p) => (
                        <tr key={p.PublicPatientID}>
                            <td><code>{p.PublicPatientID || "MISSING"}</code></td>
                            <td>{p.FirstName}</td>
                            <td>{p.LastName}</td>
                            <td>{p.SSN}</td>
                            <td>{formatDate(p.DateOfBirth)}</td>
                            <td>{p.Gender}</td>
                            <td>{p.Email}</td>
                            <td>{formatPhone(p.PhoneNumber)}</td>
                            <td>{p.AddressLine1}</td>
                            <td>{p.City}</td>
                            <td>{p.State}</td>
                            <td>{p.ZipCode}</td>
                            <td>{p.InsuranceProvider}</td>
                            <td>
                                <button 
                                    title="Edit" 
                                    style={{ marginRight: '8px'}}
                                    onClick={() => onEdit(p)}
                                >
                                    <Edit size={16}/>
                                </button>

                                <button 
                                    title="Delete" 
                                    style={{ color: 'red' }}
                                    onClick={() => onDelete(p.PublicPatientID)}
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


