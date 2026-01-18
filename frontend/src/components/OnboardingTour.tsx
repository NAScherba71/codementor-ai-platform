'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, AlertTriangle, Brain, Zap } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  targetSelector?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: {
    label: string
    href: string
  }
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to CodeMentor AI! 🚀',
    description: 'Get ready for a revolutionary learning experience. We offer two powerful modes powered by cutting-edge AI models to accelerate your growth.',
    icon: Brain,
    position: 'center',
  },
  {
    id: 'roast-mode',
    title: 'Roast My Code (GPT-5.2 Powered)',
    description: 'Get brutal, senior-level architectural feedback. This mode uses GPT-5.2-Codex to provide deep code analysis, finding security holes, performance issues, and anti-patterns.',
    icon: AlertTriangle,
    targetSelector: '[data-tour="roast-button"]',
    position: 'bottom',
    action: {
      label: 'Try Roast Mode',
      href: '/review',
    },
  },
  {
    id: 'mentorship-mode',
    title: 'Start Mentorship (Claude Sonnet 4.5)',
    description: 'A warm, personalized introduction to programming concepts. Claude Sonnet 4.5 provides gentle, empathetic guidance tailored to your learning style.',
    icon: Brain,
    targetSelector: '[data-tour="mentorship-button"]',
    position: 'bottom',
    action: {
      label: 'Start Learning',
      href: '/dashboard',
    },
  },
  {
    id: 'quick-start',
    title: 'Quick Start AI Playground (Gemini 3 Flash)',
    description: 'Instant syntax and logic puzzles with sub-second response times. Perfect for rapid skill building and immediate feedback.',
    icon: Zap,
    targetSelector: '[data-tour="playground-button"]',
    position: 'bottom',
    action: {
      label: 'Try Playground',
      href: '/playground',
    },
  },
]

export default function OnboardingTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompletedTour, setHasCompletedTour] = useState(false)

  useEffect(() => {
    // Check if user has completed the tour
    const completed = localStorage.getItem('onboarding-tour-completed')
    if (completed) {
      setHasCompletedTour(true)
      return
    }

    // Auto-start tour after a short delay
    const timer = setTimeout(() => {
      setIsActive(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    localStorage.setItem('onboarding-tour-completed', 'true')
    setIsActive(false)
    setHasCompletedTour(true)
  }

  const skipTour = () => {
    completeTour()
  }

  const restartTour = () => {
    localStorage.removeItem('onboarding-tour-completed')
    setHasCompletedTour(false)
    setCurrentStep(0)
    setIsActive(true)
  }

  if (hasCompletedTour && !isActive) {
    return (
      <button
        onClick={restartTour}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-indigo-500 transition-all"
      >
        Restart Tour
      </button>
    )
  }

  if (!isActive) return null

  const step = tourSteps[currentStep]
  const StepIcon = step.icon

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={skipTour}
          />
        )}
      </AnimatePresence>

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`fixed z-50 w-full max-w-md ${getPositionClasses(step.position)}`}
          >
            <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/10">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-200 p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <StepIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-500">
                      Step {currentStep + 1} of {tourSteps.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={skipTour}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed">{step.description}</p>

                {step.action && (
                  <a
                    href={step.action.href}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    {step.action.label}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex gap-1.5">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-indigo-600 w-6'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function getPositionClasses(position: TourStep['position']): string {
  switch (position) {
    case 'center':
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    case 'top':
      return 'top-24 left-1/2 -translate-x-1/2'
    case 'bottom':
      return 'bottom-24 left-1/2 -translate-x-1/2'
    case 'left':
      return 'top-1/2 left-8 -translate-y-1/2'
    case 'right':
      return 'top-1/2 right-8 -translate-y-1/2'
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  }
}
