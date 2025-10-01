import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getCurrentUser: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.put('/auth/preferences', preferences),
  getUsage: () => api.get('/auth/usage'),
  
  // OAuth
  googleLogin: () => window.location.href = `${API_BASE_URL}/auth/google`,
  instagramLogin: () => window.location.href = `${API_BASE_URL}/auth/instagram`,
  
  // Phone authentication
  sendOTP: (phoneNumber) => api.post('/auth/phone/send-otp', { phoneNumber }),
  verifyOTP: (phoneNumber, otp) => api.post('/auth/phone/verify-otp', { phoneNumber, otp }),
  
  // Link additional auth methods
  linkGoogle: (googleData) => api.post('/auth/link/google', googleData),
  linkInstagram: (instagramData) => api.post('/auth/link/instagram', instagramData),
};

// Chat API
export const chatAPI = {
  sendTextMessage: (message, profileId) => api.post('/chat/text', { message, profileId }),
  sendImageMessage: (imageFile, profileId) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('profileId', profileId);
    return api.post('/chat/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  sendVoiceMessage: (audioFile, profileId) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('profileId', profileId);
    return api.post('/chat/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  sendScreenshotMessage: (screenshotFile, profileId) => {
    const formData = new FormData();
    formData.append('screenshot', screenshotFile);
    formData.append('profileId', profileId);
    return api.post('/chat/screenshot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getConversation: (profileId) => api.get(`/chat/conversation/${profileId}`),
  generateConversationStarters: (profileId) => api.get(`/chat/starters/${profileId}`),
};

// Profile API
export const profileAPI = {
  createProfile: (profileData) => api.post('/profile', profileData),
  getProfiles: () => api.get('/profile'),
  getProfile: (id) => api.get(`/profile/${id}`),
  updateProfile: (id, profileData) => api.put(`/profile/${id}`, profileData),
  deleteProfile: (id) => api.delete(`/profile/${id}`),
  getProfileHistory: (id) => api.get(`/profile/${id}/history`),
  getProfileStats: (id) => api.get(`/profile/${id}/stats`),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  createPaymentIntent: (plan) => api.post('/subscription/create-payment-intent', { plan }),
  confirmPayment: (paymentIntentId) => api.post('/subscription/confirm-payment', { paymentIntentId }),
  getCurrentSubscription: () => api.get('/subscription/current'),
  cancelSubscription: () => api.post('/subscription/cancel'),
};

// Upload API
export const uploadAPI = {
  uploadSingle: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getFile: (filename) => `${API_BASE_URL}/upload/${filename}`,
  deleteFile: (filename) => api.delete(`/upload/${filename}`),
};

export default api;
