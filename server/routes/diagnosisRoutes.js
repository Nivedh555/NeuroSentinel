import express from 'express';
import { analyzeDiagnosis } from '../controllers/diagnosisController.js';
import userAuth from '../middleware/authmiddleware.js';

const router = express.Router();

router.post('/analyze', userAuth, analyzeDiagnosis);

export default router;
