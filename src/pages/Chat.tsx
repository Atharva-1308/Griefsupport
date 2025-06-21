import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Send, Bot, User, Loader, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  message: string;
  response: string;
  created_at: string;
}

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
    // Add welcome message
    setMessages([
      {
        type: 'bot',
        content: "Hello, I'm Hope, your AI grief counselor. I'm here to listen and support you through your grief journey with compassion and understanding. How are you feeling today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await api.get('/chat/history?limit=10');
      // Convert history to chat messages format
      const historyMessages: ChatMessage[] = [];
      response.data.forEach((msg: Message) => {
        historyMessages.push({
          type: 'user',
          content: msg.message,
          timestamp: new Date(msg.created_at)
        });
        historyMessages.push({
          type: 'bot',
          content: msg.response,
          timestamp: new Date(msg.created_at)
        });
      });
      if (historyMessages.length > 0) {
        setMessages(prev => [...historyMessages, ...prev]);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
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

  const sendMessage = async (messageText?: string, isVoiceMessage = false) => {
    const textToSend = messageText || inputMessage;
    if ((!textToSend.trim() && !audioBlob) || loading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAudioBlob(null);
    setLoading(true);

    try {
      const response = await api.post('/chat/message', null, {
        params: { message: textToSend }
      });

      const botResponse = response.data.response;
      
      // Generate voice response if voice is enabled
      let audioUrl = undefined;
      if (voiceEnabled) {
        try {
          const voiceResponse = await api.post('/voice/synthesize', null, {
            params: { 
              text: botResponse,
              voice_id: "21m00Tcm4TlvDq8ikWAM" // Rachel - warm voice
            }
          });
          audioUrl = `http://localhost:8000/${voiceResponse.data.audio_file}`;
        } catch (voiceError) {
          console.error('Voice synthesis failed:', voiceError);
        }
      }

      const botMessage: ChatMessage = {
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        audioUrl
      };

      setMessages(prev => [...prev, botMessage]);

      // Auto-play voice response if available
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error('Audio playback failed:', e));
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        type: 'bot',
        content: "I'm sorry, I'm having trouble responding right now. Please know that your feelings are valid and important. If you're in crisis, please reach out to a crisis hotline or emergency services.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error('Audio playback failed:', e));
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Hope - AI Grief Counselor</h1>
              <p className="text-purple-100 mt-1">
                A safe space for compassionate support and understanding
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                voiceEnabled 
                  ? 'bg-white text-purple-600' 
                  : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              <Volume2 className="h-4 w-4" />
              <span className="text-sm">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </div>
                <div className={`rounded-2xl p-4 shadow-lg ${
                  message.type === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-50 text-gray-800 border border-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className={`text-xs ${
                      message.type === 'user' ? 'text-purple-200' : 'text-gray-500'
                    }`}>
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                    {message.audioUrl && (
                      <button
                        onClick={() => playAudio(message.audioUrl!)}
                        className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>Play</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-gray-600">Hope is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-b-xl shadow-lg p-6 border-t border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind... I'm here to listen with compassion and understanding."
              className="w-full resize-none border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              disabled={loading}
            />
            {audioBlob && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">✓ Voice message recorded</p>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gray-100 hover:bg-gray-200'
              } text-gray-700 flex items-center justify-center`}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={(!inputMessage.trim() && !audioBlob) || loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>
          <p className="text-xs text-gray-500">
            {voiceEnabled ? '🔊 Voice responses enabled' : '🔇 Text only'}
          </p>
        </div>
      </div>
    </div>
  );
};