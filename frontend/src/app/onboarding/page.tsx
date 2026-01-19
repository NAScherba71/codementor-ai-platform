'use client'

/**
 * Onboarding Page
 * Main entry point for the onboarding flow
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export default function OnboardingPage() {
  const router = useRouter()

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/signup?redirect=/onboarding')
    }
  }, [router])

  return <OnboardingFlow />
}
