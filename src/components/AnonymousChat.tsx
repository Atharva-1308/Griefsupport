import React, { useState, useEffect, useRef } from 'react';
import { api, checkBackendHealth } from '../services/api';
import { Send, Bot, User, Loader, Mic, MicOff, Volume2, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isVoice?: boolean;
}

export const AnonymousChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    // Generate session ID for anonymous user
    const newSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Check backend connection
    await checkConnection();
    
    // Add welcome message
    setMessages([
      {
        type: 'bot',
        content: "Hello, I'm Hope, your AI grief counselor. I'm here to provide anonymous, compassionate support. You don't need to sign up - your privacy is completely protected. How are you feeling today?",
        timestamp: new Date()
      }
    ]);
  };

  const checkConnection = async () => {
    try {
      const isHealthy = await checkBackendHealth();
      setBackendConnected(isHealthy);
      if (!isHealthy) {
        setConnectionError('Backend server is not responding. Please ensure it is running.');
      } else {
        setConnectionError('');
      }
    } catch (error) {
      setBackendConnected(false);
      setConnectionError('Failed to connect to backend server.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    // Check backend connection before sending
    if (backendConnected === false) {
      toast.error('Cannot send message: Backend server is not connected');
      return;
    }

    const userMessage: ChatMessage = {
      type: 'user',
      content: isVoiceMessage ? 'Voice message' : textToSend,
      timestamp: new Date(),
      isVoice: isVoiceMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      let response;
      
      if (audioBlob) {
        // Send voice message
        const formData = new FormData();
        formData.append('voice_file', audioBlob, 'recording.wav');
        if (sessionId) {
          formData.append('session_id', sessionId);
        }

        response = await api.post('/chat/voice-message/anonymous', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setAudioBlob(null);
      } else {
        // Send text message
        response = await api.post('/chat/message/anonymous', null, {
          params: { 
            message: textToSend,
            session_id: sessionId
          }
        });
      }

      const botResponse = response.data.response;
      
      // Generate voice response if voice is enabled
      let audioUrl = undefined;
      if (voiceEnabled && backendConnected) {
        try {
          const voiceResponse = await api.post('/voice/synthesize', null, {
            params: { 
              text: botResponse,
              voice_id: "21m00Tcm4TlvDq8ikWAM" // Rachel - warm voice
            }
          });
          
          if (voiceResponse.data.status === 'success') {
            audioUrl = `${api.defaults.baseURL?.replace('/api', '')}/${voiceResponse.data.audio_file}`;
          }
        } catch (voiceError) {
          console.error('Voice synthesis failed:', voiceError);
          // Don't show error to user, just continue without voice
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
      
      // Provide fallback response when backend is unavailable
      let errorMessage = "I'm sorry, I'm having trouble connecting to my support systems right now. However, I want you to know that your feelings are completely valid and important.";
      
      if (error.name === 'NetworkError') {
        errorMessage += "\n\nWhile I work on reconnecting, please remember:\n• You are not alone in your grief journey\n• It's okay to feel whatever you're feeling right now\n• Healing takes time, and there's no 'right' way to grieve\n• Your loved one's memory lives on through you";
        
        // Try to reconnect
        setTimeout(checkConnection, 2000);
      }
      
      errorMessage += "\n\nIf you're in immediate crisis, please reach out to:\n• 988 (Suicide & Crisis Lifeline)\n• Text HOME to 741741 (Crisis Text Line)\n• Your local emergency services";

      const errorBotMessage: ChatMessage = {
        type: 'bot',
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorBotMessage]);
      
      toast.error('Connection issue - provided offline support');
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

  const retryConnection = () => {
    checkConnection();
    toast.promise(
      checkBackendHealth(),
      {
        loading: 'Checking connection...',
        success: 'Connected to server!',
        error: 'Still unable to connect'
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-800 dark:to-blue-800 text-white rounded-t-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Anonymous Grief Support</h1>
              <p className="text-purple-100 mt-1">
                Private, secure, and completely anonymous - no signup required
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              backendConnected === true 
                ? 'bg-green-100 text-green-800' 
                : backendConnected === false 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {backendConnected === true ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connected</span>
                </>
              ) : backendConnected === false ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>Offline</span>
                  <button onClick={retryConnection} className="ml-1">
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              )}
            </div>
            
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              🔒 Anonymous
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              disabled={backendConnected === false}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                voiceEnabled 
                  ? 'bg-white text-purple-600' 
                  : 'bg-purple-500 text-white hover:bg-purple-400'
              } ${backendConnected === false ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Volume2 className="h-4 w-4" />
              <span className="text-sm">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
          </div>
        </div>
        
        {connectionError && (
          <div className="mt-3 p-2 bg-red-100 text-red-800 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {connectionError}
          </div>
        )}
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto p-6 space-y-4">
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
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                }`}>
                  {message.isVoice ? (
                    <div className="flex items-center space-x-2">
                      <Mic className="h-4 w-4" />
                      <span className="italic">Voice message</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className={`text-xs ${
                      message.type === 'user' ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                    {message.audioUrl && (
                      <button
                        onClick={() => playAudio(message.audioUrl!)}
                        className="flex items-center space-x-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
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
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-gray-600 dark:text-gray-300">Hope is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-b-xl shadow-lg p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind... I'm here to listen with compassion and understanding."
              className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              disabled={loading}
            />
            {audioBlob && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm">✓ Voice message recorded</p>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={backendConnected === false}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              } text-gray-700 dark:text-gray-300 flex items-center justify-center ${
                backendConnected === false ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line • Completely anonymous and private
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {voiceEnabled && backendConnected ? '🔊 Voice responses enabled' : '🔇 Text only'}
          </p>
        </div>
      </div>
    </div>
  );
};