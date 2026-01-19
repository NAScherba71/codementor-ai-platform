'use client'

/**
 * CompletionStep Component
 * Summary and personalized recommendations
 */

import { motion } from 'framer-motion'
import { useState } from 'react'
import Confetti from 'react-confetti'
import { 
  Sparkles, 
  Target, 
  Code, 
  BookOpen, 
  Trophy,
  ArrowRight,
  Zap
} from 'lucide-react'
import { 
  OnboardingData,
  PROGRAMMING_LANGUAGES,
  LEARNING_GOALS
} from '@/types/onboarding.types'

interface CompletionStepProps {
  onboardingData: OnboardingData
  recommendations?: {
    welcomeMessage: string
    suggestedChallenges: string[]
    suggestedLearningPaths: string[]
    suggestedFeatures: string[]
  }
  onComplete: () => void
  isLoading?: boolean
}

export default function CompletionStep({
  onboardingData,
  recommendations,
  onComplete,
  isLoading = false
}: CompletionStepProps) {
  const [showConfetti, setShowConfetti] = useState(true)

  // Stop confetti after 5 seconds
  setTimeout(() => setShowConfetti(false), 5000)

  const selectedLanguage = PROGRAMMING_LANGUAGES.find(
    lang => lang.id === onboardingData.primaryLanguage
  )

  const selectedGoals = onboardingData.skillLevel 
    ? LEARNING_GOALS[onboardingData.skillLevel].filter(
        goal => onboardingData.goals.includes(goal.id)
      )
    : []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1000}
          height={typeof window !== 'undefined' ? window.innerHeight : 1000}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-6 shadow-lg">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          You're All Set! 🎉
        </h2>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your personalized learning journey is ready. Let's start building amazing things!
        </p>
      </motion.div>

      {/* Welcome Message */}
      {recommendations?.welcomeMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800"
        >
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Your Personalized Welcome
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {recommendations.welcomeMessage}
          </p>
        </motion.div>
      )}

      {/* Your Profile Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Your Learning Profile
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skill Level & Language */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                  Skill Level & Language
                </h4>
                <p className="text-sm text-gray-500">Your starting point</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {onboardingData.skillLevel === 'beginner' ? '🌱' :
                   onboardingData.skillLevel === 'intermediate' ? '🚀' : '⚡'}
                </span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {onboardingData.skillLevel}
                </span>
              </div>
              
              {selectedLanguage && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedLanguage.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedLanguage.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Learning Style */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                  Learning Style
                </h4>
                <p className="text-sm text-gray-500">How you'll learn</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {onboardingData.learningStyle === 'ai-mentorship' ? '🤖' :
                   onboardingData.learningStyle === 'code-review' ? '✍️' : '⭐'}
                </span>
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {onboardingData.learningStyle?.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Goals */}
          {selectedGoals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    Your Goals
                  </h4>
                  <p className="text-sm text-gray-500">What you want to achieve</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {selectedGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-xl">{goal.icon}</span>
                    <span className="text-sm">{goal.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Suggested Features */}
      {recommendations?.suggestedFeatures && recommendations.suggestedFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-600" />
            Recommended Features for You
          </h3>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recommendations.suggestedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {feature.replace('-', ' ')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          What's Next?
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Explore Your Dashboard
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get familiar with your personalized learning dashboard and available features
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Start Your First Challenge
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We've picked some beginner-friendly challenges perfect for your level
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Track Your Progress
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Watch your XP grow, earn achievements, and see your skills improve
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Setting things up...
            </>
          ) : (
            <>
              <Trophy className="w-6 h-6" />
              Start Learning Now!
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          You can change any of these settings later from your profile
        </p>
      </motion.div>
    </div>
  )
}
