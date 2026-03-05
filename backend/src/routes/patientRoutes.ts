// Map URLS to our controller functions

import { Router } from "express";
import { getPatients, getPatientByID, postPatient, deletePatient, patchPatient } from "../controllers/patientController.js";


const router = Router();

// list all Patient-related endpoints

router.get('/', getPatients);

// The colon tells Express that 'id' is a dynamic param
router.get('/:id', getPatientByID);

// POST for creating new patient
router.post('/', postPatient);

// DELETE (Inactivate)
router.delete('/:publicId', deletePatient);

// PATCH (update specific fields)
router.patch('/:publicId', patchPatient);


export default router;