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
 * Check if we're running in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get the backend API URL from environment variables
 * Priority: NEXT_PUBLIC_API_URL > BACKEND_API_URL > localhost fallback
 * @throws Error in production if no backend URL is configured
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
      
      // Handle timeout errors
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[Proxy] Request timeout for ${targetUrl}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Backend service timeout',
            details: `The backend service did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds`,
            troubleshooting: {
              likely_cause: 'Backend service is slow or overloaded',
              solution: 'Check backend service health and performance',
              documentation: 'See DEPLOYMENT_GUIDE.md and frontend/BACKEND_CONFIG.md'
            },
            backend_url: backendUrl,
            is_configured: IS_CONFIGURED,
            error_category: 'timeout'
          },
          { status: 504 }
        );
      }
      
      // Re-throw for outer catch
      throw fetchError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Proxy] Error after ${duration}ms for ${endpoint}:`, error);
    
    // Determine error details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCause = (error as any)?.cause;
    const isConnectionRefused = errorCause?.code === 'ECONNREFUSED' || 
                               errorCause?.code === 'ENOTFOUND' ||
                               errorMessage.includes('fetch failed');
    
    let category: 'network' | 'timeout' | 'config' | 'unknown' = 'unknown';
    let likelyCause = 'Unknown configuration or network issue';
    let solution = 'Check backend configuration and logs';
    
    if (isConnectionRefused) {
      category = 'network';
      likelyCause = !IS_CONFIGURED 
        ? 'Backend URL not configured for Cloud Run deployment'
        : 'Backend service is not running or not reachable';
      solution = !IS_CONFIGURED
        ? 'Set NEXT_PUBLIC_API_URL environment variable to your backend Cloud Run URL'
        : 'Verify backend service is running and URL is correct';
    } else if (!isValidUrl(BACKEND_URL)) {
      category = 'config';
      likelyCause = 'Invalid backend URL configuration';
      solution = 'Check your environment variables';
    }
    
    // Build enhanced error response
    const errorResponse = {
      success: false,
      error: isConnectionRefused ? 'Cannot connect to backend service' : 'Failed to process request',
      details: errorMessage,
      troubleshooting: {
        likely_cause: likelyCause,
        solution: solution,
        documentation: 'See DEPLOYMENT_GUIDE.md and frontend/BACKEND_CONFIG.md for configuration instructions'
      },
      backend_url: backendUrl,
      is_configured: IS_CONFIGURED,
      error_category: category
    };
    
    return NextResponse.json(errorResponse, { status: category === 'network' ? 503 : 500 });
  }
}
