/**
 * useOnboarding Hook
 * Custom hook for managing onboarding state and logic
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  OnboardingData,
  DEFAULT_ONBOARDING_DATA,
  UseOnboardingReturn,
  ONBOARDING_STEPS
} from '@/types/onboarding.types'
import onboardingService from '@/services/onboarding.service'

const TOTAL_STEPS = ONBOARDING_STEPS.length

export function useOnboarding(): UseOnboardingReturn {
  const router = useRouter()
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load onboarding status on mount
  useEffect(() => {
    loadOnboardingStatus()
  }, [])

  // Auto-save when data changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentStep > 0 && !onboardingData.isCompleted) {
        autoSave()
      }
    }, 2000) // 2 second debounce

    return () => clearTimeout(timeoutId)
  }, [onboardingData, currentStep])

  /**
   * Load onboarding status from backend
   */
  const loadOnboardingStatus = async () => {
    try {
      setIsLoading(true)
      const status = await onboardingService.getStatus()
      
      if (status.data) {
        setOnboardingData(status.data as OnboardingData)
        setCurrentStep(status.currentStep)
      }
      
      setError(null)
    } catch (err: any) {
      console.error('Failed to load onboarding status:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Auto-save progress to backend
   */
  const autoSave = async () => {
    try {
      await onboardingService.saveProgress({
        ...onboardingData,
        currentStep
      })
    } catch (err: any) {
      console.error('Auto-save failed:', err)
      // Don't show error toast for auto-save failures
    }
  }

  /**
   * Update onboarding data
   */
  const updateData = useCallback((data: Partial<OnboardingData>) => {
    setOnboardingData(prev => {
      const updated = { ...prev, ...data }
      // Handle explicit null/undefined values to reset fields
      Object.keys(data).forEach(key => {
        if (data[key as keyof OnboardingData] === undefined) {
          // @ts-ignore - We're intentionally setting to null to clear
          updated[key as keyof OnboardingData] = null
        }
      })
      return updated
    })
  }, [])

  /**
   * Save progress manually
   */
  const saveProgress = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      await onboardingService.saveProgress({
        ...onboardingData,
        currentStep
      })
      
      toast.success('Progress saved!')
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to save progress')
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Complete onboarding
   */
  const completeOnboarding = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      // Validate required fields
      if (!onboardingData.skillLevel) {
        throw new Error('Skill level is required')
      }
      if (!onboardingData.primaryLanguage) {
        throw new Error('Primary language is required')
      }
      if (!onboardingData.learningStyle) {
        throw new Error('Learning style is required')
      }
      
      const result = await onboardingService.complete({
        skillLevel: onboardingData.skillLevel,
        primaryLanguage: onboardingData.primaryLanguage,
        goals: onboardingData.goals,
        learningStyle: onboardingData.learningStyle,
        preferredLanguages: onboardingData.preferredLanguages,
        learningPace: onboardingData.learningPace,
        timeCommitment: onboardingData.timeCommitment,
        communicationStyle: onboardingData.communicationStyle,
        bio: onboardingData.bio,
        avatar: onboardingData.avatar,
        profileVisibility: onboardingData.profileVisibility
      })
      
      setOnboardingData(prev => ({
        ...prev,
        isCompleted: true,
        completedAt: new Date(),
        personalizedRecommendations: result.recommendations
      }))
      
      toast.success('Onboarding completed! Welcome to CodeMentor!')
      
      // Redirect to dashboard after a brief delay
      const timeoutId = setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
      // Cleanup function would be in component unmount, but since we're redirecting
      // we don't need to clear it here. The timeout is intentionally brief (2s).
      
      return result
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || 'Failed to complete onboarding')
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Skip onboarding
   */
  const skipOnboarding = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      await onboardingService.skip()
      
      toast.success('Onboarding skipped. You can customize your preferences later.')
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to skip onboarding')
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Go to next step
   */
  const goToNextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  /**
   * Go to previous step
   */
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  /**
   * Check if can proceed to next step
   */
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: // Introduction
        return true
      
      case 1: // Skill Level
        return !!onboardingData.skillLevel && !!onboardingData.primaryLanguage
      
      case 2: // Goals
        return onboardingData.goals.length > 0
      
      case 3: // Learning Style
        return !!onboardingData.learningStyle
      
      case 4: // Preferences
        return onboardingData.preferredLanguages.length > 0 && 
               onboardingData.timeCommitment > 0
      
      case 5: // Profile Setup
        return true // All fields are optional
      
      case 6: // Completion
        return true
      
      default:
        return false
    }
  }, [currentStep, onboardingData])

  /**
   * Get current step data
   */
  const getStepData = useCallback(() => {
    switch (currentStep) {
      case 1:
        return {
          skillLevel: onboardingData.skillLevel,
          primaryLanguage: onboardingData.primaryLanguage
        }
      
      case 2:
        return {
          goals: onboardingData.goals
        }
      
      case 3:
        return {
          learningStyle: onboardingData.learningStyle
        }
      
      case 4:
        return {
          preferredLanguages: onboardingData.preferredLanguages,
          learningPace: onboardingData.learningPace,
          timeCommitment: onboardingData.timeCommitment,
          communicationStyle: onboardingData.communicationStyle
        }
      
      case 5:
        return {
          bio: onboardingData.bio,
          avatar: onboardingData.avatar,
          profileVisibility: onboardingData.profileVisibility
        }
      
      default:
        return null
    }
  }, [currentStep, onboardingData])

  /**
   * Reset onboarding
   */
  const resetOnboarding = useCallback(() => {
    setOnboardingData(DEFAULT_ONBOARDING_DATA)
    setCurrentStep(0)
    setError(null)
  }, [])

  return {
    // State
    onboardingData,
    currentStep,
    isLoading,
    isSaving,
    error,
    
    // Actions
    setCurrentStep,
    updateData,
    saveProgress,
    completeOnboarding,
    skipOnboarding,
    goToNextStep,
    goToPreviousStep,
    
    // Helpers
    canProceed,
    getStepData,
    resetOnboarding
  }
}

export default useOnboarding
