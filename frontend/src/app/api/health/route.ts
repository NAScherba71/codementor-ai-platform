import { NextResponse } from 'next/server';
import { getBackendUrl, isBackendConfigured } from '../ai-console/config';

/**
 * API Route: GET /api/health
 * Health check endpoint that verifies backend connectivity
 */
export async function GET() {
  const backendUrl = getBackendUrl();
  const isConfigured = isBackendConfigured();
  const isProduction = process.env.NODE_ENV === 'production';
  
  const healthStatus = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    frontend: {
      status: 'healthy',
      version: '1.0.0'
    },
    backend: {
      status: 'unknown',
      configured: isConfigured,
      url: isConfigured ? (isProduction ? '[REDACTED]' : backendUrl) : 'not configured',
      reachable: false,
      error: undefined as string | undefined
    }
  };

  // Try to reach backend health endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    healthStatus.backend.reachable = response.ok;
    healthStatus.backend.status = response.ok ? 'healthy' : 'unhealthy';
    
    // Determine overall status
    if (response.ok && isConfigured) {
      healthStatus.status = 'healthy';
    } else if (!isConfigured) {
      healthStatus.status = 'warning';
    } else {
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    console.error('[Health Check] Backend unreachable:', error);
    healthStatus.backend.status = 'unreachable';
    healthStatus.backend.reachable = false;
    
    if (!isProduction) {
      healthStatus.backend.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Determine status based on configuration
    if (isConfigured) {
      healthStatus.status = 'degraded';
    } else {
      healthStatus.status = 'warning';
    }
  }

  // Determine HTTP status code
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}
