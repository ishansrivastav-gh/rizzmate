import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { Smartphone, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PhoneAuth = ({ onSuccess, onBack }) => {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.sendOTP(phoneNumber);
      if (response.data.message) {
        toast.success('OTP sent successfully!');
        setOtpSent(true);
        setStep('otp');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phoneNumber, otp);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        toast.success('Phone verified successfully!');
        onSuccess(response.data.user);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to verify OTP';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await authAPI.sendOTP(phoneNumber);
      toast.success('OTP resent successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Smartphone className="h-12 w-12 text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {step === 'phone' ? 'Enter Your Phone Number' : 'Verify Your Phone'}
        </h2>
        <p className="text-gray-600">
          {step === 'phone' 
            ? 'We\'ll send you a verification code via SMS'
            : `We sent a 6-digit code to ${phoneNumber}`
          }
        </p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input-field"
              placeholder="+1 (555) 123-4567"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Include country code (e.g., +1 for US)
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 btn-outline flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                'Send Code'
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input-field text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="flex-1 btn-outline flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Change Number</span>
            </button>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex-1 btn-primary"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="text-sm text-primary-600 hover:text-primary-500 underline"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </form>
      )}

      {otpSent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm text-green-700">
              Verification code sent successfully!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneAuth;
