//patientService.ts

import axios from 'axios';
import type { Patient } from '../types/Patient';

const API_BASE_URL = 'http://localhost:5000/api/patients';

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

    // PATCH
    patchPatient: async (id: string, updates: Partial<Patient>): Promise<void> =>{
        await axios.patch(`${API_BASE_URL}/${id}`, updates);
    }

};