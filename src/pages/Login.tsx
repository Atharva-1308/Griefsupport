import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Eye, EyeOff, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, loginAnonymous } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAnonymous) {
        await loginAnonymous(username);
        toast.success('Logged in anonymously');
      } else {
        await login(username, password);
        toast.success('Logged in successfully');
      }
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-purple-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Continue your healing journey
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsAnonymous(false)}
              className={`flex-1 py-2 px-2 md:px-4 text-xs md:text-sm font-medium rounded-l-lg border ${
                !isAnonymous
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              Regular Login
            </button>
            <button
              type="button"
              onClick={() => setIsAnonymous(true)}
              className={`flex-1 py-2 px-2 md:px-4 text-xs md:text-sm font-medium rounded-r-lg border-t border-r border-b ${
                isAnonymous
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              <UserCheck className="inline h-4 w-4 mr-1" />
              Anonymous
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username {!isAnonymous && '/ Email'}
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder={isAnonymous ? "Enter your username" : "Username or email"}
              />
            </div>

            {!isAnonymous && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : isAnonymous ? 'Continue Anonymously' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500">
                Sign up here
              </Link>
            </p>
          </div>

          {isAnonymous && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <UserCheck className="inline h-4 w-4 mr-1" />
                Anonymous mode provides privacy but limits some features like data sync across devices.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};