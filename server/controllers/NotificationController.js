import { sendEmergencyContactSms } from '../services/emergencyNotificationService.js';

export const notifyContacts = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { results } = await sendEmergencyContactSms({ userId });

    return res.json({
      message: 'Notifications processed', results 
    });
  } catch (error) {
    console.error('NotifyContacts error:', error);
    return res.status(500).json({
      message: 'Failed to send notifications', 
      error: error.message 
    });
  }
};

export default { notifyContacts };
