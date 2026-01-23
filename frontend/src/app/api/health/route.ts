import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * GET /api/health
 * Checks frontend health and optionally backend connectivity
 */
export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  
  const healthStatus: {
    status: string;
    timestamp: string;
    environment: string;
    frontend: {
      status: string;
      version: string;
    };
    backend: {
      configured: boolean;
      url: string;
      status: string;
      error?: string;
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    frontend: {
      status: 'ok',
      version: '1.0.0'
    },
    backend: {
      configured: !!backendUrl,
      url: backendUrl ? (isProduction ? '[REDACTED]' : backendUrl) : 'not configured',
      status: 'unknown'
    }
  };

  // Try to check backend connectivity if configured
  if (backendUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      healthStatus.backend.status = response.ok ? 'connected' : 'error';
      
      if (!response.ok) {
        healthStatus.status = 'degraded';
      }
    } catch (error) {
      healthStatus.backend.status = 'unreachable';
      healthStatus.status = 'degraded';
      
      if (!isProduction) {
        healthStatus.backend.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  } else {
    if (isProduction) {
      healthStatus.status = 'degraded';
      healthStatus.backend.status = 'not configured';
    } else {
      healthStatus.backend.status = 'using localhost fallback';
    }
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(healthStatus, { status: statusCode });
}
