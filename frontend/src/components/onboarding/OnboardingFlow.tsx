'use client'

/**
 * OnboardingFlow Component
 * Main orchestrator for the onboarding process
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useOnboarding } from '@/hooks/useOnboarding'
import { ONBOARDING_STEPS } from '@/types/onboarding.types'

// Import step components
import IntroductionStep from './IntroductionStep'
import SkillLevelStep from './SkillLevelStep'
import GoalsStep from './GoalsStep'
import LearningStyleStep from './LearningStyleStep'
import PreferencesStep from './PreferencesStep'
import ProfileSetupStep from './ProfileSetupStep'
import CompletionStep from './CompletionStep'

export default function OnboardingFlow() {
  const {
    onboardingData,
    currentStep,
    isLoading,
    isSaving,
    error,
    updateData,
    goToNextStep,
    goToPreviousStep,
    completeOnboarding,
    skipOnboarding,
    canProceed
  } = useOnboarding()

  const totalSteps = ONBOARDING_STEPS.length
  const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100)

  // Handle next button
  const handleNext = useCallback(() => {
    if (!canProceed()) {
      toast.error('Please complete all required fields before continuing')
      return
    }
    
    goToNextStep()
  }, [canProceed, goToNextStep])

  // Handle completion
  const handleComplete = useCallback(async () => {
    try {
      await completeOnboarding()
    } catch (err) {
      // Error is already handled in the hook
      console.error('Completion error:', err)
    }
  }, [completeOnboarding])

  // Handle skip
  const handleSkip = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to skip onboarding? We recommend completing it to get the best personalized experience.'
    )
    
    if (confirmed) {
      try {
        await skipOnboarding()
      } catch (err) {
        console.error('Skip error:', err)
      }
    }
  }, [skipOnboarding])

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <IntroductionStep onNext={goToNextStep} />
      
      case 1:
        return (
          <SkillLevelStep
            skillLevel={onboardingData.skillLevel}
            primaryLanguage={onboardingData.primaryLanguage}
            onUpdate={updateData}
          />
        )
      
      case 2:
        return (
          <GoalsStep
            skillLevel={onboardingData.skillLevel}
            goals={onboardingData.goals}
            onUpdate={updateData}
          />
        )
      
      case 3:
        return (
          <LearningStyleStep
            learningStyle={onboardingData.learningStyle}
            onUpdate={updateData}
          />
        )
      
      case 4:
        return (
          <PreferencesStep
            preferredLanguages={onboardingData.preferredLanguages}
            learningPace={onboardingData.learningPace}
            timeCommitment={onboardingData.timeCommitment}
            communicationStyle={onboardingData.communicationStyle}
            onUpdate={updateData}
          />
        )
      
      case 5:
        return (
          <ProfileSetupStep
            bio={onboardingData.bio}
            avatar={onboardingData.avatar}
            profileVisibility={onboardingData.profileVisibility}
            onUpdate={updateData}
          />
        )
      
      case 6:
        return (
          <CompletionStep
            onboardingData={onboardingData}
            recommendations={onboardingData.personalizedRecommendations}
            onComplete={handleComplete}
            isLoading={isSaving}
          />
        )
      
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with progress */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CodeMentor
              </div>
              
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>•</span>
                <span>{ONBOARDING_STEPS[currentStep]}</span>
              </div>
            </div>
            
            {currentStep > 0 && currentStep < totalSteps - 1 && (
              <button
                onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Skip for now</span>
              </button>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation footer */}
      {currentStep > 0 && currentStep < totalSteps - 1 && (
        <footer className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Back button */}
              <button
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              {/* Status indicators */}
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                )}
                
                {!isSaving && currentStep > 0 && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ✓ Auto-saved
                  </span>
                )}
              </div>

              {/* Next button */}
              <button
                onClick={handleNext}
                disabled={!canProceed() || isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span>
                  {currentStep === totalSteps - 2 ? 'Review & Complete' : 'Continue'}
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </motion.div>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
