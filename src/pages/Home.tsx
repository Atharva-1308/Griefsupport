import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, BookOpen, TrendingUp, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'AI Grief Counselor',
      description: 'Chat with our compassionate AI trained to provide grief support and guidance.'
    },
    {
      icon: BookOpen,
      title: 'Digital Journal',
      description: 'Express your thoughts through writing or voice recordings in a safe space.'
    },
    {
      icon: TrendingUp,
      title: 'Mood Tracking',
      description: 'Monitor your emotional journey with daily mood check-ins and analytics.'
    },
    {
      icon: Users,
      title: 'Peer Support',
      description: 'Connect with others who understand your experience in supportive chat rooms.'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data is secure with anonymous login options and end-to-end encryption.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            You're Not Alone in Your
            <span className="text-purple-600 block">Grief Journey</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            GriefCare AI provides compassionate support through AI counseling, journaling, 
            mood tracking, and peer connections. Take the first step toward healing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start Your Healing Journey
            </Link>
            <Link
              to="/login"
              className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-all duration-300"
            >
              Continue Anonymously
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Comprehensive Grief Support
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to process grief and find your path to healing
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <feature.icon className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <Heart className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-4xl font-bold mb-6">
            Take the First Step Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Grief is a journey, not a destination. Let us walk alongside you 
            with compassionate AI support and a caring community.
          </p>
          <Link
            to="/register"
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Begin Your Journey
          </Link>
        </motion.div>
      </section>
    </div>
  );
};