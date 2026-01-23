/**
 * Shared configuration for AI Console API routes
 */

import { NextRequest, NextResponse } from 'next/server';

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
  const backendUrl = 
    process.env.NEXT_PUBLIC_API_URL || 
    process.env.BACKEND_API_URL || 
    '';
  
  // In production, require explicit backend URL configuration
  if (isProduction() && !backendUrl) {
    console.error('❌ BACKEND URL NOT CONFIGURED: NEXT_PUBLIC_API_URL environment variable is required in production');
    throw new Error('Backend service not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
  }
  
  // In development, use localhost fallback
  const finalUrl = backendUrl || 'http://localhost:3001';
  
  // Log the backend URL being used (without sensitive data)
  console.log(`🔗 Backend URL: ${finalUrl} (environment: ${process.env.NODE_ENV || 'development'})`);
  
  return finalUrl;
}

/**
 * Proxy a POST request to the backend API
 * @param request - The incoming Next.js request
 * @param endpoint - The backend endpoint path (e.g., '/api/ai-console/analyze')
 * @returns NextResponse with the backend's response or error
 */
export async function proxyToBackend(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse> {
  let backendUrl: string = '';
  let targetUrl: string = '';
  
  try {
    // Get backend URL - this may throw if not configured in production
    try {
      backendUrl = getBackendUrl();
      targetUrl = `${backendUrl}${endpoint}`;
    } catch (configError) {
      console.error('❌ Configuration error:', configError);
      return NextResponse.json(
        {
          success: false,
          error: 'Backend service not configured',
          details: configError instanceof Error ? configError.message : 'Unknown configuration error',
          troubleshooting: {
            message: 'The backend service URL is not configured.',
            steps: [
              'Set the NEXT_PUBLIC_API_URL environment variable',
              'For Cloud Run: Use the backend service URL (e.g., https://codementor-backend-xxx.region.run.app)',
              'For local development: Use http://localhost:3001',
              'Restart the application after setting the environment variable'
            ]
          }
        },
        { status: 503 }
      );
    }
    
    console.log(`📤 Proxying request to: ${targetUrl}`);
    
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Invalid request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }
    
    // Forward request to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📥 Response status: ${response.status}`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error('❌ Non-JSON response from backend:', text);
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
      
      // Handle timeout or network errors
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`❌ Request timeout for ${targetUrl}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Backend service timeout',
            details: 'The backend service did not respond within 30 seconds',
            troubleshooting: {
              message: 'The backend service is taking too long to respond.',
              steps: [
                'Check if the backend service is running',
                'Verify the backend service URL is correct',
                'Check backend service logs for errors'
              ]
            }
          },
          { status: 504 }
        );
      }
      
      throw fetchError; // Re-throw other fetch errors to be caught by outer catch
    }
  } catch (error) {
    console.error(`❌ Proxy error for ${endpoint}:`, error);
    
    // Determine error type and provide helpful message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetworkError = errorMessage.includes('fetch') || 
                          errorMessage.includes('ECONNREFUSED') || 
                          errorMessage.includes('ENOTFOUND') ||
                          errorMessage.includes('network');
    
    if (isNetworkError) {
      console.error(`❌ Network error - cannot reach backend at ${targetUrl || 'unknown URL'}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot connect to backend service',
          details: errorMessage,
          troubleshooting: {
            message: 'Unable to establish connection to the backend service.',
            steps: [
              'Verify the backend service is running',
              'Check the NEXT_PUBLIC_API_URL environment variable is set correctly',
              'Ensure network connectivity between frontend and backend',
              'For Cloud Run: Verify the backend service is deployed and accessible',
              'Check backend service logs for startup errors'
            ]
          }
        },
        { status: 503 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
