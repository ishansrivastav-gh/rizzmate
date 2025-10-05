import axios from 'axios';
import { toast } from 'react-hot-toast';

// CRITICAL FIX: Ensure we read the Vercel variable.
// Vercel sets environment variables that start with REACT_APP_
const API_URL = process.env.REACT_APP_API_URL; 

if (!API_URL) {
  // This error should only appear if the environment variable is missing on Vercel
  console.error("CRITICAL ERROR: REACT_APP_API_URL environment variable is not set!");
}

const api = axios.create({
  // Use the live URL defined on Vercel. Requests will look like: 
  // https://rizzmate.onrender.com/api/auth/login
  baseURL: API_URL, 
  withCredentials: true, // IMPORTANT for sending cookies (session/auth)
});

// Interceptor to automatically handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response ? error.response.status : null;
    
    // Handle unauthorized (session expired or invalid token)
    if (statusCode === 401) {
      toast.error("Session expired. Please log in again.");
    } 
    
    // For other failures (404, 500, etc.), display a generic message
    if (statusCode && statusCode >= 400 && statusCode !== 401 && statusCode !== 403) {
        const message = error.response.data?.message || `API Error: ${statusCode}`;
        // toast.error(message);
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (userData) => api.post('/api/auth/register', userData),
  googleLogin: () => {
    // Redirect browser to the backend Google OAuth route
    window.location.href = `${API_URL}/api/auth/google`;
  },
  instagramLogin: () => {
    // Redirect browser to the backend Instagram OAuth route
    window.location.href = `${API_URL}/api/auth/instagram`;
  },
  logout: () => api.post('/api/auth/logout'),
};

export const chatAPI = {
    // Example call to a chat initiation endpoint
    sendMessage: (data) => api.post('/api/chat/send', data), 
};


export default api;
