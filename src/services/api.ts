import axios from 'axios';

// Use the same protocol as the frontend to avoid mixed-content issues
const getBaseURL = () => {
  const protocol = window.location.protocol;
  const hostname = 'localhost';
  const port = '8000';
  
  return `${protocol}//${hostname}:${port}/api`;
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
      const protocol = window.location.protocol;
      const expectedURL = `${protocol}//localhost:8000`;
      console.error(`Network connection failed. Please ensure the backend server is running on ${expectedURL}`);
      
      // Don't retry automatically to avoid infinite loops
      const customError = new Error(`Unable to connect to the server. Please check if the backend is running on ${expectedURL}.`);
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