import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Video, Phone, ExternalLink, Star, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Book {
  title: string;
  author: string;
  description: string;
  amazon_link: string;
  rating: number;
  category: string;
}

interface Article {
  title: string;
  author: string;
  url: string;
  summary: string;
  read_time: string;
  category: string;
}

interface Video {
  title: string;
  speaker: string;
  youtube_url: string;
  duration: string;
  description: string;
  category: string;
}

interface Hotline {
  name: string;
  phone: string;
  description: string;
  website: string;
}

export const Resources: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [activeTab, setActiveTab] = useState<'books' | 'articles' | 'videos' | 'hotlines'>('books');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const [booksRes, articlesRes, videosRes, hotlinesRes] = await Promise.all([
        api.get('/resources/books'),
        api.get('/resources/articles'),
        api.get('/resources/videos'),
        api.get('/resources/hotlines'),
      ]);

      setBooks(Array.isArray(booksRes.data) ? booksRes.data : []);
      setArticles(Array.isArray(articlesRes.data) ? articlesRes.data : []);
      setVideos(Array.isArray(videosRes.data) ? videosRes.data : []);
      setHotlines(Array.isArray(hotlinesRes.data) ? hotlinesRes.data : []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      // Set empty arrays as fallback on error
      setBooks([]);
      setArticles([]);
      setVideos([]);
      setHotlines([]);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const tabs = [
    { id: 'books', label: 'Books', icon: BookOpen, count: books.length },
    { id: 'articles', label: 'Articles', icon: BookOpen, count: articles.length },
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'hotlines', label: 'Crisis Support', icon: Phone, count: hotlines.length },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 px-4">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Resource Hub</h1>
          <p className="text-lg md:text-xl text-gray-600">
            Curated resources to support you through your grief journey
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="h-4 md:h-5 w-4 md:w-5" />
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs hidden sm:inline ${
                activeTab === tab.id ? 'bg-purple-500' : 'bg-gray-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === 'books' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {books.map((book, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium inline-block">
                      {book.category}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 line-clamp-2">{book.title}</h3>
                  <div className="flex items-center space-x-1 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{book.author}</span>
                  </div>
                  <div className="flex items-center space-x-1 mb-3">
                    {renderStars(book.rating)}
                    <span className="text-sm text-gray-600 ml-2">{book.rating}</span>
                  </div>
                  <p className="text-gray-700 text-xs md:text-sm mb-4 leading-relaxed line-clamp-3">{book.description}</p>
                  <a
                    href={book.amazon_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm font-medium w-full justify-center"
                  >
                    <span>View on Amazon</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'articles' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {articles.map((article, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 md:p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          {article.category}
                        </span>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{article.read_time}</span>
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">{article.title}</h3>
                      <div className="flex items-center space-x-1 mb-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{article.author}</span>
                      </div>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">{article.summary}</p>
                    </div>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm font-medium"
                  >
                    <span>Read Article</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'videos' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {videos.map((video, index) => (
                <div key={index} className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      {video.category}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{video.duration}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{video.title}</h3>
                  <div className="flex items-center space-x-1 mb-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{video.speaker}</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">{video.description}</p>
                  <a
                    href={video.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <Video className="h-4 w-4" />
                    <span>Watch Video</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'hotlines' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <Phone className="h-8 w-8 text-red-600" />
                  <h2 className="text-2xl font-bold text-red-800">Crisis Support</h2>
                </div>
                <p className="text-red-700 mb-4">
                  If you're in immediate danger or having thoughts of self-harm, please reach out for help immediately.
                </p>
                <div className="bg-red-100 p-4 rounded-lg">
                  <p className="text-red-800 font-semibold">Emergency: Call 911 or go to your nearest emergency room</p>
                </div>
              </div>

              {hotlines.map((hotline, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{hotline.name}</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-semibold text-blue-600">{hotline.phone}</span>
                  </div>
                  <p className="text-gray-700 mb-4">{hotline.description}</p>
                  <a
                    href={hotline.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};