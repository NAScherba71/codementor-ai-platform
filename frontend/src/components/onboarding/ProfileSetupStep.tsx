'use client'

/**
 * ProfileSetupStep Component
 * Optional profile customization
 */

import { motion } from 'framer-motion'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { ProfileVisibility } from '@/types/onboarding.types'

interface ProfileSetupStepProps {
  bio: string
  avatar: string | null
  profileVisibility: ProfileVisibility
  onUpdate: (data: {
    bio?: string
    avatar?: string | null
    profileVisibility?: ProfileVisibility
  }) => void
}

const avatarOptions = [
  { id: 'avatar1', emoji: '👨‍💻', alt: 'Developer 1' },
  { id: 'avatar2', emoji: '👩‍💻', alt: 'Developer 2' },
  { id: 'avatar3', emoji: '🧑‍💻', alt: 'Developer 3' },
  { id: 'avatar4', emoji: '👨‍🎓', alt: 'Student 1' },
  { id: 'avatar5', emoji: '👩‍🎓', alt: 'Student 2' },
  { id: 'avatar6', emoji: '🧑‍🎓', alt: 'Student 3' },
  { id: 'avatar7', emoji: '🦸‍♂️', alt: 'Hero 1' },
  { id: 'avatar8', emoji: '🦸‍♀️', alt: 'Hero 2' },
  { id: 'avatar9', emoji: '🧙‍♂️', alt: 'Wizard 1' },
  { id: 'avatar10', emoji: '🧙‍♀️', alt: 'Wizard 2' },
  { id: 'avatar11', emoji: '🤖', alt: 'Robot' },
  { id: 'avatar12', emoji: '👾', alt: 'Alien' },
  { id: 'avatar13', emoji: '🐱', alt: 'Cat' },
  { id: 'avatar14', emoji: '🐶', alt: 'Dog' },
  { id: 'avatar15', emoji: '🦊', alt: 'Fox' },
  { id: 'avatar16', emoji: '🦄', alt: 'Unicorn' }
]

const visibilityOptions: {
  id: ProfileVisibility
  title: string
  description: string
  icon: typeof Eye
}[] = [
  {
    id: 'public',
    title: 'Public',
    description: 'Anyone can see your profile and progress',
    icon: Eye
  },
  {
    id: 'friends-only',
    title: 'Friends Only',
    description: 'Only people you connect with can see your profile',
    icon: User
  },
  {
    id: 'private',
    title: 'Private',
    description: 'Keep your profile and progress hidden',
    icon: Lock
  }
]

export default function ProfileSetupStep({
  bio,
  avatar,
  profileVisibility,
  onUpdate
}: ProfileSetupStepProps) {
  const [bioLength, setBioLength] = useState(bio.length)

  const handleBioChange = (value: string) => {
    if (value.length <= 500) {
      onUpdate({ bio: value })
      setBioLength(value.length)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Set Up Your Profile
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          These are all optional! You can skip this step or customize your profile now. 
          You can always change this later from your settings.
        </p>
      </motion.div>

      <div className="space-y-10">
        {/* Avatar Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Choose Your Avatar
          </h3>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {avatarOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onUpdate({ avatar: option.id })}
                className={`aspect-square p-2 rounded-xl border-2 transition-all ${
                  avatar === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-110 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:scale-105'
                }`}
              >
                <div className="text-4xl">{option.emoji}</div>
              </button>
            ))}
          </div>
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {avatar ? '✓ Avatar selected' : 'Click to select an avatar'}
          </p>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Tell Us About Yourself (Optional)
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
            <textarea
              value={bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="I'm learning to code because... (share your story, goals, or what excites you about programming!)"
              className="w-full min-h-[120px] bg-transparent border-none focus:outline-none resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
              maxLength={500}
            />
            
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500">
                💡 This helps others in the community get to know you
              </span>
              <span className={`text-xs ${bioLength > 450 ? 'text-orange-500' : 'text-gray-500'}`}>
                {bioLength}/500
              </span>
            </div>
          </div>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Profile Privacy
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {visibilityOptions.map((option) => {
              const Icon = option.icon
              
              return (
                <button
                  key={option.id}
                  onClick={() => onUpdate({ profileVisibility: option.id })}
                  className={`p-5 rounded-xl border-2 transition-all text-left ${
                    profileVisibility === option.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${
                    profileVisibility === option.id
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400'
                  }`} />
                  
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {option.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Preview */}
        {(avatar || bio) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
          >
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Profile Preview
            </h4>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-4">
                {avatar && (
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-3xl">
                    {avatarOptions.find(a => a.id === avatar)?.emoji}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      Your Name
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                      New Learner
                    </span>
                  </div>
                  
                  {bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {profileVisibility === 'public' && <Eye className="w-4 h-4" />}
              {profileVisibility === 'friends-only' && <User className="w-4 h-4" />}
              {profileVisibility === 'private' && <Lock className="w-4 h-4" />}
              <span>Visibility: {visibilityOptions.find(v => v.id === profileVisibility)?.title}</span>
            </div>
          </motion.div>
        )}

        {/* Skip reminder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Remember:</strong> All of these settings are optional and can be changed later. 
            Feel free to skip this step if you want to dive right into learning!
          </p>
        </motion.div>
      </div>
    </div>
  )
}
