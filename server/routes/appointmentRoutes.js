import express from 'express';
import {
  bookAppointment,
  getAppointments,
  getUserAppointments,
  updateAppointmentStatus,
  cancelAppointment
} from '../controllers/appointmentController.js';
import userAuth from '../middleware/authmiddleware.js';

const router = express.Router();

// Book a new appointment (PUBLIC - no auth required)
router.post('/book', bookAppointment);

// Get all appointments (for doctor dashboard)
router.get('/list', getAppointments);

// Get user's own appointments (requires auth)
router.get('/my-appointments', userAuth, getUserAppointments);

// Update appointment status (for doctor dashboard)
router.patch('/:appointmentId/status', updateAppointmentStatus);

// Cancel an appointment (requires auth)
router.delete('/:appointmentId', userAuth, cancelAppointment);

export default router;
