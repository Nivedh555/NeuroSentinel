import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const assertAdmin = async (userId) => {
  if (!userId) return false;
  const user = await User.findById(userId).select('admin');
  return !!user?.admin;
};

export const bookAppointment = async (req, res) => {
  try {
    const { doctorName, specialty, date, time, patientName, patientSymptoms, riskScore } = req.body;
    const userId = req.user?.id || req.userId || null;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!doctorName || !specialty || !date || !time || !patientName) {
      return res.status(400).json({ message: 'Missing required fields: doctorName, specialty, date, time, patientName' });
    }

    const appointment = new Appointment({
      userId: userId,
      patientName: patientName,
      doctorName,
      specialty,
      date: date,
      time,
      patientSymptoms: Array.isArray(patientSymptoms) ? patientSymptoms : [],
      riskScore: riskScore || 0,
      diagnosis: req.body.diagnosis || '',
      status: 'Pending'
    });

    await appointment.save();

    res.status(201).json({
      message: `Appointment booked with ${doctorName} on ${date} at ${time}`,
      appointment
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to book appointment', 
      error: error.message,
      details: error.errors || {}
    });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const isAdmin = await assertAdmin(req.userId);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }

    const appointments = await Appointment.find({}).sort({ date: -1 });
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
};

export const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const appointments = await Appointment.find({ userId }).sort({ date: -1 });
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const isAdmin = await assertAdmin(req.userId);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }

    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({
      message: `Appointment status updated to ${status}`,
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment', error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'Cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({
      message: 'Appointment cancelled',
      appointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
  }
};
