'use client'

/**
 * PreferencesStep Component
 * Configure learning preferences
 */

import { motion } from 'framer-motion'
import { Check, Code, Clock, MessageCircle } from 'lucide-react'
import { 
  LearningPace, 
  CommunicationStyle,
  PROGRAMMING_LANGUAGES 
} from '@/types/onboarding.types'

interface PreferencesStepProps {
  preferredLanguages: string[]
  learningPace: LearningPace
  timeCommitment: number
  communicationStyle: CommunicationStyle
  onUpdate: (data: { 
    preferredLanguages?: string[]
    learningPace?: LearningPace
    timeCommitment?: number
    communicationStyle?: CommunicationStyle
  }) => void
}

const learningPaces: { id: LearningPace; title: string; description: string; icon: string }[] = [
  {
    id: 'relaxed',
    title: 'Relaxed',
    description: 'Learn at a comfortable pace, no rush',
    icon: '🐢'
  },
  {
    id: 'moderate',
    title: 'Moderate',
    description: 'Balanced progress, steady learning',
    icon: '🐇'
  },
  {
    id: 'intensive',
    title: 'Intensive',
    description: 'Fast-paced, immersive learning',
    icon: '🚀'
  }
]

const communicationStyles: { id: CommunicationStyle; title: string; description: string; icon: string }[] = [
  {
    id: 'concise',
    title: 'Concise',
    description: 'Short, to-the-point explanations',
    icon: '⚡'
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Mix of brief and detailed info',
    icon: '⚖️'
  },
  {
    id: 'detailed',
    title: 'Detailed',
    description: 'In-depth, comprehensive explanations',
    icon: '📚'
  }
]

export default function PreferencesStep({
  preferredLanguages,
  learningPace,
  timeCommitment,
  communicationStyle,
  onUpdate
}: PreferencesStepProps) {
  const toggleLanguage = (langId: string) => {
    if (preferredLanguages.includes(langId)) {
      onUpdate({ preferredLanguages: preferredLanguages.filter(l => l !== langId) })
    } else {
      onUpdate({ preferredLanguages: [...preferredLanguages, langId] })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Customize Your Learning Experience
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Let's fine-tune your preferences. These settings help us personalize your journey, 
          but you can change them anytime!
        </p>
      </motion.div>

      <div className="space-y-10">
        {/* Programming Languages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Which languages would you like to explore?
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Select all languages you're interested in learning (you can add more later)
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {PROGRAMMING_LANGUAGES.map((lang) => {
              const isSelected = preferredLanguages.includes(lang.id)
              
              return (
                <button
                  key={lang.id}
                  onClick={() => toggleLanguage(lang.id)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  <div className="text-2xl mb-1 text-center">{lang.icon}</div>
                  <div className="text-xs font-medium text-center text-gray-800 dark:text-gray-200">
                    {lang.name}
                  </div>
                </button>
              )
            })}
          </div>
          
          {preferredLanguages.length > 0 && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              ✓ {preferredLanguages.length} language{preferredLanguages.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </motion.div>

        {/* Learning Pace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              What's your preferred learning pace?
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {learningPaces.map((pace) => (
              <button
                key={pace.id}
                onClick={() => onUpdate({ learningPace: pace.id })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  learningPace === pace.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300'
                }`}
              >
                <div className="text-3xl mb-2">{pace.icon}</div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                  {pace.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pace.description}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Time Commitment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              How much time can you dedicate per week?
            </h3>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {timeCommitment} hours/week
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {timeCommitment < 3 ? '🐢 Taking it easy' :
                 timeCommitment < 7 ? '⚖️ Balanced approach' :
                 timeCommitment < 15 ? '🚀 Committed learner' :
                 '⚡ Intensive mode!'}
              </span>
            </div>
            
            <input
              type="range"
              min="1"
              max="30"
              value={timeCommitment}
              onChange={(e) => onUpdate({ timeCommitment: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>1 hour</span>
              <span>15 hours</span>
              <span>30 hours</span>
            </div>
            
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              💡 This helps us recommend appropriate challenge lengths and study sessions. 
              Don't worry—this is just a guideline, not a strict commitment!
            </p>
          </div>
        </motion.div>

        {/* Communication Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              How do you prefer explanations?
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            This affects how the AI mentor communicates with you
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            {communicationStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => onUpdate({ communicationStyle: style.id })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  communicationStyle === style.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300'
                }`}
              >
                <div className="text-3xl mb-2">{style.icon}</div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                  {style.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {style.description}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        {preferredLanguages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              📋 Your Learning Preferences
            </h4>
            
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <strong>Languages:</strong> {preferredLanguages.length} selected
              </div>
              <div>
                <strong>Pace:</strong> {learningPaces.find(p => p.id === learningPace)?.title}
              </div>
              <div>
                <strong>Time commitment:</strong> {timeCommitment} hours/week
              </div>
              <div>
                <strong>Communication:</strong> {communicationStyles.find(s => s.id === communicationStyle)?.title}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
