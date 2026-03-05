import { useEffect, useState } from 'react'
import { patientService } from './api/patientService'
import type { Patient } from './types/Patient'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientService.getAllPatients()
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Connection failed:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div> Connecting to SQL Server ... </div>;

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Patient Management System</h1>
      <hr />
      {patients.length === 0 ? (
        <p>No active patients found in the database.</p>
      ) : (
        <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th>Name</th>
              <th>Public ID</th>
              <th>Insurance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.PublicPatientID}>
                <td>{p.FirstName} {p.LastName}</td>
                <td><code>{p.PublicPatientID}</code></td>
                <td>{p.InsuranceProvider || 'N/A'}</td>
                <td>{p.IsActive ? '✅ Active' : '❌ Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
