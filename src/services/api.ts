import axios from 'axios';

// Detect if we're in development and try HTTPS first, fallback to HTTP
const getBaseURL = () => {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    // Try HTTPS first, fallback to HTTP if needed
    return window.location.protocol === 'https:' 
      ? 'https://localhost:8000/api' 
      : 'http://localhost:8000/api';
  }
  // In production, use the same protocol as the frontend
  return `${window.location.protocol}//${window.location.hostname}:8000/api`;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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
    // Handle network errors (like HTTPS certificate issues)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      // Try switching to HTTP if HTTPS fails
      if (api.defaults.baseURL?.startsWith('https://')) {
        console.warn('HTTPS connection failed, falling back to HTTP');
        api.defaults.baseURL = api.defaults.baseURL.replace('https://', 'http://');
        
        // Retry the original request with HTTP
        if (error.config && !error.config._retry) {
          error.config._retry = true;
          error.config.baseURL = api.defaults.baseURL;
          return api.request(error.config);
        }
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);