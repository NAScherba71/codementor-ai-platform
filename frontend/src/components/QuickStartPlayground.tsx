'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Code, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  language: string
  starterCode: string
  solution?: string
}

const quickChallenges: Challenge[] = [
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    description: 'Write a function that reverses a string.',
    difficulty: 'easy',
    language: 'javascript',
    starterCode: `function reverseString(str) {
  // Your code here
}

// Test
console.log(reverseString("hello")); // Expected: "olleh"`,
    solution: 'return str.split("").reverse().join("");',
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    description: 'Print numbers 1 to N, but for multiples of 3 print "Fizz", for multiples of 5 print "Buzz", and for multiples of both print "FizzBuzz".',
    difficulty: 'easy',
    language: 'javascript',
    starterCode: `function fizzBuzz(n) {
  // Your code here
}

// Test
fizzBuzz(15);`,
  },
  {
    id: 'palindrome',
    title: 'Check Palindrome',
    description: 'Determine if a string is a palindrome.',
    difficulty: 'easy',
    language: 'javascript',
    starterCode: `function isPalindrome(str) {
  // Your code here
}

// Test
console.log(isPalindrome("racecar")); // Expected: true`,
  },
]

export default function QuickStartPlayground() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(quickChallenges[0])
  const [code, setCode] = useState(selectedChallenge.starterCode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | null; message: string }>({
    status: null,
    message: '',
  })

  const handleChallengeSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setCode(challenge.starterCode)
    setFeedback({ status: null, message: '' })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setFeedback({ status: null, message: '' })

    try {
      // Call the Gemini 3 Flash endpoint for instant feedback
      const response = await fetch('/api/ai/quick-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          code,
          language: selectedChallenge.language,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFeedback({
          status: 'success',
          message: data.feedback || 'Great job! Your solution looks good. 🎉',
        })
      } else {
        setFeedback({
          status: 'error',
          message: data.feedback || 'There are some issues with your solution. Try again!',
        })
      }
    } catch (error) {
      setFeedback({
        status: 'error',
        message: 'Failed to submit your solution. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Quick Start AI Playground</h3>
            <p className="text-sm text-purple-100">Powered by Gemini 3 Flash - Sub-second feedback</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 p-6">
        {/* Challenge Selection */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Choose a Challenge</h4>
          {quickChallenges.map((challenge) => (
            <motion.button
              key={challenge.id}
              onClick={() => handleChallengeSelect(challenge)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                selectedChallenge.id === challenge.id
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-gray-900 text-sm">{challenge.title}</h5>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    challenge.difficulty === 'easy'
                      ? 'bg-green-100 text-green-700'
                      : challenge.difficulty === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {challenge.difficulty}
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{challenge.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Code Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">{selectedChallenge.title}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Code className="h-4 w-4" />
                {selectedChallenge.language}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedChallenge.description}</p>
          </div>

          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none"
              placeholder="Write your code here..."
              spellCheck={false}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !code.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Get Instant Feedback
              </>
            )}
          </button>

          {/* Feedback */}
          {feedback.status && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 ${
                feedback.status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h5
                    className={`font-semibold text-sm mb-1 ${
                      feedback.status === 'success' ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {feedback.status === 'success' ? 'Success! ✨' : 'Try Again 💪'}
                  </h5>
                  <p
                    className={`text-sm ${
                      feedback.status === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {feedback.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
