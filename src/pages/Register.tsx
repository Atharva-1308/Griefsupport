import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Eye, EyeOff, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register, registerAnonymous, loginAnonymous } = useAuth();
  const navigate = useNavigate();

  const generateRandomUsername = () => {
    const adjectives = ['Kind', 'Gentle', 'Brave', 'Strong', 'Peaceful', 'Caring', 'Hopeful', 'Wise'];
    const nouns = ['Heart', 'Soul', 'Spirit', 'Journey', 'Path', 'Light', 'Hope', 'Peace'];
    const randomNum = Math.floor(Math.random() * 1000);
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAnonymous) {
        // Generate a random username for anonymous users
        const randomUsername = generateRandomUsername();
        await registerAnonymous(randomUsername);
        await loginAnonymous(randomUsername);
        toast.success('Anonymous account created successfully');
        navigate('/dashboard');
      } else {
        // Validate email and password for regular accounts
        if (!email.trim()) {
          toast.error('Please enter your email address');
          setLoading(false);
          return;
        }
        
        if (!password.trim()) {
          toast.error('Please enter a password');
          setLoading(false);
          return;
        }
        
        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        
        // Generate username from email for regular users
        const emailUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);
        
        await register(emailUsername, email, password);
        toast.success('Account created successfully! Please log in.');
        navigate('/login');
        return;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      toast.error(errorMessage);
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
            Start Your Journey
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to begin healing
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
              Regular Account
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
            {!isAnonymous && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your email"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    We'll use this to create your account and for login
                  </p>
                </div>

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
                      placeholder="Create a password (min 6 characters)"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Confirm your password"
                  />
                </div>
              </>
            )}

            {isAnonymous && (
              <div className="text-center py-4">
                <UserCheck className="mx-auto h-16 w-16 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Anonymous Account</h3>
                <p className="text-sm text-gray-600">
                  We'll create a secure anonymous account for you automatically. 
                  No personal information required.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : isAnonymous ? 'Create Anonymous Account' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                Sign in here
              </Link>
            </p>
          </div>

          {isAnonymous && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <UserCheck className="inline h-4 w-4 mr-1" />
                Anonymous accounts provide maximum privacy but cannot be recovered if lost.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};