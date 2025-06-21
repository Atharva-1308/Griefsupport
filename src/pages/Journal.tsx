import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Plus, Mic, MicOff, Play, Pause, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface JournalEntry {
  id: number;
  title: string;
  content?: string;
  voice_recording_path?: string;
  is_voice_entry: boolean;
  created_at: string;
  updated_at?: string;
}

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isVoiceEntry, setIsVoiceEntry] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await api.get('/journal/entries');
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      toast.error('Failed to load journal entries');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const saveEntry = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!isVoiceEntry && !newContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (isVoiceEntry && !audioBlob) {
      toast.error('Please record some audio');
      return;
    }

    setLoading(true);

    try {
      if (isVoiceEntry && audioBlob) {
        const formData = new FormData();
        formData.append('title', newTitle);
        formData.append('voice_file', audioBlob, 'recording.wav');

        await api.post('/journal/entries/voice', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post('/journal/entries', {
          title: newTitle,
          content: newContent,
          is_voice_entry: false,
        });
      }

      toast.success('Journal entry saved successfully');
      setShowNewEntry(false);
      setNewTitle('');
      setNewContent('');
      setIsVoiceEntry(false);
      setAudioBlob(null);
      fetchEntries();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await api.delete(`/journal/entries/${entryId}`);
      toast.success('Entry deleted successfully');
      fetchEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Grief Journal</h1>
          </div>
          <button
            onClick={() => setShowNewEntry(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Entry</span>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Express your thoughts and feelings in a safe, private space. You can write or record voice entries.
        </p>

        <AnimatePresence>
          {showNewEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-6 rounded-lg mb-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Give your entry a title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setIsVoiceEntry(false)}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      !isVoiceEntry
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Text Entry
                  </button>
                  <button
                    onClick={() => setIsVoiceEntry(true)}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      isVoiceEntry
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Voice Entry
                  </button>
                </div>

                {!isVoiceEntry ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Thoughts
                    </label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Write about your feelings, memories, or anything on your mind..."
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-20 h-20 rounded-full flex items-center justify-center ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-purple-600 hover:bg-purple-700'
                        } text-white transition-colors`}
                      >
                        {isRecording ? (
                          <MicOff className="h-8 w-8" />
                        ) : (
                          <Mic className="h-8 w-8" />
                        )}
                      </button>
                    </div>
                    <p className="text-gray-600">
                      {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                    </p>
                    {audioBlob && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-800 text-sm">
                          ✓ Recording saved! You can record again to replace it.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={saveEntry}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Entry'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewEntry(false);
                      setNewTitle('');
                      setNewContent('');
                      setIsVoiceEntry(false);
                      setAudioBlob(null);
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

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Your Entries</h2>
        {entries.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No entries yet</h3>
            <p className="text-gray-500">Start your healing journey by writing your first entry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {entry.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.is_voice_entry
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.is_voice_entry ? 'Voice Entry' : 'Text Entry'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {entry.is_voice_entry ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mic className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-800">Voice recording available</span>
                      {entry.voice_recording_path && (
                        <audio controls className="flex-1">
                          <source src={`http://localhost:8000/${entry.voice_recording_path}`} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};