/**
 * Onboarding Type Definitions
 * Types and interfaces for the onboarding subsystem
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type LearningStyle = 'ai-mentorship' | 'code-review' | 'both'
export type LearningPace = 'relaxed' | 'moderate' | 'intensive'
export type CommunicationStyle = 'concise' | 'detailed' | 'balanced'
export type ProfileVisibility = 'public' | 'private' | 'friends-only'

export interface OnboardingData {
  userId?: string
  skillLevel: SkillLevel | null
  primaryLanguage: string | null
  goals: string[]
  learningStyle: LearningStyle | null
  preferredLanguages: string[]
  learningPace: LearningPace
  timeCommitment: number // hours per week
  communicationStyle: CommunicationStyle
  bio: string
  avatar: string | null
  profileVisibility: ProfileVisibility
  currentStep: number
  isCompleted: boolean
  completedAt?: Date
  personalizedRecommendations?: PersonalizedRecommendations
}

export interface PersonalizedRecommendations {
  suggestedChallenges: string[]
  suggestedLearningPaths: string[]
  suggestedFeatures: string[]
  welcomeMessage: string
}

export interface OnboardingStatus {
  isCompleted: boolean
  currentStep: number
  completionPercentage: number
  data: OnboardingData
}

export interface OnboardingProgress {
  currentStep: number
  completionPercentage: number
  data: Partial<OnboardingData>
}

// Step-specific data interfaces

export interface SkillLevelData {
  skillLevel: SkillLevel
  primaryLanguage: string
}

export interface GoalsData {
  goals: string[]
}

export interface LearningStyleData {
  learningStyle: LearningStyle
}

export interface PreferencesData {
  preferredLanguages: string[]
  learningPace: LearningPace
  timeCommitment: number
  communicationStyle: CommunicationStyle
}

export interface ProfileSetupData {
  bio: string
  avatar: string | null
  profileVisibility: ProfileVisibility
}

// Language options
export interface ProgrammingLanguage {
  id: string
  name: string
  icon: string
  category: 'popular' | 'backend' | 'frontend' | 'mobile' | 'data-science' | 'systems'
  difficulty: SkillLevel
}

// Goal options
export interface LearningGoal {
  id: string
  title: string
  description: string
  icon: string
  category: string
  recommendedFor: SkillLevel[]
}

// Avatar options
export interface AvatarOption {
  id: string
  url: string
  alt: string
  category: 'default' | 'custom'
}

// Learning path data
export interface GeneratedLearningPath {
  userId: string
  skillLevel: SkillLevel
  primaryLanguage: string
  goals: string[]
  estimatedDuration: number // weeks
  modules: LearningPathModule[]
}

export interface LearningPathModule {
  title: string
  type: 'course' | 'project' | 'challenge' | 'quiz'
  estimatedHours: number
  isCompleted?: boolean
  order?: number
}

// API response types
export interface OnboardingApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errors?: Array<{ msg: string; param: string }>
}

// Form validation types
export interface OnboardingFormErrors {
  skillLevel?: string
  primaryLanguage?: string
  goals?: string
  learningStyle?: string
  preferredLanguages?: string
  learningPace?: string
  timeCommitment?: string
  communicationStyle?: string
  bio?: string
  avatar?: string
  profileVisibility?: string
}

// Hook return types
export interface UseOnboardingReturn {
  // State
  onboardingData: OnboardingData
  currentStep: number
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  setCurrentStep: (step: number) => void
  updateData: (data: Partial<OnboardingData>) => void
  saveProgress: () => Promise<void>
  completeOnboarding: () => Promise<void>
  skipOnboarding: () => Promise<void>
  goToNextStep: () => void
  goToPreviousStep: () => void
  
  // Helpers
  canProceed: () => boolean
  getStepData: () => any
  resetOnboarding: () => void
}

// Constants
export const ONBOARDING_STEPS = [
  'introduction',
  'skill-level',
  'goals',
  'learning-style',
  'preferences',
  'profile-setup',
  'completion'
] as const

export type OnboardingStep = typeof ONBOARDING_STEPS[number]

export const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
  { id: 'javascript', name: 'JavaScript', icon: '📜', category: 'popular', difficulty: 'beginner' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', category: 'popular', difficulty: 'intermediate' },
  { id: 'python', name: 'Python', icon: '🐍', category: 'popular', difficulty: 'beginner' },
  { id: 'java', name: 'Java', icon: '☕', category: 'backend', difficulty: 'intermediate' },
  { id: 'cpp', name: 'C++', icon: '⚙️', category: 'systems', difficulty: 'advanced' },
  { id: 'csharp', name: 'C#', icon: '🎯', category: 'backend', difficulty: 'intermediate' },
  { id: 'go', name: 'Go', icon: '🐹', category: 'backend', difficulty: 'intermediate' },
  { id: 'rust', name: 'Rust', icon: '🦀', category: 'systems', difficulty: 'advanced' },
  { id: 'php', name: 'PHP', icon: '🐘', category: 'backend', difficulty: 'beginner' },
  { id: 'ruby', name: 'Ruby', icon: '💎', category: 'backend', difficulty: 'beginner' },
  { id: 'swift', name: 'Swift', icon: '🦅', category: 'mobile', difficulty: 'intermediate' },
  { id: 'kotlin', name: 'Kotlin', icon: '🅺', category: 'mobile', difficulty: 'intermediate' },
  { id: 'r', name: 'R', icon: '📊', category: 'data-science', difficulty: 'intermediate' },
  { id: 'sql', name: 'SQL', icon: '🗄️', category: 'backend', difficulty: 'beginner' }
]

export const LEARNING_GOALS: Record<SkillLevel, LearningGoal[]> = {
  beginner: [
    {
      id: 'learn-basics',
      title: 'Learn Programming Basics',
      description: 'Understand fundamental programming concepts and syntax',
      icon: '📚',
      category: 'fundamentals',
      recommendedFor: ['beginner']
    },
    {
      id: 'build-first-app',
      title: 'Build My First Application',
      description: 'Create a simple working application from scratch',
      icon: '🚀',
      category: 'project',
      recommendedFor: ['beginner']
    },
    {
      id: 'web-development',
      title: 'Get Started with Web Development',
      description: 'Learn to build websites and web applications',
      icon: '🌐',
      category: 'web',
      recommendedFor: ['beginner']
    },
    {
      id: 'problem-solving',
      title: 'Improve Problem-Solving Skills',
      description: 'Practice algorithmic thinking and logic',
      icon: '🧩',
      category: 'skills',
      recommendedFor: ['beginner', 'intermediate']
    },
    {
      id: 'career-change',
      title: 'Change Career to Tech',
      description: 'Transition into a software development career',
      icon: '💼',
      category: 'career',
      recommendedFor: ['beginner']
    }
  ],
  intermediate: [
    {
      id: 'advanced-concepts',
      title: 'Master Advanced Concepts',
      description: 'Deep dive into advanced programming patterns and techniques',
      icon: '🎓',
      category: 'advanced',
      recommendedFor: ['intermediate', 'advanced']
    },
    {
      id: 'full-stack',
      title: 'Become a Full-Stack Developer',
      description: 'Learn both frontend and backend development',
      icon: '🔄',
      category: 'web',
      recommendedFor: ['intermediate']
    },
    {
      id: 'system-design',
      title: 'Learn System Design',
      description: 'Understand how to architect scalable systems',
      icon: '🏗️',
      category: 'architecture',
      recommendedFor: ['intermediate', 'advanced']
    },
    {
      id: 'interview-prep',
      title: 'Prepare for Tech Interviews',
      description: 'Practice coding interviews and algorithms',
      icon: '💪',
      category: 'career',
      recommendedFor: ['intermediate', 'advanced']
    },
    {
      id: 'mobile-dev',
      title: 'Build Mobile Applications',
      description: 'Create apps for iOS and Android',
      icon: '📱',
      category: 'mobile',
      recommendedFor: ['intermediate']
    }
  ],
  advanced: [
    {
      id: 'system-architecture',
      title: 'Master System Architecture',
      description: 'Design complex, scalable distributed systems',
      icon: '🏛️',
      category: 'architecture',
      recommendedFor: ['advanced']
    },
    {
      id: 'performance-optimization',
      title: 'Performance Optimization',
      description: 'Learn to write highly optimized, efficient code',
      icon: '⚡',
      category: 'advanced',
      recommendedFor: ['advanced']
    },
    {
      id: 'machine-learning',
      title: 'Explore Machine Learning',
      description: 'Build and deploy ML models',
      icon: '🤖',
      category: 'data-science',
      recommendedFor: ['advanced']
    },
    {
      id: 'open-source',
      title: 'Contribute to Open Source',
      description: 'Make meaningful contributions to open source projects',
      icon: '🌟',
      category: 'community',
      recommendedFor: ['intermediate', 'advanced']
    },
    {
      id: 'tech-leadership',
      title: 'Become a Tech Lead',
      description: 'Develop leadership and mentorship skills',
      icon: '👥',
      category: 'career',
      recommendedFor: ['advanced']
    }
  ]
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  skillLevel: null,
  primaryLanguage: null,
  goals: [],
  learningStyle: null,
  preferredLanguages: [],
  learningPace: 'moderate',
  timeCommitment: 5,
  communicationStyle: 'balanced',
  bio: '',
  avatar: null,
  profileVisibility: 'public',
  currentStep: 0,
  isCompleted: false
}
