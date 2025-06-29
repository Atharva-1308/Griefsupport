import axios from 'axios';

// Determine the correct backend URL based on environment
const getBaseURL = () => {
  // In development, try to detect if we're using HTTPS or HTTP
  const isHTTPS = window.location.protocol === 'https:';
  const hostname = window.location.hostname;
  
  // For localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Try HTTPS first, fallback to HTTP
    return isHTTPS ? 'https://localhost:8000/api' : 'http://localhost:8000/api';
  }
  
  // For production/deployed environments
  return `${window.location.protocol}//${hostname}:8000/api`;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add retry logic for network failures
const MAX_RETRIES = 3;
let retryCount = 0;

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

// Response interceptor with retry logic and better error handling
api.interceptors.response.use(
  (response) => {
    retryCount = 0; // Reset retry count on successful response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors with retry logic
    if ((error.code === 'ERR_NETWORK' || error.message === 'Network Error') && retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Network error, retrying... (${retryCount}/${MAX_RETRIES})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      
      // Try different protocol if first attempt fails
      if (retryCount === 2) {
        const currentURL = originalRequest.baseURL;
        if (currentURL?.includes('https://')) {
          originalRequest.baseURL = currentURL.replace('https://', 'http://');
        } else if (currentURL?.includes('http://')) {
          originalRequest.baseURL = currentURL.replace('http://', 'https://');
        }
      }
      
      return api(originalRequest);
    }
    
    // Reset retry count after max retries
    if (retryCount >= MAX_RETRIES) {
      retryCount = 0;
      const customError = new Error('Unable to connect to the server. Please ensure the backend is running and accessible.');
      customError.name = 'NetworkError';
      return Promise.reject(customError);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Health check function
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${getBaseURL().replace('/api', '')}/api/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

// Test connection function
export const testConnection = async (): Promise<{ success: boolean; url: string; error?: string }> => {
  const baseURL = getBaseURL();
  try {
    const response = await axios.get(`${baseURL.replace('/api', '')}/api/health`, {
      timeout: 5000,
    });
    return { success: true, url: baseURL };
  } catch (error) {
    return { 
      success: false, 
      url: baseURL, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};