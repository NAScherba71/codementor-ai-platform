# Onboarding Subsystem - Documentation

## Overview

The Onboarding Subsystem is a comprehensive, user-friendly system that introduces new users to the CodeMentor AI platform. It features a multi-step flow that personalizes the learning experience based on user preferences, skill level, goals, and learning style.

## Features

### 🎯 Key Highlights

- **Stress-Relieving Introduction**: Welcoming, non-judgmental tone that reduces anxiety
- **Progressive Disclosure**: One step at a time with clear progress indication
- **Personalization**: Adaptive learning paths based on user answers
- **Auto-Save**: Progress is automatically saved every 2 seconds
- **Skip Option**: Users can skip onboarding, though it's not recommended
- **Mobile-Responsive**: Works seamlessly on all device sizes
- **Smooth Animations**: Powered by Framer Motion for delightful transitions

## Architecture

### Backend Components

#### 1. Models (`backend/models/`)

**OnboardingData.js**
- Stores user onboarding responses and progress
- Tracks completion status and current step
- Contains personalized recommendations after completion
- Auto-updates completion status when reaching final step

**UserPreference.js**
- Stores detailed user preferences for learning
- Includes learning, communication, notification, UI, privacy, and accessibility preferences
- Auto-updates timestamp on changes

**User.js** (Updated)
- Added `onboarding` field to track completion status
- Fields: `isCompleted`, `completedAt`, `skipped`

#### 2. Service (`backend/services/onboarding.service.js`)

Core business logic including:
- `getOnboardingStatus()`: Get user's current onboarding status
- `saveProgress()`: Auto-save onboarding progress
- `completeOnboarding()`: Finalize onboarding and generate recommendations
- `generatePersonalizedRecommendations()`: Create custom welcome message and suggestions
- `generateLearningPath()`: Build personalized learning path
- `skipOnboarding()`: Set defaults and mark as completed

#### 3. Routes (`backend/routes/onboarding.js`)

API Endpoints:
- `GET /api/onboarding/status` - Get onboarding status
- `POST /api/onboarding/progress` - Save progress (auto-save)
- `POST /api/onboarding/complete` - Complete onboarding
- `GET /api/onboarding/learning-path` - Get personalized learning path
- `POST /api/onboarding/skip` - Skip onboarding with defaults

All routes require authentication via JWT token.

### Frontend Components

#### 1. Types (`frontend/src/types/onboarding.types.ts`)

Comprehensive TypeScript interfaces including:
- `OnboardingData`: Main data structure
- `SkillLevel`, `LearningStyle`, `LearningPace`, etc.: Type definitions
- `PROGRAMMING_LANGUAGES`: 14 language options with metadata
- `LEARNING_GOALS`: Skill-level specific goals (beginner, intermediate, advanced)
- Default values and constants

#### 2. Service (`frontend/src/services/onboarding.service.ts`)

API client with methods:
- `getStatus()`: Fetch onboarding status
- `saveProgress()`: Save progress to backend
- `complete()`: Complete onboarding
- `getLearningPath()`: Get generated learning path
- `skip()`: Skip onboarding

Uses axios with automatic JWT token injection.

#### 3. Hook (`frontend/src/hooks/useOnboarding.ts`)

Custom React hook for state management:
- Manages all onboarding data and current step
- Auto-saves progress with 2-second debounce
- Provides navigation methods (`goToNextStep`, `goToPreviousStep`)
- Validates step completion with `canProceed()`
- Handles errors and loading states

#### 4. Step Components (`frontend/src/components/onboarding/`)

**IntroductionStep.tsx**
- Welcoming introduction with platform overview
- Explains the three learning modes (AI Mentorship, Code Review, Both)
- Reassures users about the process (3-5 minutes, no wrong answers)
- Beautiful animated cards and gradient backgrounds

**SkillLevelStep.tsx**
- Visual cards for Beginner, Intermediate, Advanced levels
- Language selection filtered by skill level
- Clear descriptions and helpful icons
- Beginner-friendly language suggestions

**GoalsStep.tsx**
- Multi-select goal cards
- Different goal sets per skill level (5-6 goals each)
- Visual icons for each goal
- Selected goals summary with remove option

**LearningStyleStep.tsx**
- Choice between AI Mentorship, Code Review, or Both (recommended)
- Detailed explanations of each mode
- Feature lists and best-for descriptions
- Contextual help based on selection

**PreferencesStep.tsx**
- Programming languages multi-select (14 languages)
- Learning pace slider (Relaxed, Moderate, Intensive)
- Time commitment slider (1-30 hours/week)
- Communication style (Concise, Balanced, Detailed)
- Live preview of selections

**ProfileSetupStep.tsx**
- Avatar selection (16 emoji options)
- Bio text area (500 character limit)
- Privacy settings (Public, Friends Only, Private)
- All fields optional with live profile preview

**CompletionStep.tsx**
- Celebration with confetti animation
- Personalized welcome message
- Summary of user selections
- Suggested features and next steps
- Call-to-action to start learning

**OnboardingFlow.tsx** (Main Orchestrator)
- Progress bar showing current step
- Smooth step transitions with AnimatePresence
- Navigation footer with Back/Continue buttons
- Auto-save indicator
- Error handling and display
- Skip option (with confirmation)

#### 5. Page (`frontend/src/app/onboarding/page.tsx`)

- Entry point for onboarding
- Checks authentication before rendering
- Redirects to signup if not authenticated
- Renders OnboardingFlow component

## User Flow

1. **User signs up** → Redirected to `/onboarding`
2. **Introduction** → Learn about CodeMentor (Step 0)
3. **Skill Level** → Select experience level and primary language (Step 1)
4. **Goals** → Choose learning goals (Step 2)
5. **Learning Style** → Pick AI Mentorship, Code Review, or Both (Step 3)
6. **Preferences** → Set languages, pace, time, communication style (Step 4)
7. **Profile Setup** → Optional avatar, bio, privacy settings (Step 5)
8. **Completion** → Review selections and personalized recommendations (Step 6)
9. **Redirect** → Sent to dashboard to start learning

## Integration Points

### Dashboard Integration

The dashboard (`frontend/src/app/dashboard/page.tsx`) checks onboarding status on load:
- If not completed → Redirects to `/onboarding`
- If completed → Shows dashboard

This ensures all users complete onboarding before accessing the platform.

### Authentication Flow

Onboarding requires a valid JWT token:
1. User registers/logs in → Receives JWT token
2. Token stored in localStorage
3. All onboarding API calls include token in Authorization header
4. Backend validates token with `authenticate` middleware

## Data Persistence

### Auto-Save Behavior

- Triggers 2 seconds after any data change
- Saves to backend via `POST /api/onboarding/progress`
- Shows "Saving..." indicator during save
- Shows "✓ Auto-saved" when complete
- Failures are logged but don't block user

### Manual Save

- Happens on step navigation (Next/Back buttons)
- Ensures data is persisted before moving
- Shows error toast if save fails

### Completion Save

- Final save when user clicks "Start Learning Now!"
- Triggers:
  - `POST /api/onboarding/complete`
  - Personalized recommendations generation
  - Learning path creation
  - User preferences update
- Redirects to dashboard on success

## Personalization Algorithm

### Welcome Message Generation

Based on:
- Skill level (beginner, intermediate, advanced)
- Primary language
- Learning style
- Goals

Creates a warm, personalized message that:
- Acknowledges user's starting point
- Explains their learning style choice
- Mentions their primary language
- References their goals
- Encourages them to start

### Challenge Suggestions

Algorithm:
1. Select 5 challenges based on skill level
2. Filter by primary language
3. Format as: `{topic}-{language}` (e.g., "hello-world-python")

### Learning Path Suggestions

Algorithm:
1. Map goals to learning paths (web → "web-development-fundamentals")
2. Add skill-level appropriate paths
3. Remove duplicates
4. Return top 5 paths

### Feature Suggestions

Based on learning style:
- AI Mentorship → ai-tutor, interactive-lessons, concept-explanations
- Code Review → code-challenges, peer-review, automated-feedback
- Both → combination of above + progress-tracking, achievement-system

## UI/UX Design Principles

### Tone & Language

- **Friendly & Conversational**: "Let's get started!" not "Begin"
- **Reassuring**: "There are no wrong answers"
- **Simple**: Avoiding technical jargon
- **Encouraging**: "You're all set!" with celebration

### Visual Design

- **Gradient Backgrounds**: Blue to purple theme throughout
- **Card-Based Layout**: Clear visual hierarchy
- **Icons & Emojis**: Make content scannable and friendly
- **Smooth Animations**: Framer Motion for all transitions
- **Progress Indicators**: Always show where user is in flow
- **Responsive**: Mobile-first design approach

### Accessibility

- **Semantic HTML**: Proper heading hierarchy
- **Keyboard Navigation**: All interactive elements accessible
- **Color Contrast**: WCAG AA compliant
- **Screen Readers**: Descriptive labels and ARIA attributes
- **Focus States**: Visible focus indicators

## Error Handling

### Backend Errors

- Validation errors → Returned as array with field names
- Authentication errors → 401 Unauthorized
- Server errors → 500 Internal Server Error
- All errors include descriptive messages

### Frontend Errors

- Network errors → Toast notification
- Validation errors → Inline error messages
- Auto-save failures → Logged silently
- Manual save failures → Toast notification
- Loading states → Spinner indicators

## Testing

### Manual Testing Checklist

Backend:
- [ ] All routes return correct status codes
- [ ] Validation works for required fields
- [ ] Auto-save persists data correctly
- [ ] Completion generates recommendations
- [ ] Learning path creation works
- [ ] Skip functionality sets defaults

Frontend:
- [ ] All steps render correctly
- [ ] Navigation works (Next/Back)
- [ ] Auto-save triggers after 2 seconds
- [ ] Validation prevents invalid progression
- [ ] Completion redirects to dashboard
- [ ] Skip confirmation works
- [ ] Responsive on mobile/tablet/desktop
- [ ] Animations are smooth
- [ ] Error states display correctly

## Future Enhancements

Potential improvements:
1. **A/B Testing**: Test different flows and messages
2. **Analytics**: Track drop-off points and completion rates
3. **Gamification**: Add XP rewards for completing onboarding
4. **Video Tutorials**: Short clips explaining each mode
5. **Social Proof**: Show how many users chose each option
6. **Language Localization**: Support multiple languages
7. **Accessibility Improvements**: Enhanced screen reader support
8. **Progress Recovery**: Email link to resume incomplete onboarding
9. **Skill Assessment**: Optional quiz to determine actual skill level
10. **Mentor Matching**: Pair users with human mentors based on goals

## Security Considerations

- All routes require authentication
- Input validation on both frontend and backend
- SQL injection protection via mongoose ODM
- XSS prevention via React's built-in escaping
- CSRF protection via JWT tokens
- Rate limiting on API endpoints
- Secure password storage (handled in auth system)

## Performance Optimization

- Code splitting per step component
- Lazy loading of non-critical components
- Debounced auto-save to reduce API calls
- Optimized re-renders with React.memo and useCallback
- Compressed assets and images
- CDN for static resources (in production)

## Deployment Notes

### Environment Variables

Backend (.env):
```
MONGODB_URI=mongodb://localhost:27017/codementor-ai
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
```

Frontend (.env.local):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database Indexes

Ensure these indexes exist for optimal performance:
- `OnboardingData`: `userId` (unique), `isCompleted`, `createdAt`
- `UserPreference`: `userId` (unique)
- `User`: `onboarding.isCompleted`

## Troubleshooting

### Common Issues

**Auto-save not working**
- Check network tab for failed requests
- Verify JWT token is valid
- Check 2-second debounce timer

**Redirect loop between dashboard and onboarding**
- Clear localStorage
- Check onboarding completion status in database
- Verify JWT token includes user ID

**TypeScript errors**
- Run `npm run type-check`
- Ensure all types are imported correctly
- Check for null vs undefined issues

**Build failures**
- Clear .next folder
- Run `npm install` to update dependencies
- Check for syntax errors in new files

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check backend logs for API errors
4. Consult the team's Slack channel
5. Create a GitHub issue with reproduction steps

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintainer**: CodeMentor AI Team
