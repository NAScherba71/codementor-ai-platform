const mongoose = require('mongoose')

const OnboardingDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  primaryLanguage: {
    type: String,
    required: true
  },
  goals: [{
    type: String,
    required: true
  }],
  learningStyle: {
    type: String,
    enum: ['ai-mentorship', 'code-review', 'both'],
    required: true
  },
  preferredLanguages: [{
    type: String
  }],
  learningPace: {
    type: String,
    enum: ['relaxed', 'moderate', 'intensive'],
    default: 'moderate'
  },
  timeCommitment: {
    type: Number, // hours per week
    min: 1,
    max: 40,
    default: 5
  },
  communicationStyle: {
    type: String,
    enum: ['concise', 'detailed', 'balanced'],
    default: 'balanced'
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'private', 'friends-only'],
    default: 'public'
  },
  completedAt: {
    type: Date,
    default: null
  },
  currentStep: {
    type: Number,
    default: 0,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  personalizedRecommendations: {
    suggestedChallenges: [String],
    suggestedLearningPaths: [String],
    suggestedFeatures: [String],
    welcomeMessage: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Index for faster queries
OnboardingDataSchema.index({ userId: 1 })
OnboardingDataSchema.index({ isCompleted: 1 })
OnboardingDataSchema.index({ createdAt: -1 })

// Virtual for completion percentage
OnboardingDataSchema.virtual('completionPercentage').get(function() {
  const totalSteps = 7 // Total number of onboarding steps
  const completedPercentage = Math.round((this.currentStep / totalSteps) * 100)
  return Math.min(completedPercentage, 100)
})

// Pre-save middleware to update completion status
OnboardingDataSchema.pre('save', function(next) {
  if (this.currentStep >= 7 && !this.isCompleted) {
    this.isCompleted = true
    this.completedAt = new Date()
  }
  next()
})

module.exports = mongoose.model('OnboardingData', OnboardingDataSchema)
