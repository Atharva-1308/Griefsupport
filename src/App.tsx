import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { AnonymousChat } from './components/AnonymousChat';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Journal } from './pages/Journal';
import { MoodTracker } from './pages/MoodTracker';
import { Support } from './pages/Support';
import { Resources } from './pages/Resources';
import { Analytics } from './pages/Analytics';
import { Reminders } from './pages/Reminders';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-colors overflow-x-hidden">
              <Navbar />
              <main className="w-full px-4 py-4 md:py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/anonymous-chat" element={<AnonymousChat />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } />
                  <Route path="/journal" element={
                    <ProtectedRoute>
                      <Journal />
                    </ProtectedRoute>
                  } />
                  <Route path="/mood" element={
                    <ProtectedRoute>
                      <MoodTracker />
                    </ProtectedRoute>
                  } />
                  <Route path="/support" element={
                    <ProtectedRoute>
                      <Support />
                    </ProtectedRoute>
                  } />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/reminders" element={
                    <ProtectedRoute>
                      <Reminders />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Toaster 
                position="top-right"
                toastOptions={{
                  className: 'dark:bg-gray-800 dark:text-white',
                  duration: 4000,
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;