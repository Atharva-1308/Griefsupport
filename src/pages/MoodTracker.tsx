import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrendingUp, Calendar, Smile, Frown, Meh, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface MoodEntry {
  id: number;
  mood_value: number;
  mood_emoji?: string;
  notes?: string;
  created_at: string;
}

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Very Sad' },
  { value: 2, emoji: '😔', label: 'Sad' },
  { value: 3, emoji: '😕', label: 'Down' },
  { value: 4, emoji: '😐', label: 'Neutral' },
  { value: 5, emoji: '🙂', label: 'Okay' },
  { value: 6, emoji: '😊', label: 'Good' },
  { value: 7, emoji: '😄', label: 'Happy' },
  { value: 8, emoji: '😁', label: 'Very Happy' },
  { value: 9, emoji: '🤗', label: 'Joyful' },
  { value: 10, emoji: '🥰', label: 'Excellent' },
];

export const MoodTracker: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);
  const [selectedMood, setSelectedMood] = useState<number>(5);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🙂');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchTodayEntry();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await api.get('/mood/entries?limit=30');
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch mood entries:', error);
    }
  };

  const fetchTodayEntry = async () => {
    try {
      const response = await api.get('/mood/entries/today');
      setTodayEntry(response.data);
    } catch (error) {
      // No entry for today is expected initially
    }
  };

  const saveMoodEntry = async () => {
    setLoading(true);

    try {
      await api.post('/mood/entries', {
        mood_value: selectedMood,
        mood_emoji: selectedEmoji,
        notes: notes.trim() || null,
      });

      toast.success('Mood entry saved successfully');
      setNotes('');
      fetchEntries();
      fetchTodayEntry();
    } catch (error) {
      console.error('Failed to save mood entry:', error);
      toast.error('Failed to save mood entry');
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood: number, emoji: string) => {
    setSelectedMood(mood);
    setSelectedEmoji(emoji);
  };

  const getMoodColor = (value: number) => {
    if (value <= 3) return 'text-red-500';
    if (value <= 5) return 'text-yellow-500';
    if (value <= 7) return 'text-blue-500';
    return 'text-green-500';
  };

  const getMoodBgColor = (value: number) => {
    if (value <= 3) return 'bg-red-50 border-red-200';
    if (value <= 5) return 'bg-yellow-50 border-yellow-200';
    if (value <= 7) return 'bg-blue-50 border-blue-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800">Mood Tracker</h1>
        </div>

        <p className="text-gray-600 mb-8">
          Track your emotional journey day by day. Understanding your mood patterns can help in your healing process.
        </p>

        {todayEntry ? (
          <div className={`p-6 rounded-lg border-2 ${getMoodBgColor(todayEntry.mood_value)}`}>
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-4xl">{todayEntry.mood_emoji}</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Today's Mood Recorded</h3>
                <p className={`text-lg font-medium ${getMoodColor(todayEntry.mood_value)}`}>
                  {todayEntry.mood_value}/10 - {moodEmojis.find(m => m.value === Math.round(todayEntry.mood_value))?.label}
                </p>
              </div>
            </div>
            {todayEntry.notes && (
              <p className="text-gray-700 bg-white p-3 rounded-lg">
                "{todayEntry.notes}"
              </p>
            )}
            <p className="text-sm text-gray-500 mt-3">
              Recorded at {format(new Date(todayEntry.created_at), 'h:mm a')}
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-xl border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">How are you feeling today?</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-4">
                  Select your mood (1 = Very Sad, 10 = Excellent)
                </label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                  {moodEmojis.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value, mood.emoji)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedMood === mood.value
                          ? 'border-purple-500 bg-purple-100 scale-110'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{mood.emoji}</div>
                      <div className="text-xs text-gray-600">{mood.value}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <span className="text-lg font-medium text-gray-700">
                    Selected: {selectedMood}/10 - {moodEmojis.find(m => m.value === selectedMood)?.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What's contributing to your mood today? Any thoughts or feelings you'd like to note..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={saveMoodEntry}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Saving...' : 'Save Mood Entry'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Mood History</h2>
        
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No mood entries yet</h3>
            <p className="text-gray-500">Start tracking your mood to see patterns over time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getMoodBgColor(entry.mood_value)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{entry.mood_emoji}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-semibold ${getMoodColor(entry.mood_value)}`}>
                          {entry.mood_value}/10
                        </span>
                        <span className="text-gray-600">
                          {moodEmojis.find(m => m.value === Math.round(entry.mood_value))?.label}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-gray-700 mt-1">"{entry.notes}"</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(entry.created_at), 'MMM d')}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(entry.created_at), 'h:mm a')}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="mt-6 text-center">
            <button className="text-purple-600 hover:text-purple-700 font-medium">
              View Analytics →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};