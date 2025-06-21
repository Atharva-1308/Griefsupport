import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, MessageCircle, Heart, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface SupportRoom {
  id: string;
  name: string;
  description: string;
}

interface SupportMessage {
  id: number;
  username: string;
  message: string;
  created_at: string;
}

export const Support: React.FC = () => {
  const [rooms, setRooms] = useState<SupportRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('general');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom);
      connectWebSocket(selectedRoom);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/support/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch support rooms:', error);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const response = await api.get(`/support/rooms/${roomId}/messages?limit=50`);
      setMessages(response.data.reverse());
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const connectWebSocket = (roomId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // For demo purposes, we'll simulate WebSocket functionality
    // In a real implementation, you'd connect to the WebSocket endpoint
    console.log(`Connecting to WebSocket for room: ${roomId}`);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // For demo purposes, we'll add the message locally
    // In a real implementation, this would be sent via WebSocket
    const demoMessage: SupportMessage = {
      id: Date.now(),
      username: 'You',
      message: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, demoMessage]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Peer Support Spaces</h1>
              <p className="text-purple-100 mt-2">
                Connect with others who understand your journey
              </p>
            </div>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Room List */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Support Rooms</h2>
            </div>
            <div className="overflow-y-auto h-full">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors ${
                    selectedRoom === room.id ? 'bg-purple-100 border-purple-300' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <MessageCircle className={`h-5 w-5 mt-1 ${
                      selectedRoom === room.id ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <h3 className={`font-medium ${
                        selectedRoom === room.id ? 'text-purple-800' : 'text-gray-800'
                      }`}>
                        {room.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {room.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">
                  {rooms.find(r => r.id === selectedRoom)?.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {rooms.find(r => r.id === selectedRoom)?.description}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Start the conversation
                  </h3>
                  <p className="text-gray-500">
                    Be the first to share in this supportive space.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {message.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-800">
                            {message.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(message.created_at), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-700">{message.message}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share your thoughts with the community..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line. Please be respectful and supportive.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Community Guidelines</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Be respectful and compassionate to all members</li>
          <li>• Share your experiences, but respect others' privacy</li>
          <li>• Avoid giving medical or legal advice</li>
          <li>• If you're in crisis, please contact emergency services or a crisis hotline</li>
          <li>• Report any inappropriate behavior to moderators</li>
        </ul>
      </div>
    </div>
  );
};