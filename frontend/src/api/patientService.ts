//patientService.ts
import axios from 'axios';
import type { Patient } from '../types/Patient';


const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost';
const PORT = import.meta.env.VITE_PORT || '5000'

const API_BASE_URL = `${BASE_URL}:${PORT}/api/patients`;

export const patientService = {
    // GET all active patients
    getAllPatients: async (): Promise<Patient[]> => {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    },

    // GET a single patient by ID
    getPatientById: async (id: string): Promise<Patient> => {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    },
    // POST Patient
    createPatient: async (patient: Patient): Promise<void> => {
        await axios.post(API_BASE_URL, patient);
    },

    // PATCH
    patchPatient: async (id: string, updates: Partial<Patient>): Promise<void> =>{
        await axios.patch(`${API_BASE_URL}/${id}`, updates);
    },

    // DELETE/INACTIVATE
    deletePatient: async (id: string): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/${id}`);
    }

};