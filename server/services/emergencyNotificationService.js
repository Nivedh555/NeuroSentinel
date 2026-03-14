import twilio from 'twilio';
import User from '../models/User.js';

const formatPhoneNumber = (phone) => {
  const cleaned = String(phone || '').replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }

  return null;
};

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  const missingVars = [];
  if (!accountSid) missingVars.push('TWILIO_ACCOUNT_SID');
  if (!authToken) missingVars.push('TWILIO_AUTH_TOKEN');
  if (!fromNumber) missingVars.push('TWILIO_PHONE_NUMBER');

  if (missingVars.length > 0) {
    throw new Error(`Twilio configuration missing on server: ${missingVars.join(', ')}`);
  }

  return {
    client: twilio(accountSid, authToken),
    fromNumber,
  };
};

export const sendEmergencyContactSms = async ({ userId, messageBody }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const contacts = user.emergency_contacts || [];
  if (!contacts.length) {
    throw new Error('No emergency contacts set');
  }

  const { client, fromNumber } = getTwilioClient();
  const senderName = user.username || 'Someone';

  const smsBody =
    messageBody ||
    `${senderName} needs your support - please check in with them and let them know you care. If it's an emergency, contact local emergency services.`;

  const results = [];
  for (const contact of contacts) {
    try {
      const formattedPhone = formatPhoneNumber(contact);
      if (!formattedPhone) {
        results.push({
          to: contact,
          status: 'error',
          error: 'Invalid phone number format. Use 10 or 12-15 digit format.',
        });
        continue;
      }

      const msg = await client.messages.create({
        body: smsBody,
        from: fromNumber,
        to: formattedPhone,
      });

      results.push({
        to: contact,
        formattedPhone,
        status: 'sent',
        sid: msg.sid,
      });
    } catch (err) {
      results.push({
        to: contact,
        status: 'error',
        error: err.message,
      });
    }
  }

  return {
    results,
    sentCount: results.filter((r) => r.status === 'sent').length,
  };
};
