import { NextResponse } from 'next/server';
import { getBackendUrl, isBackendConfigured } from '../ai-console/config';

/**
 * API Route: GET /api/health
 * Health check endpoint that verifies backend connectivity
 */
export async function GET() {
  const backendUrl = getBackendUrl();
  const isConfigured = isBackendConfigured();
  
  const healthStatus = {
    status: 'unknown',
    frontend: 'healthy',
    backend: 'unknown',
    backend_url: backendUrl,
    is_configured: isConfigured,
    timestamp: new Date().toISOString(),
    checks: {
      environment: process.env.NODE_ENV || 'development',
      config_valid: isConfigured,
      backend_reachable: false,
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
    
    healthStatus.checks.backend_reachable = response.ok;
    healthStatus.backend = response.ok ? 'healthy' : 'unhealthy';
    
    if (response.ok && isConfigured) {
      healthStatus.status = 'healthy';
    } else if (!isConfigured) {
      healthStatus.status = 'warning';
    } else {
      healthStatus.status = 'unhealthy';
    }
  } catch (error) {
    console.error('[Health Check] Backend unreachable:', error);
    healthStatus.backend = 'unreachable';
    healthStatus.status = isConfigured ? 'unhealthy' : 'warning';
    healthStatus.checks.backend_reachable = false;
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                     healthStatus.status === 'warning' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}
