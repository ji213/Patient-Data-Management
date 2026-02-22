// Map URLS to our controller functions

import { Router } from "express";
import { getPatients, getPatientByID } from "../controllers/patientController.js";


const router = Router();

// list all Patient-related endpoints

router.get('/', getPatients);

// The colon tells Express that 'id' is a dynamic param
router.get('/:id', getPatientByID);

export default router;