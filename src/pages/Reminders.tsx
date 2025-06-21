import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, Plus, Trash2, Calendar, Bell, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Reminder {
  id: number;
  title: string;
  message: string;
  scheduled_time: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  is_sent: boolean;
}

interface ReminderTemplate {
  title: string;
  message: string;
  suggested_time: string;
  recurrence: string;
}

export const Reminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('daily');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReminders();
    fetchTemplates();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await api.get('/reminders/list');
      setReminders(response.data);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/reminders/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const createReminder = async () => {
    if (!newTitle.trim() || !newMessage.trim() || !newDate || !newTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const scheduledDateTime = new Date(`${newDate}T${newTime}`);
      
      await api.post('/reminders/create', null, {
        params: {
          title: newTitle,
          message: newMessage,
          scheduled_time: scheduledDateTime.toISOString(),
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
        },
      });

      toast.success('Reminder created successfully');
      setShowNewReminder(false);
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error('Failed to create reminder:', error);
      toast.error('Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (reminderId: number) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await api.delete(`/reminders/${reminderId}`);
      toast.success('Reminder deleted successfully');
      fetchReminders();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const useTemplate = (template: ReminderTemplate) => {
    setNewTitle(template.title);
    setNewMessage(template.message);
    setNewTime(template.suggested_time);
    setIsRecurring(template.recurrence !== 'once');
    setRecurrencePattern(template.recurrence === 'once' ? 'daily' : template.recurrence);
    setShowNewReminder(true);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewMessage('');
    setNewTime('');
    setNewDate('');
    setIsRecurring(false);
    setRecurrencePattern('daily');
  };

  const getRecurrenceLabel = (pattern?: string) => {
    switch (pattern) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'Once';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Reminders & Encouragement</h1>
          </div>
          <button
            onClick={() => setShowNewReminder(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Reminder</span>
          </button>
        </div>

        <p className="text-gray-600 mb-8">
          Set up gentle reminders for self-care, mood check-ins, and encouragement throughout your healing journey.
        </p>

        <AnimatePresence>
          {showNewReminder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-6 rounded-lg mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Reminder</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Daily Check-in"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="e.g., How are you feeling today? Take a moment to check in with yourself."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Recurring reminder</span>
                  </label>

                  {isRecurring && (
                    <select
                      value={recurrencePattern}
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={createReminder}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Reminder'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewReminder(false);
                      resetForm();
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Templates */}
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Templates</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => useTemplate(template)}
            >
              <h3 className="font-semibold text-gray-800 mb-2">{template.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{template.message}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Suggested: {template.suggested_time}</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {getRecurrenceLabel(template.recurrence)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Reminders */}
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Reminders</h2>
        
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No reminders set</h3>
            <p className="text-gray-500">Create your first reminder to get gentle nudges for self-care.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 p-6 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{reminder.title}</h3>
                      {reminder.is_recurring && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                          <Repeat className="h-3 w-3" />
                          <span>{getRecurrenceLabel(reminder.recurrence_pattern)}</span>
                        </span>
                      )}
                      {reminder.is_sent && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Sent
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{reminder.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(reminder.scheduled_time), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(reminder.scheduled_time), 'h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};