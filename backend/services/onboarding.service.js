const OnboardingData = require('../models/OnboardingData')
const UserPreference = require('../models/UserPreference')
const User = require('../models/User')
const LearningPath = require('../models/LearningPath')

/**
 * Onboarding Service
 * Handles business logic for user onboarding process
 */

class OnboardingService {
  /**
   * Get user's onboarding status
   * @param {string} userId - User ID
   * @returns {Promise<object>} Onboarding status and data
   */
  async getOnboardingStatus(userId) {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      let onboardingData = await OnboardingData.findOne({ userId })

      if (!onboardingData) {
        // Create new onboarding record
        onboardingData = new OnboardingData({
          userId,
          currentStep: 0,
          isCompleted: false
        })
        await onboardingData.save()
      }

      return {
        isCompleted: user.onboarding?.isCompleted || false,
        currentStep: onboardingData.currentStep,
        completionPercentage: onboardingData.completionPercentage,
        data: onboardingData
      }
    } catch (error) {
      throw new Error(`Failed to get onboarding status: ${error.message}`)
    }
  }

  /**
   * Save onboarding progress
   * @param {string} userId - User ID
   * @param {object} progressData - Progress data to save
   * @returns {Promise<object>} Updated onboarding data
   */
  async saveProgress(userId, progressData) {
    try {
      let onboardingData = await OnboardingData.findOne({ userId })

      if (!onboardingData) {
        onboardingData = new OnboardingData({
          userId,
          ...progressData
        })
      } else {
        // Update existing onboarding data
        Object.assign(onboardingData, progressData)
      }

      await onboardingData.save()

      return {
        success: true,
        currentStep: onboardingData.currentStep,
        completionPercentage: onboardingData.completionPercentage,
        data: onboardingData
      }
    } catch (error) {
      throw new Error(`Failed to save onboarding progress: ${error.message}`)
    }
  }

  /**
   * Complete onboarding process
   * @param {string} userId - User ID
   * @param {object} finalData - Final onboarding data
   * @returns {Promise<object>} Completion result with personalized recommendations
   */
  async completeOnboarding(userId, finalData) {
    try {
      // Update onboarding data
      let onboardingData = await OnboardingData.findOne({ userId })
      
      if (!onboardingData) {
        onboardingData = new OnboardingData({
          userId,
          ...finalData,
          currentStep: 7,
          isCompleted: true,
          completedAt: new Date()
        })
      } else {
        Object.assign(onboardingData, finalData)
        onboardingData.currentStep = 7
        onboardingData.isCompleted = true
        onboardingData.completedAt = new Date()
      }

      // Generate personalized recommendations
      const recommendations = await this.generatePersonalizedRecommendations(onboardingData)
      onboardingData.personalizedRecommendations = recommendations

      await onboardingData.save()

      // Update user preferences
      await this.updateUserPreferences(userId, onboardingData)

      // Update user onboarding status
      await User.findByIdAndUpdate(userId, {
        'onboarding.isCompleted': true,
        'onboarding.completedAt': new Date(),
        'preferences.difficulty': onboardingData.skillLevel,
        'preferences.learningStyle': onboardingData.learningStyle,
        'preferences.preferredProgrammingLanguages': onboardingData.preferredLanguages
      })

      // Generate personalized learning path
      const learningPath = await this.generateLearningPath(userId, onboardingData)

      return {
        success: true,
        message: 'Onboarding completed successfully',
        recommendations,
        learningPath,
        onboardingData
      }
    } catch (error) {
      throw new Error(`Failed to complete onboarding: ${error.message}`)
    }
  }

  /**
   * Generate personalized recommendations based on onboarding data
   * @param {object} onboardingData - User's onboarding data
   * @returns {Promise<object>} Personalized recommendations
   */
  async generatePersonalizedRecommendations(onboardingData) {
    const recommendations = {
      suggestedChallenges: [],
      suggestedLearningPaths: [],
      suggestedFeatures: [],
      welcomeMessage: ''
    }

    // Generate welcome message
    recommendations.welcomeMessage = this.generateWelcomeMessage(onboardingData)

    // Suggest challenges based on skill level and language
    recommendations.suggestedChallenges = this.suggestChallenges(
      onboardingData.skillLevel,
      onboardingData.primaryLanguage,
      onboardingData.goals
    )

    // Suggest learning paths based on goals and skill level
    recommendations.suggestedLearningPaths = this.suggestLearningPaths(
      onboardingData.skillLevel,
      onboardingData.goals,
      onboardingData.preferredLanguages
    )

    // Suggest features based on learning style
    recommendations.suggestedFeatures = this.suggestFeatures(
      onboardingData.learningStyle,
      onboardingData.goals
    )

    return recommendations
  }

  /**
   * Generate personalized welcome message
   * @param {object} onboardingData - User's onboarding data
   * @returns {string} Welcome message
   */
  generateWelcomeMessage(onboardingData) {
    const { skillLevel, primaryLanguage, learningStyle, goals } = onboardingData

    let message = `Welcome to CodeMentor! We're excited to have you here. `

    // Personalize based on skill level
    if (skillLevel === 'beginner') {
      message += `As a beginner, you're at an exciting starting point in your coding journey. `
      message += `Don't worry—everyone starts somewhere, and we're here to support you every step of the way! `
    } else if (skillLevel === 'intermediate') {
      message += `As an intermediate developer, you're ready to take your skills to the next level. `
      message += `We'll help you build on what you already know and tackle more challenging problems. `
    } else {
      message += `As an advanced developer, you're looking to master complex concepts and push your boundaries. `
      message += `We're here to provide the challenges and guidance you need to excel. `
    }

    // Add learning style message
    if (learningStyle === 'ai-mentorship') {
      message += `You've chosen AI Mentorship, so you'll have a personal AI tutor guiding you through concepts and helping you learn interactively. `
    } else if (learningStyle === 'code-review') {
      message += `You've chosen Code Review mode, so you'll get detailed feedback on your code to improve your skills through practice. `
    } else {
      message += `You've chosen both AI Mentorship and Code Review—the best of both worlds! You'll learn concepts with AI guidance and refine your skills through detailed feedback. `
    }

    // Add primary language message
    message += `We've set up ${primaryLanguage} as your primary language to get you started. `

    // Add goals message
    if (goals && goals.length > 0) {
      message += `Based on your goals, we've curated a personalized learning path just for you. `
    }

    message += `Let's begin your journey to becoming a better developer!`

    return message
  }

  /**
   * Suggest challenges based on user profile
   * @param {string} skillLevel - User's skill level
   * @param {string} primaryLanguage - User's primary language
   * @param {array} goals - User's goals
   * @returns {array} Suggested challenge IDs or types
   */
  suggestChallenges(skillLevel, primaryLanguage, goals) {
    const challenges = []

    // Beginner challenges
    if (skillLevel === 'beginner') {
      challenges.push(
        `hello-world-${primaryLanguage}`,
        `basic-variables-${primaryLanguage}`,
        `simple-loops-${primaryLanguage}`,
        `basic-functions-${primaryLanguage}`,
        `array-basics-${primaryLanguage}`
      )
    }
    // Intermediate challenges
    else if (skillLevel === 'intermediate') {
      challenges.push(
        `data-structures-${primaryLanguage}`,
        `algorithm-basics-${primaryLanguage}`,
        `oop-fundamentals-${primaryLanguage}`,
        `error-handling-${primaryLanguage}`,
        `file-operations-${primaryLanguage}`
      )
    }
    // Advanced challenges
    else {
      challenges.push(
        `advanced-algorithms-${primaryLanguage}`,
        `design-patterns-${primaryLanguage}`,
        `performance-optimization-${primaryLanguage}`,
        `system-design-${primaryLanguage}`,
        `concurrency-${primaryLanguage}`
      )
    }

    return challenges.slice(0, 5)
  }

  /**
   * Suggest learning paths based on user profile
   * @param {string} skillLevel - User's skill level
   * @param {array} goals - User's goals
   * @param {array} preferredLanguages - User's preferred languages
   * @returns {array} Suggested learning path IDs or types
   */
  suggestLearningPaths(skillLevel, goals, preferredLanguages) {
    const paths = []

    // Goal-based paths
    if (goals) {
      goals.forEach(goal => {
        const normalizedGoal = goal.toLowerCase()
        
        if (normalizedGoal.includes('web') || normalizedGoal.includes('frontend')) {
          paths.push('web-development-fundamentals')
        }
        if (normalizedGoal.includes('backend') || normalizedGoal.includes('server')) {
          paths.push('backend-development-path')
        }
        if (normalizedGoal.includes('mobile') || normalizedGoal.includes('app')) {
          paths.push('mobile-development-basics')
        }
        if (normalizedGoal.includes('data') || normalizedGoal.includes('science')) {
          paths.push('data-science-foundations')
        }
        if (normalizedGoal.includes('algorithm') || normalizedGoal.includes('interview')) {
          paths.push('algorithm-interview-prep')
        }
      })
    }

    // Skill level based paths
    if (skillLevel === 'beginner') {
      paths.push('programming-fundamentals', 'problem-solving-basics')
    } else if (skillLevel === 'intermediate') {
      paths.push('advanced-programming-concepts', 'software-design-principles')
    } else {
      paths.push('expert-programming-patterns', 'system-architecture')
    }

    // Remove duplicates
    return [...new Set(paths)].slice(0, 5)
  }

  /**
   * Suggest features based on learning style
   * @param {string} learningStyle - User's learning style
   * @param {array} goals - User's goals
   * @returns {array} Suggested features
   */
  suggestFeatures(learningStyle, goals) {
    const features = []

    if (learningStyle === 'ai-mentorship' || learningStyle === 'both') {
      features.push('ai-tutor', 'interactive-lessons', 'concept-explanations')
    }

    if (learningStyle === 'code-review' || learningStyle === 'both') {
      features.push('code-challenges', 'peer-review', 'automated-feedback')
    }

    features.push('progress-tracking', 'achievement-system', 'coding-playground')

    return features.slice(0, 6)
  }

  /**
   * Update user preferences based on onboarding data
   * @param {string} userId - User ID
   * @param {object} onboardingData - Onboarding data
   * @returns {Promise<object>} Updated preferences
   */
  async updateUserPreferences(userId, onboardingData) {
    try {
      let preferences = await UserPreference.findOne({ userId })

      const preferenceData = {
        learningPreferences: {
          skillLevel: onboardingData.skillLevel,
          preferredLanguages: onboardingData.preferredLanguages.map(lang => ({
            language: lang,
            proficiencyLevel: onboardingData.skillLevel,
            isPrimary: lang === onboardingData.primaryLanguage
          })),
          learningPace: onboardingData.learningPace || 'moderate',
          timeCommitment: onboardingData.timeCommitment || 5,
          learningStyle: onboardingData.learningStyle,
          goals: (onboardingData.goals || []).map((goal, index) => ({
            goal,
            priority: index + 1
          }))
        },
        communicationPreferences: {
          style: onboardingData.communicationStyle || 'balanced'
        },
        privacyPreferences: {
          profileVisibility: onboardingData.profileVisibility || 'public'
        }
      }

      if (!preferences) {
        preferences = new UserPreference({
          userId,
          ...preferenceData
        })
      } else {
        Object.assign(preferences, preferenceData)
      }

      await preferences.save()
      return preferences
    } catch (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`)
    }
  }

  /**
   * Generate personalized learning path
   * @param {string} userId - User ID
   * @param {object} onboardingData - Onboarding data
   * @returns {Promise<object>} Generated learning path
   */
  async generateLearningPath(userId, onboardingData) {
    try {
      // This would integrate with the learning path generation system
      // For now, return a basic structure
      const pathData = {
        userId,
        skillLevel: onboardingData.skillLevel,
        primaryLanguage: onboardingData.primaryLanguage,
        goals: onboardingData.goals,
        estimatedDuration: this.calculateEstimatedDuration(
          onboardingData.timeCommitment,
          onboardingData.learningPace
        ),
        modules: this.generateModules(onboardingData)
      }

      return pathData
    } catch (error) {
      throw new Error(`Failed to generate learning path: ${error.message}`)
    }
  }

  /**
   * Calculate estimated duration for learning path
   * @param {number} timeCommitment - Hours per week
   * @param {string} learningPace - Learning pace
   * @returns {number} Estimated weeks
   */
  calculateEstimatedDuration(timeCommitment, learningPace) {
    const baseWeeks = 12 // Base duration in weeks

    const paceMultiplier = {
      'relaxed': 1.5,
      'moderate': 1.0,
      'intensive': 0.7
    }

    const multiplier = paceMultiplier[learningPace] || 1.0
    const adjustedWeeks = baseWeeks * multiplier

    // Adjust based on time commitment
    const timeAdjustment = timeCommitment >= 10 ? 0.8 : timeCommitment <= 3 ? 1.3 : 1.0

    return Math.round(adjustedWeeks * timeAdjustment)
  }

  /**
   * Generate learning modules
   * @param {object} onboardingData - Onboarding data
   * @returns {array} Learning modules
   */
  generateModules(onboardingData) {
    const modules = []
    const { skillLevel, primaryLanguage, goals } = onboardingData

    // Add foundational modules
    if (skillLevel === 'beginner') {
      modules.push({
        title: `${primaryLanguage} Fundamentals`,
        type: 'course',
        estimatedHours: 8
      })
    }

    // Add goal-specific modules
    if (goals && goals.length > 0) {
      goals.forEach(goal => {
        modules.push({
          title: goal,
          type: 'project',
          estimatedHours: 6
        })
      })
    }

    return modules
  }

  /**
   * Skip onboarding (set defaults)
   * @param {string} userId - User ID
   * @returns {Promise<object>} Result
   */
  async skipOnboarding(userId) {
    try {
      // Set default preferences
      const defaultData = {
        skillLevel: 'beginner',
        primaryLanguage: 'javascript',
        goals: ['Learn programming basics'],
        learningStyle: 'both',
        preferredLanguages: ['javascript'],
        learningPace: 'moderate',
        timeCommitment: 5,
        communicationStyle: 'balanced',
        profileVisibility: 'public',
        isCompleted: true,
        completedAt: new Date(),
        currentStep: 7
      }

      await OnboardingData.findOneAndUpdate(
        { userId },
        defaultData,
        { upsert: true, new: true }
      )

      await User.findByIdAndUpdate(userId, {
        'onboarding.isCompleted': true,
        'onboarding.completedAt': new Date(),
        'onboarding.skipped': true
      })

      return {
        success: true,
        message: 'Onboarding skipped with default preferences'
      }
    } catch (error) {
      throw new Error(`Failed to skip onboarding: ${error.message}`)
    }
  }
}

module.exports = new OnboardingService()
