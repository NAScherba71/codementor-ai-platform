'use client'

/**
 * IntroductionStep Component
 * Welcoming introduction to CodeMentor platform
 */

import { motion } from 'framer-motion'
import { Sparkles, Code, Users, Trophy, Clock } from 'lucide-react'

interface IntroductionStepProps {
  onNext: () => void
}

export default function IntroductionStep({ onNext }: IntroductionStepProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to CodeMentor!
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your personal AI-powered learning companion for becoming a better programmer
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
          What is CodeMentor?
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Think of CodeMentor as your friendly coding companion who's here to help you learn at your own pace. 
          Whether you're writing your first line of code or preparing for advanced interviews, 
          we've got your back. There's no pressure here—everyone starts somewhere, and we're here to 
          support you every step of the way!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-gray-200">
          How We Help You Learn
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* AI Mentorship */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-transparent hover:border-blue-500 transition-all"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              AI Mentorship
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Like having a patient tutor available 24/7. Ask questions, get explanations in simple terms, 
              and learn concepts at your own pace without any judgment.
            </p>
          </motion.div>

          {/* Code Review */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-transparent hover:border-purple-500 transition-all"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Code Review
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Practice by doing! Write code, solve challenges, and get helpful feedback. 
              Think of it as friendly suggestions to help you improve, not criticism.
            </p>
          </motion.div>

          {/* Personalized Path */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-transparent hover:border-green-500 transition-all"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Your Personal Path
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Everyone learns differently. We'll create a custom learning journey based on 
              your goals, experience level, and interests. No one-size-fits-all here!
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8 mb-8"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Remember: There Are No Wrong Answers!
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              This setup takes just <strong>3-5 minutes</strong>, and it helps us understand how to 
              support you best. You can always change your preferences later, so don't overthink it!
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Think of this as a conversation</strong>, not a test. We're just getting to know 
              you so we can make your learning experience as smooth and enjoyable as possible.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-8"
      >
        <Clock className="w-5 h-5" />
        <span className="text-sm">Takes about 3-5 minutes to complete</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="text-center"
      >
        <button
          onClick={onNext}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Let's Get Started! 🚀
        </button>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Ready when you are—no rush!
        </p>
      </motion.div>
    </div>
  )
}
