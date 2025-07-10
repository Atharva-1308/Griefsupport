import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  is_anonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  loginAnonymous: (username: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  registerAnonymous: (username: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('username', emailOrUsername);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData);
      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await fetchUser();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginAnonymous = async (username: string) => {
    try {
      const response = await api.post('/auth/login-anonymous', null, {
        params: { username }
      });
      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await fetchUser();
    } catch (error) {
      console.error('Anonymous login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.post('/auth/register', {
        username,
        email,
        password
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const registerAnonymous = async (username: string) => {
    try {
      await api.post('/auth/register-anonymous', {
        username
      });
    } catch (error) {
      console.error('Anonymous registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    loginAnonymous,
    register,
    registerAnonymous,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};