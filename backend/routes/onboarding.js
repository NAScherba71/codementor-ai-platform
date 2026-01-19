const express = require('express')
const { body, validationResult } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const onboardingService = require('../services/onboarding.service')

const router = express.Router()

// @route   GET /api/onboarding/status
// @desc    Get user's onboarding status
// @access  Private
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id

    const status = await onboardingService.getOnboardingStatus(userId)

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Get onboarding status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding status',
      error: error.message
    })
  }
})

// @route   POST /api/onboarding/progress
// @desc    Save onboarding progress
// @access  Private
router.post('/progress', [
  authenticate,
  body('currentStep').optional().isInt({ min: 0, max: 7 }),
  body('skillLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('primaryLanguage').optional().isString().trim(),
  body('goals').optional().isArray(),
  body('learningStyle').optional().isIn(['ai-mentorship', 'code-review', 'both']),
  body('preferredLanguages').optional().isArray(),
  body('learningPace').optional().isIn(['relaxed', 'moderate', 'intensive']),
  body('timeCommitment').optional().isInt({ min: 1, max: 40 }),
  body('communicationStyle').optional().isIn(['concise', 'detailed', 'balanced']),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('avatar').optional().isString(),
  body('profileVisibility').optional().isIn(['public', 'private', 'friends-only'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const userId = req.user.id || req.user._id
    const progressData = req.body

    const result = await onboardingService.saveProgress(userId, progressData)

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: result
    })
  } catch (error) {
    console.error('Save onboarding progress error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to save onboarding progress',
      error: error.message
    })
  }
})

// @route   POST /api/onboarding/complete
// @desc    Complete onboarding process
// @access  Private
router.post('/complete', [
  authenticate,
  body('skillLevel').notEmpty().isIn(['beginner', 'intermediate', 'advanced']),
  body('primaryLanguage').notEmpty().isString().trim(),
  body('goals').optional().isArray(),
  body('learningStyle').notEmpty().isIn(['ai-mentorship', 'code-review', 'both']),
  body('preferredLanguages').optional().isArray(),
  body('learningPace').optional().isIn(['relaxed', 'moderate', 'intensive']),
  body('timeCommitment').optional().isInt({ min: 1, max: 40 }),
  body('communicationStyle').optional().isIn(['concise', 'detailed', 'balanced']),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('avatar').optional().isString(),
  body('profileVisibility').optional().isIn(['public', 'private', 'friends-only'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const userId = req.user.id || req.user._id
    const finalData = req.body

    const result = await onboardingService.completeOnboarding(userId, finalData)

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: result
    })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: error.message
    })
  }
})

// @route   GET /api/onboarding/learning-path
// @desc    Get personalized learning path
// @access  Private
router.get('/learning-path', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id

    // Get onboarding data
    const OnboardingData = require('../models/OnboardingData')
    const onboardingData = await OnboardingData.findOne({ userId })

    if (!onboardingData || !onboardingData.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Please complete onboarding first'
      })
    }

    const learningPath = await onboardingService.generateLearningPath(userId, onboardingData)

    res.json({
      success: true,
      data: learningPath
    })
  } catch (error) {
    console.error('Get learning path error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get learning path',
      error: error.message
    })
  }
})

// @route   POST /api/onboarding/skip
// @desc    Skip onboarding and set defaults
// @access  Private
router.post('/skip', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id

    const result = await onboardingService.skipOnboarding(userId)

    res.json({
      success: true,
      message: 'Onboarding skipped successfully',
      data: result
    })
  } catch (error) {
    console.error('Skip onboarding error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to skip onboarding',
      error: error.message
    })
  }
})

module.exports = router
