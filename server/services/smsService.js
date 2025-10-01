const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendOTP(phoneNumber) {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send SMS
      const message = await this.client.messages.create({
        body: `Your RizzMate verification code is: ${otp}. This code will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        success: true,
        otp,
        messageId: message.sid
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyOTP(phoneNumber, otp) {
    try {
      // In a real implementation, you would store and verify OTP from database
      // For now, we'll return success for demo purposes
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SMSService();
