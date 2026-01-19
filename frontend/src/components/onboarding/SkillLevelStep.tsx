'use client'

/**
 * SkillLevelStep Component
 * Select skill level and primary programming language
 */

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { SkillLevel, PROGRAMMING_LANGUAGES } from '@/types/onboarding.types'

interface SkillLevelStepProps {
  skillLevel: SkillLevel | null
  primaryLanguage: string | null
  onUpdate: (data: { skillLevel?: SkillLevel; primaryLanguage?: string }) => void
}

const skillLevels = [
  {
    id: 'beginner' as SkillLevel,
    title: 'Beginner',
    icon: '🌱',
    description: 'Just starting out or learning the basics',
    details: [
      'New to programming',
      'Learning first language',
      'Understanding basic concepts'
    ]
  },
  {
    id: 'intermediate' as SkillLevel,
    title: 'Intermediate',
    icon: '🚀',
    description: 'Comfortable with basics, ready to level up',
    details: [
      'Know one or more languages',
      'Built some projects',
      'Ready for challenges'
    ]
  },
  {
    id: 'advanced' as SkillLevel,
    title: 'Advanced',
    icon: '⚡',
    description: 'Experienced and looking to master skills',
    details: [
      'Solid programming foundation',
      'Complex projects completed',
      'Seeking expert knowledge'
    ]
  }
]

export default function SkillLevelStep({
  skillLevel,
  primaryLanguage,
  onUpdate
}: SkillLevelStepProps) {
  // Filter languages based on skill level
  const getLanguagesForSkillLevel = () => {
    if (!skillLevel) return PROGRAMMING_LANGUAGES.filter(lang => lang.category === 'popular')
    
    return PROGRAMMING_LANGUAGES.filter(lang => {
      if (skillLevel === 'beginner') {
        return lang.difficulty === 'beginner'
      } else if (skillLevel === 'intermediate') {
        return lang.difficulty === 'beginner' || lang.difficulty === 'intermediate'
      }
      return true // Advanced users can choose any language
    })
  }

  const availableLanguages = getLanguagesForSkillLevel()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Let's Find Your Starting Point
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          This helps us match you with the right challenges and learning materials. 
          Don't worry—you can always adjust this later!
        </p>
      </motion.div>

      {/* Skill Level Selection */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
          What's your current skill level?
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {skillLevels.map((level, index) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                onUpdate({ skillLevel: level.id })
                // Reset language if not compatible
                if (primaryLanguage) {
                  const isCompatible = PROGRAMMING_LANGUAGES
                    .filter(lang => 
                      level.id === 'beginner' ? lang.difficulty === 'beginner' :
                      level.id === 'intermediate' ? lang.difficulty !== 'advanced' :
                      true
                    )
                    .some(lang => lang.id === primaryLanguage)
                  
                  if (!isCompatible) {
                    onUpdate({ skillLevel: level.id, primaryLanguage: null })
                  }
                }
              }}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                skillLevel === level.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              {skillLevel === level.id && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className="text-5xl mb-4">{level.icon}</div>
              
              <h4 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
                {level.title}
              </h4>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {level.description}
              </p>
              
              <ul className="space-y-2">
                {level.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Primary Language Selection */}
      {skillLevel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Which programming language would you like to start with?
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose your main focus language. You can learn others later—we support many languages!
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {availableLanguages.map((lang, index) => (
              <motion.button
                key={lang.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onUpdate({ primaryLanguage: lang.id })}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  primaryLanguage === lang.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                {primaryLanguage === lang.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className="text-3xl mb-2 text-center">{lang.icon}</div>
                <div className="text-sm font-medium text-center text-gray-800 dark:text-gray-200">
                  {lang.name}
                </div>
                
                {lang.difficulty === 'beginner' && (
                  <div className="mt-2 text-xs text-center">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                      Beginner-friendly
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          
          {skillLevel === 'beginner' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <p className="text-sm text-green-800 dark:text-green-200">
                💡 <strong>Tip for beginners:</strong> Python and JavaScript are great starter languages 
                because they're beginner-friendly and widely used. But any language you choose will 
                teach you the fundamentals of programming!
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Reassurance Message */}
      {skillLevel && primaryLanguage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <p className="text-gray-700 dark:text-gray-300">
            ✨ Great choice! You've picked <strong>{skillLevels.find(l => l.id === skillLevel)?.title}</strong> level 
            and <strong>{availableLanguages.find(l => l.id === primaryLanguage)?.name}</strong> as your primary language. 
            We'll tailor everything to match your experience and goals.
          </p>
        </motion.div>
      )}
    </div>
  )
}
