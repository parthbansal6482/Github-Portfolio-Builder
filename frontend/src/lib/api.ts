// Typed API client for all backend communication
// Rule 9: All backend calls go through this file
'use client';

import type {
  GitHubData,
  UserPreferences,
  GeneratedCopy,
  FallbackCopy,
  Portfolio,
  ApiError,
} from '@/types';
import { getSession } from 'next-auth/react';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// ============================================
// Internal helpers
// ============================================

class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.status = error.status;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const session = await getSession();
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  return headers;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      const body = await response.json();
      errorData = body.error || {
        message: body.message || response.statusText,
        code: 'UNKNOWN_ERROR',
        status: response.status,
      };
    } catch {
      errorData = {
        message: response.statusText || 'Request failed',
        code: 'UNKNOWN_ERROR',
        status: response.status,
      };
    }
    throw new ApiRequestError(errorData);
  }

  return response.json() as Promise<T>;
}

// ============================================
// GitHub
// ============================================

export async function fetchGitHubData(): Promise<GitHubData> {
  return apiRequest<GitHubData>('/api/github/fetch', {
    method: 'POST',
  });
}

export async function resyncGitHubData(): Promise<GitHubData> {
  return apiRequest<GitHubData>('/api/github/resync', {
    method: 'POST',
  });
}

// ============================================
// AI Generation
// ============================================

export async function generateCopy(
  preferences: UserPreferences
): Promise<GeneratedCopy | FallbackCopy> {
  return apiRequest<GeneratedCopy | FallbackCopy>('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ preferences }),
  });
}

// ============================================
// Portfolio CRUD
// ============================================

export async function saveCopy(
  copy: GeneratedCopy | FallbackCopy
): Promise<void> {
  await apiRequest<void>('/api/portfolio/save', {
    method: 'POST',
    body: JSON.stringify({ copy }),
  });
}

export async function savePreferences(
  preferences: UserPreferences
): Promise<void> {
  await apiRequest<void>('/api/portfolio/save-preferences', {
    method: 'POST',
    body: JSON.stringify({ preferences }),
  });
}

export async function publishPortfolio(): Promise<{ url: string }> {
  return apiRequest<{ url: string }>('/api/portfolio/publish', {
    method: 'POST',
  });
}

export async function unpublishPortfolio(): Promise<void> {
  await apiRequest<void>('/api/portfolio/unpublish', {
    method: 'POST',
  });
}

// ============================================
// Dashboard
// ============================================

export async function getDashboard(): Promise<{
  portfolio: Portfolio;
  viewCount: number;
}> {
  return apiRequest<{ portfolio: Portfolio; viewCount: number }>(
    '/api/dashboard'
  );
}

// ============================================
// Views
// ============================================

export async function incrementViewCount(username: string): Promise<void> {
  await apiRequest<void>(`/api/views/${username}`, {
    method: 'POST',
  });
}

// ============================================
// Re-exports for consumers
// ============================================
export { ApiRequestError };
