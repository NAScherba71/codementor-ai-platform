/**
 * Shared configuration for AI Console API routes
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration validation and logging
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 
                    process.env.BACKEND_API_URL || 
                    'http://localhost:3001';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_CONFIGURED = !!(process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL);
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// Validate configuration on module load
// Note: In serverless environments (Cloud Run), this executes once per cold start
// which is acceptable for logging configuration status
if (!IS_CONFIGURED && IS_PRODUCTION) {
  console.warn('⚠️  WARNING: Backend URL not configured for production deployment!');
  console.warn('   Using localhost fallback which will fail in Cloud Run.');
  console.warn('   Please set NEXT_PUBLIC_API_URL environment variable.');
}

// Log backend URL on startup
// This helps with debugging and verifying configuration
console.log(`✓ Backend URL configured: ${BACKEND_URL}`);
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  Explicitly configured: ${IS_CONFIGURED ? 'Yes' : 'No (using fallback)'}`);
/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get the backend API URL from environment variables
 * Priority: NEXT_PUBLIC_API_URL > BACKEND_API_URL > localhost fallback
 */
export function getBackendUrl(): string {
  return BACKEND_URL;
}

/**
 * Check if backend URL is properly configured
 */
export function isBackendConfigured(): boolean {
  return IS_CONFIGURED;
}

/**
 * Categorize error type for better user messaging
 * @param error - The error object to categorize
 * @returns Object containing error category, user-friendly message, and troubleshooting advice
 */
function categorizeError(error: Error): {
  category: 'network' | 'timeout' | 'config' | 'unknown';
  userMessage: string;
  troubleshooting: string;
} {
  const message = error.message.toLowerCase();
  
  if (message.includes('fetch failed') || message.includes('econnrefused') || message.includes('network')) {
    return {
      category: 'network',
      userMessage: 'Cannot connect to backend service',
      troubleshooting: 'The backend service is not reachable. Check if the backend URL is correct and the service is running.'
    };
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return {
      category: 'timeout',
      userMessage: 'Backend service timeout',
      troubleshooting: 'The backend took too long to respond. The service may be slow or experiencing issues.'
    };
  }
  
  if (!isValidUrl(BACKEND_URL)) {
    return {
      category: 'config',
      userMessage: 'Invalid backend URL configuration',
      troubleshooting: 'The backend URL is not properly formatted. Check your environment variables.'
    };
  }
  
  return {
    category: 'unknown',
    userMessage: 'Unexpected error connecting to backend',
    troubleshooting: 'An unexpected error occurred. Check the browser console for more details.'
  };
}

/**
 * Proxy a POST request to the backend API with enhanced error handling
 * @param request - The incoming Next.js request
 * @param endpoint - The backend endpoint path (e.g., '/api/ai-console/analyze')
 * @returns NextResponse with the backend's response or error
 */
export async function proxyToBackend(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse> {
  const startTime = Date.now();
  const backendUrl = getBackendUrl();
  const targetUrl = `${backendUrl}${endpoint}`;
  
  // Log the request
  console.log(`[Proxy] ${endpoint} -> ${targetUrl}`);
  
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Proxy] Invalid request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
      // Forward request to backend
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      console.log(`[Proxy] ${endpoint} completed in ${duration}ms (status: ${response.status})`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error(`[Proxy] Non-JSON response from ${endpoint}:`, text);
        return NextResponse.json(
          {
            success: false,
            error: 'Backend returned non-JSON response',
            details: text,
          },
          { status: response.status || 500 }
        );
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Proxy] Error after ${duration}ms for ${endpoint}:`, error);
    
    const errorDetails = categorizeError(error as Error);
    
    // Build enhanced error response
    const errorResponse = {
      success: false,
      error: errorDetails.userMessage,
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        likely_cause: !IS_CONFIGURED 
          ? 'Backend URL not configured for Cloud Run deployment'
          : errorDetails.category === 'network'
          ? 'Backend service is not running or not reachable'
          : errorDetails.category === 'timeout'
          ? 'Backend service is slow or overloaded'
          : 'Unknown configuration or network issue',
        solution: !IS_CONFIGURED
          ? 'Set NEXT_PUBLIC_API_URL environment variable to your backend Cloud Run URL'
          : errorDetails.category === 'network'
          ? 'Verify backend service is running and URL is correct'
          : errorDetails.category === 'timeout'
          ? 'Check backend service health and performance'
          : 'Check backend configuration and logs',
        documentation: 'See DEPLOYMENT_GUIDE.md and frontend/BACKEND_CONFIG.md for configuration instructions'
      },
      backend_url: backendUrl,
      is_configured: IS_CONFIGURED,
      error_category: errorDetails.category
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
