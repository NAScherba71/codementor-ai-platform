const mongoose = require('mongoose')

const UserPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Learning preferences
  learningPreferences: {
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    preferredLanguages: [{
      language: String,
      proficiencyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner'
      },
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    learningPace: {
      type: String,
      enum: ['relaxed', 'moderate', 'intensive'],
      default: 'moderate'
    },
    timeCommitment: {
      type: Number, // hours per week
      default: 5
    },
    learningStyle: {
      type: String,
      enum: ['ai-mentorship', 'code-review', 'both'],
      default: 'both'
    },
    goals: [{
      goal: String,
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      },
      targetDate: Date
    }]
  },
  // Communication preferences
  communicationPreferences: {
    style: {
      type: String,
      enum: ['concise', 'detailed', 'balanced'],
      default: 'balanced'
    },
    codeExplanationLevel: {
      type: String,
      enum: ['simple', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    receiveHints: {
      type: Boolean,
      default: true
    },
    receiveFeedback: {
      type: Boolean,
      default: true
    }
  },
  // Notification preferences
  notificationPreferences: {
    email: {
      dailyReminders: { type: Boolean, default: true },
      weeklyProgress: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      challenges: { type: Boolean, default: true },
      messages: { type: Boolean, default: true }
    },
    push: {
      dailyReminders: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      challenges: { type: Boolean, default: false },
      messages: { type: Boolean, default: true }
    }
  },
  // UI preferences
  uiPreferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    codeEditorTheme: {
      type: String,
      enum: ['vs-dark', 'vs-light', 'monokai', 'github', 'dracula'],
      default: 'vs-dark'
    },
    fontSize: {
      type: Number,
      min: 10,
      max: 24,
      default: 14
    },
    showLineNumbers: {
      type: Boolean,
      default: true
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  // Privacy preferences
  privacyPreferences: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends-only'],
      default: 'public'
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    showAchievements: {
      type: Boolean,
      default: true
    },
    allowMessagesFromStrangers: {
      type: Boolean,
      default: true
    }
  },
  // Accessibility preferences
  accessibilityPreferences: {
    highContrast: {
      type: Boolean,
      default: false
    },
    reduceMotion: {
      type: Boolean,
      default: false
    },
    screenReaderOptimized: {
      type: Boolean,
      default: false
    },
    keyboardNavigationOnly: {
      type: Boolean,
      default: false
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Index for faster queries
UserPreferenceSchema.index({ userId: 1 })

// Pre-save middleware to update lastUpdated
UserPreferenceSchema.pre('save', function(next) {
  this.lastUpdated = new Date()
  next()
})

// Static method to create default preferences for a user
UserPreferenceSchema.statics.createDefault = function(userId) {
  return this.create({
    userId,
    learningPreferences: {
      skillLevel: 'beginner',
      preferredLanguages: [],
      learningPace: 'moderate',
      timeCommitment: 5,
      learningStyle: 'both',
      goals: []
    }
  })
}

module.exports = mongoose.model('UserPreference', UserPreferenceSchema)
