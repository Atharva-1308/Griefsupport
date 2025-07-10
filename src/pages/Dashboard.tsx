import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  MessageCircle, 
  BookOpen, 
  TrendingUp, 
  Users, 
  Calendar,
  Heart,
  Activity,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardData {
  mood_analytics: {
    average_mood_30_days: number;
    total_mood_entries: number;
    weekly_trends: Array<{
      week: string;
      average_mood: number;
      entries_count: number;
    }>;
  };
  journal_analytics: {
    total_entries_30_days: number;
    voice_entries: number;
    text_entries: number;
  };
  engagement: {
    days_active: number;
    streak_days: number;
  };
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Chat with AI',
      description: 'Get immediate support from our AI counselor',
      icon: MessageCircle,
      link: '/chat',
      color: 'bg-blue-500'
    },
    {
      title: 'Write in Journal',
      description: 'Express your thoughts and feelings',
      icon: BookOpen,
      link: '/journal',
      color: 'bg-green-500'
    },
    {
      title: 'Track Mood',
      description: 'Log how you\'re feeling today',
      icon: TrendingUp,
      link: '/mood',
      color: 'bg-purple-500'
    },
    {
      title: 'Join Support',
      description: 'Connect with others who understand',
      icon: Users,
      link: '/support',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 px-4">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 md:p-8 rounded-xl shadow-lg"
      >
        <div className="flex items-center space-x-3 mb-4 flex-wrap">
          <Heart className="h-6 md:h-8 w-6 md:w-8" />
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
            Welcome back, {user?.username}
          </h1>
        </div>
        <p className="text-base md:text-lg opacity-90">
          How are you feeling today? Remember, healing is a journey, and every step counts.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group bg-white p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`${action.color} w-10 md:w-12 h-10 md:h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-5 md:h-6 w-5 md:w-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Analytics Overview */}
      {dashboardData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Your Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3 mb-4 flex-wrap">
                <Activity className="h-6 md:h-8 w-6 md:w-8 text-purple-600" />
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Average Mood</h3>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600">
                    {dashboardData.mood_analytics.average_mood_30_days.toFixed(1)}/10
                  </p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                Based on {dashboardData.mood_analytics.total_mood_entries} entries this month
              </p>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3 mb-4 flex-wrap">
                <BookOpen className="h-6 md:h-8 w-6 md:w-8 text-green-600" />
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Journal Entries</h3>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                    {dashboardData.journal_analytics.total_entries_30_days}
                  </p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                {dashboardData.journal_analytics.voice_entries} voice, {dashboardData.journal_analytics.text_entries} text
              </p>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3 mb-4 flex-wrap">
                <Calendar className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Active Days</h3>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">
                    {dashboardData.engagement.days_active}
                  </p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                Days with activity this month
              </p>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3 mb-4 flex-wrap">
                <Clock className="h-6 md:h-8 w-6 md:w-8 text-orange-600" />
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Current Streak</h3>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600">
                    {dashboardData.engagement.streak_days}
                  </p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                Consecutive days of engagement
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white p-6 md:p-8 rounded-xl shadow-lg"
      >
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Continue Your Journey</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800">Daily Mood Check-in</h3>
                <p className="text-xs md:text-sm text-gray-600">Track how you're feeling today</p>
              </div>
            </div>
            <Link
              to="/mood"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-center text-sm md:text-base"
            >
              Check In
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800">Talk to AI Counselor</h3>
                <p className="text-xs md:text-sm text-gray-600">Get support when you need it</p>
              </div>
            </div>
            <Link
              to="/chat"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm md:text-base"
            >
              Start Chat
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800">Set Reminders</h3>
                <p className="text-xs md:text-sm text-gray-600">Schedule encouragement and check-ins</p>
              </div>
            </div>
            <Link
              to="/reminders"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center text-sm md:text-base"
            >
              Manage
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};