/**
 * Error handling utilities for API calls
 */

import { NetworkError, RateLimitError, ServerError, ValidationError } from './api';

export interface ErrorState {
  message: string;
  type: 'network' | 'rate_limit' | 'server' | 'validation' | 'unknown';
  canRetry: boolean;
  showUpgrade: boolean;
  details?: string;
}

/**
 * Convert API errors to user-friendly error states
 */
export function handleApiError(error: unknown): ErrorState {
  // Network errors - can retry
  if (error instanceof NetworkError) {
    return {
      message: 'Unable to connect to server',
      type: 'network',
      canRetry: true,
      showUpgrade: false,
      details: 'Please check your internet connection and try again.',
    };
  }

  // Rate limit errors - show upgrade prompt
  if (error instanceof RateLimitError) {
    return {
      message: `Rate limit exceeded (${error.remaining}/${error.limit} calls remaining)`,
      type: 'rate_limit',
      canRetry: false,
      showUpgrade: true,
      details: 'Upgrade to Pro for unlimited analysis requests.',
    };
  }

  // Server errors - can retry
  if (error instanceof ServerError) {
    return {
      message: 'Server error occurred',
      type: 'server',
      canRetry: true,
      showUpgrade: false,
      details: error.message || 'The server encountered an error. Please try again.',
    };
  }

  // Validation errors - cannot retry without fixing data
  if (error instanceof ValidationError) {
    return {
      message: 'Invalid data provided',
      type: 'validation',
      canRetry: false,
      showUpgrade: false,
      details: error.message,
    };
  }

  // Unknown errors
  if (error instanceof Error) {
    return {
      message: 'An unexpected error occurred',
      type: 'unknown',
      canRetry: true,
      showUpgrade: false,
      details: error.message,
    };
  }

  // Fallback for non-Error objects
  return {
    message: 'An unexpected error occurred',
    type: 'unknown',
    canRetry: true,
    showUpgrade: false,
    details: String(error),
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(errorState: ErrorState): string {
  return errorState.message;
}

/**
 * Get error action text
 */
export function getErrorAction(errorState: ErrorState): string {
  if (errorState.showUpgrade) {
    return 'Upgrade to Pro';
  }
  if (errorState.canRetry) {
    return 'Try Again';
  }
  return 'Dismiss';
}

/**
 * Log error to console with context
 */
export function logError(context: string, error: unknown): void {
  console.error(`[PerfectASIN] ${context}:`, error);

  // In production, you might want to send errors to a monitoring service
  // e.g., Sentry, LogRocket, etc.
}
