import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-800">GriefCare AI</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Dashboard
                </Link>
                <Link to="/chat" className="text-gray-600 hover:text-purple-600 transition-colors">
                  AI Chat
                </Link>
                <Link to="/journal" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Journal
                </Link>
                <Link to="/mood" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Mood Tracker
                </Link>
                <Link to="/support" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Support
                </Link>
                <Link to="/resources" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Resources
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{user.username}</span>
                    {user.is_anonymous && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        Anonymous
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/resources" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Resources
                </Link>
                <Link to="/login" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};