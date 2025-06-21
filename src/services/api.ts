import axios from 'axios';

// Force HTTP in development to avoid HTTPS certificate issues
const getBaseURL = () => {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    // Always use HTTP in development to avoid self-signed certificate issues
    return 'http://localhost:8000/api';
  }
  // In production, use the same protocol as the frontend
  return `${window.location.protocol}//${window.location.hostname}:8000/api`;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout to 30 seconds
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

// Response interceptor to handle auth errors and network issues
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network connection failed. Please ensure the backend server is running on http://localhost:8000');
      
      // Don't retry automatically to avoid infinite loops
      const customError = new Error('Unable to connect to the server. Please check if the backend is running.');
      customError.name = 'NetworkError';
      return Promise.reject(customError);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);