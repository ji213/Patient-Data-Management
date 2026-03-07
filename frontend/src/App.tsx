import { useEffect, useState } from 'react'
import { patientService } from './api/patientService'
import type { Patient } from './types/Patient'
import { PatientTable } from './components/PatientTable';
import { PatientModal } from './components/PatientModal';
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.getAllPatients();
      setPatients(data);

    } catch (err){
      console.error("Connection failed: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Functions
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this patient?")){
      try {
        await patientService.deletePatient(id);

        //Optimistically update the UI by filtering out the deleted patient
        setPatients(prev => prev.filter(p => p.PublicPatientID !== id));

      } catch (err){
        console.error("Delete failed: ", err);
        alert("ERROR: Could not delete the patient. Please try again");
      }
    }
  };

  const handleEdit = (patient: Patient) => {
    console.log("Edit clicked for: ", patient.PublicPatientID);
    // add logic here
    setSelectedPatient(patient);
    setIsModalOpen(true);

  };

  const handleAddNew = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  }

  if (loading) return <div> Connecting to SQL Server ... </div>;

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Patient Management System</h1>
      <p>Displaying all active patient records</p>
      <hr />

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end'}}>
        <button 
          onClick={handleAddNew}
          style={{padding: '10px 20px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                 fontWeight: 'bold'}}
        >
          + Add New Patient
        </button>
      </div>

      {patients.length === 0 ? (
        <p>No active patients found... </p>
      ) : (
        //
        <PatientTable 
          patients={patients}
          onDelete={handleDelete}
          onEdit={handleEdit} />
      )}

      {/*Render the modal conditionally*/}
      {isModalOpen && (
        <PatientModal
          patient={selectedPatient}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadPatients();
          }}
        />
      )}
    </div>
  )
}



export default App

// function App() {
//   const [count, setCount] = useState(0)
// 
//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }
