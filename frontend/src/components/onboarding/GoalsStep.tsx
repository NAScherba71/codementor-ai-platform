'use client'

/**
 * GoalsStep Component
 * Select learning goals
 */

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { SkillLevel, LEARNING_GOALS } from '@/types/onboarding.types'

interface GoalsStepProps {
  skillLevel: SkillLevel | null
  goals: string[]
  onUpdate: (data: { goals: string[] }) => void
}

export default function GoalsStep({
  skillLevel,
  goals,
  onUpdate
}: GoalsStepProps) {
  const availableGoals = skillLevel ? LEARNING_GOALS[skillLevel] : []

  const toggleGoal = (goalId: string) => {
    if (goals.includes(goalId)) {
      onUpdate({ goals: goals.filter(g => g !== goalId) })
    } else {
      onUpdate({ goals: [...goals, goalId] })
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
          What Are Your Learning Goals?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select all that interest you. This helps us create your personalized learning path. 
          You can choose multiple goals—the more we know, the better we can help!
        </p>
      </motion.div>

      {availableGoals.length === 0 ? (
        <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please select your skill level first to see available goals.
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {availableGoals.map((goal, index) => {
              const isSelected = goals.includes(goal.id)
              
              return (
                <motion.button
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => toggleGoal(goal.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-3xl ${
                      isSelected 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {goal.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                          {goal.title}
                        </h4>
                        
                        {isSelected && (
                          <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-2">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {goal.description}
                      </p>
                      
                      <div className="mt-3">
                        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          {goal.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Selected goals summary */}
          {goals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                🎯 Your Selected Goals ({goals.length})
              </h4>
              
              <div className="flex flex-wrap gap-2">
                {goals.map(goalId => {
                  const goal = availableGoals.find(g => g.id === goalId)
                  if (!goal) return null
                  
                  return (
                    <div
                      key={goalId}
                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-xl">{goal.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {goal.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleGoal(goalId)
                        }}
                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
              
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Based on these goals, we'll create a personalized learning path with relevant 
                challenges, projects, and resources to help you achieve them.
              </p>
            </motion.div>
          )}

          {/* Encouragement message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 <strong>Tip:</strong> It's totally fine to have multiple goals! Learning to code 
              opens up many possibilities. Choose what excites you most right now—you can always 
              explore more later.
            </p>
          </motion.div>

          {goals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl"
            >
              <p className="text-gray-600 dark:text-gray-400">
                👆 Select at least one goal to continue
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
