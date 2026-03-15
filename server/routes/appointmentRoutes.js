import express from 'express';
import {
  bookAppointment,
  getAppointments,
  getUserAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  deleteAppointmentAdmin,
  bulkDeleteOldAppointmentsAdmin
} from '../controllers/appointmentController.js';
import userAuth from '../middleware/authmiddleware.js';

const router = express.Router();

// Book a new appointment (requires auth)
router.post('/book', userAuth, bookAppointment);

// Get all appointments (for doctor dashboard)
router.get('/list', userAuth, getAppointments);

// Get user's own appointments (requires auth)
router.get('/my-appointments', userAuth, getUserAppointments);

// Update appointment status (for doctor dashboard)
router.patch('/:appointmentId/status', userAuth, updateAppointmentStatus);

// Cancel an appointment (requires auth)
router.delete('/:appointmentId', userAuth, cancelAppointment);

// Admin bulk cleanup for old completed/cancelled records
router.delete('/admin/cleanup', userAuth, bulkDeleteOldAppointmentsAdmin);

// Admin hard delete for old/incorrect records
router.delete('/admin/:appointmentId', userAuth, deleteAppointmentAdmin);

export default router;
