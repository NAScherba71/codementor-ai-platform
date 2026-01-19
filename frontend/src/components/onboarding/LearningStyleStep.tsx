'use client'

/**
 * LearningStyleStep Component
 * Choose learning style preference
 */

import { motion } from 'framer-motion'
import { Check, Bot, FileCheck, Sparkles } from 'lucide-react'
import { LearningStyle } from '@/types/onboarding.types'

interface LearningStyleStepProps {
  learningStyle: LearningStyle | null
  onUpdate: (data: { learningStyle: LearningStyle }) => void
}

const learningStyles = [
  {
    id: 'ai-mentorship' as LearningStyle,
    title: 'AI Mentorship',
    icon: Bot,
    emoji: '🤖',
    tagline: 'Learn with a personal AI tutor',
    description: 'Perfect for understanding concepts deeply',
    features: [
      'Ask questions anytime, get instant explanations',
      'Step-by-step guidance through new concepts',
      'Learn at your own pace without pressure',
      'Get hints when you\'re stuck'
    ],
    bestFor: 'Best for learners who prefer explanations and want to understand the "why" behind code',
    color: 'blue'
  },
  {
    id: 'code-review' as LearningStyle,
    title: 'Code Review',
    icon: FileCheck,
    emoji: '✍️',
    tagline: 'Learn by writing and getting feedback',
    description: 'Perfect for hands-on learners',
    features: [
      'Write code and solve real challenges',
      'Get detailed feedback on your solutions',
      'Learn best practices through practice',
      'Build portfolio projects'
    ],
    bestFor: 'Best for learners who prefer to learn by doing and want practical experience',
    color: 'purple'
  },
  {
    id: 'both' as LearningStyle,
    title: 'Both (Recommended)',
    icon: Sparkles,
    emoji: '⭐',
    tagline: 'Get the best of both worlds',
    description: 'Complete learning experience',
    features: [
      'Understand concepts with AI mentorship',
      'Practice with coding challenges',
      'Get feedback on your solutions',
      'Comprehensive skill development'
    ],
    bestFor: 'Best for most learners—combines theory with practice for complete mastery',
    color: 'green',
    recommended: true
  }
]

export default function LearningStyleStep({
  learningStyle,
  onUpdate
}: LearningStyleStepProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          How Would You Like to Learn?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose the learning approach that fits your style. Don't worry—you can 
          switch between modes anytime!
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {learningStyles.map((style, index) => {
          const isSelected = learningStyle === style.id
          const Icon = style.icon
          const colorClasses = {
            blue: {
              border: 'border-blue-500',
              bg: 'bg-blue-50 dark:bg-blue-900/30',
              iconBg: 'bg-blue-100 dark:bg-blue-900',
              iconColor: 'text-blue-600 dark:text-blue-400',
              badge: 'bg-blue-500'
            },
            purple: {
              border: 'border-purple-500',
              bg: 'bg-purple-50 dark:bg-purple-900/30',
              iconBg: 'bg-purple-100 dark:bg-purple-900',
              iconColor: 'text-purple-600 dark:text-purple-400',
              badge: 'bg-purple-500'
            },
            green: {
              border: 'border-green-500',
              bg: 'bg-green-50 dark:bg-green-900/30',
              iconBg: 'bg-green-100 dark:bg-green-900',
              iconColor: 'text-green-600 dark:text-green-400',
              badge: 'bg-green-500'
            }
          }
          
          const colors = colorClasses[style.color as keyof typeof colorClasses]
          
          return (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              onClick={() => onUpdate({ learningStyle: style.id })}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left h-full ${
                isSelected
                  ? `${colors.border} ${colors.bg} shadow-lg transform scale-105`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {style.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    RECOMMENDED
                  </span>
                </div>
              )}

              {isSelected && (
                <div className={`absolute top-4 right-4 w-8 h-8 ${colors.badge} rounded-full flex items-center justify-center`}>
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon className={`w-8 h-8 ${colors.iconColor}`} />
              </div>
              
              <div className="text-4xl mb-3">{style.emoji}</div>
              
              <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                {style.title}
              </h3>
              
              <p className={`text-sm font-medium mb-3 ${colors.iconColor}`}>
                {style.tagline}
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {style.description}
              </p>
              
              <div className="space-y-2 mb-4">
                {style.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className={`mt-1 ${colors.iconColor}`}>✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                  {style.bestFor}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Additional context based on selection */}
      {learningStyle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {learningStyle === 'ai-mentorship' && (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🤖 Great choice! Here's what AI Mentorship offers:
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                You'll have access to our intelligent AI tutor that can explain concepts in multiple ways 
                until they click. Ask questions in plain English, get code examples, and receive patient, 
                judgment-free guidance. It's like having a tutor available 24/7!
              </p>
            </div>
          )}

          {learningStyle === 'code-review' && (
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                ✍️ Excellent! Here's what Code Review mode includes:
              </h4>
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                You'll solve coding challenges and receive detailed, constructive feedback on your solutions. 
                Learn best practices, discover optimization opportunities, and see how your code compares 
                to different approaches. Build real skills through hands-on practice!
              </p>
            </div>
          )}

          {learningStyle === 'both' && (
            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ⭐ Perfect! You've chosen the complete learning experience:
              </h4>
              <p className="text-green-800 dark:text-green-200 text-sm mb-3">
                You'll get the full CodeMentor experience—learn new concepts with AI guidance, then 
                immediately practice them through coding challenges. This combination ensures you both 
                understand the theory and can apply it in practice.
              </p>
              <p className="text-green-800 dark:text-green-200 text-sm">
                💡 <strong>Why this works best:</strong> Understanding concepts is great, but being able 
                to write code is what makes you a developer. This approach builds both skills simultaneously!
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Reassurance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
      >
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          💡 <strong>Remember:</strong> You can switch between learning modes anytime from your 
          dashboard. This is just your starting preference to help us personalize your experience!
        </p>
      </motion.div>
    </div>
  )
}
