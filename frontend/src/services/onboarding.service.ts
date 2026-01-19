/**
 * Onboarding Service
 * API calls for the onboarding subsystem
 */

import axios from 'axios'
import {
  OnboardingData,
  OnboardingStatus,
  OnboardingApiResponse,
  GeneratedLearningPath
} from '@/types/onboarding.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

/**
 * Onboarding Service
 */
export const onboardingService = {
  /**
   * Get user's onboarding status
   * @returns Promise with onboarding status
   */
  async getStatus(): Promise<OnboardingStatus> {
    try {
      const response = await apiClient.get<OnboardingApiResponse<OnboardingStatus>>(
        '/api/onboarding/status'
      )
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to get onboarding status')
    } catch (error: any) {
      console.error('Get onboarding status error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to get onboarding status')
    }
  },

  /**
   * Save onboarding progress
   * @param progressData - Partial onboarding data to save
   * @returns Promise with updated progress
   */
  async saveProgress(progressData: Partial<OnboardingData>): Promise<any> {
    try {
      const response = await apiClient.post<OnboardingApiResponse>(
        '/api/onboarding/progress',
        progressData
      )
      
      if (response.data.success) {
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to save progress')
    } catch (error: any) {
      console.error('Save onboarding progress error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to save progress')
    }
  },

  /**
   * Complete onboarding process
   * @param finalData - Complete onboarding data
   * @returns Promise with completion result and recommendations
   */
  async complete(finalData: Omit<OnboardingData, 'userId' | 'currentStep' | 'isCompleted'>): Promise<any> {
    try {
      const response = await apiClient.post<OnboardingApiResponse>(
        '/api/onboarding/complete',
        finalData
      )
      
      if (response.data.success) {
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to complete onboarding')
    } catch (error: any) {
      console.error('Complete onboarding error:', error)
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
          .map((err: any) => err.msg)
          .join(', ')
        throw new Error(validationErrors)
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to complete onboarding')
    }
  },

  /**
   * Get personalized learning path
   * @returns Promise with generated learning path
   */
  async getLearningPath(): Promise<GeneratedLearningPath> {
    try {
      const response = await apiClient.get<OnboardingApiResponse<GeneratedLearningPath>>(
        '/api/onboarding/learning-path'
      )
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to get learning path')
    } catch (error: any) {
      console.error('Get learning path error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to get learning path')
    }
  },

  /**
   * Skip onboarding and use defaults
   * @returns Promise with skip result
   */
  async skip(): Promise<any> {
    try {
      const response = await apiClient.post<OnboardingApiResponse>(
        '/api/onboarding/skip'
      )
      
      if (response.data.success) {
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Failed to skip onboarding')
    } catch (error: any) {
      console.error('Skip onboarding error:', error)
      throw new Error(error.response?.data?.message || error.message || 'Failed to skip onboarding')
    }
  }
}

export default onboardingService
