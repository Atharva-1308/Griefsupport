import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrendingUp, Calendar, Activity, Target, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface MoodTrend {
  date: string;
  average_mood: number;
  entries_count: number;
  min_mood: number;
  max_mood: number;
}

interface TrendData {
  period_days: number;
  trend_data: MoodTrend[];
  summary: {
    total_entries: number;
    overall_average: number;
    best_day: MoodTrend | null;
    challenging_day: MoodTrend | null;
  };
}

export const Analytics: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [selectedPeriod]);

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics/mood-trends?days=${selectedPeriod}`);
      setTrendData(response.data);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (value: number) => {
    if (value <= 3) return 'text-red-500';
    if (value <= 5) return 'text-yellow-500';
    if (value <= 7) return 'text-blue-500';
    return 'text-green-500';
  };

  const getMoodBgColor = (value: number) => {
    if (value <= 3) return 'bg-red-100';
    if (value <= 5) return 'bg-yellow-100';
    if (value <= 7) return 'bg-blue-100';
    return 'bg-green-100';
  };

  const periods = [
    { days: 7, label: '7 Days' },
    { days: 30, label: '30 Days' },
    { days: 90, label: '3 Months' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!trendData || trendData.trend_data.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Data Available</h2>
          <p className="text-gray-500">
            Start tracking your mood to see analytics and insights about your emotional journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Mood Analytics</h1>
          </div>
          <div className="flex space-x-2">
            {periods.map((period) => (
              <button
                key={period.days}
                onClick={() => setSelectedPeriod(period.days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period.days
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          Track your emotional patterns and progress over time. Understanding your mood trends can help in your healing journey.
        </p>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Average Mood</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {trendData.summary.overall_average.toFixed(1)}/10
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Over the last {selectedPeriod} days
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Entries</h3>
                <p className="text-3xl font-bold text-green-600">
                  {trendData.summary.total_entries}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Mood check-ins recorded
            </p>
          </motion.div>

          {trendData.summary.best_day && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Award className="h-8 w-8 text-yellow-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Best Day</h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {trendData.summary.best_day.average_mood.toFixed(1)}/10
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(trendData.summary.best_day.date).toLocaleDateString()}
              </p>
            </motion.div>
          )}

          {trendData.summary.challenging_day && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Growth Day</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {trendData.summary.challenging_day.average_mood.toFixed(1)}/10
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(trendData.summary.challenging_day.date).toLocaleDateString()}
              </p>
            </motion.div>
          )}
        </div>

        {/* Mood Trend Chart */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Mood Trend Over Time</h3>
          <div className="space-y-3">
            {trendData.trend_data.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-4 p-3 bg-white rounded-lg"
              >
                <div className="w-20 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-32">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            day.average_mood <= 3 ? 'bg-red-500' :
                            day.average_mood <= 5 ? 'bg-yellow-500' :
                            day.average_mood <= 7 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(day.average_mood / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className={`font-semibold ${getMoodColor(day.average_mood)}`}>
                      {day.average_mood.toFixed(1)}/10
                    </span>
                    <span className="text-sm text-gray-500">
                      ({day.entries_count} {day.entries_count === 1 ? 'entry' : 'entries'})
                    </span>
                  </div>
                </div>
                {day.min_mood !== day.max_mood && (
                  <div className="text-xs text-gray-500">
                    Range: {day.min_mood} - {day.max_mood}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Insights & Encouragement</h3>
          <div className="space-y-3">
            {trendData.summary.overall_average >= 6 && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  Your average mood is above 6/10, which shows resilience and positive coping. Keep up the great work!
                </p>
              </div>
            )}
            {trendData.summary.total_entries >= 7 && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-gray-700">
                  You've been consistent with mood tracking. This self-awareness is a powerful tool for healing.
                </p>
              </div>
            )}
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                Remember that grief is not linear. Both good days and challenging days are part of your healing journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};