/**
 * Handles API errors and returns a user-friendly message.
 * @param {Error|Response} error - The error object or failed fetch Response
 * @returns {string} - User-friendly error message
 */
export function apiErrorHandler(error) {
  if (error instanceof Response) {
    // HTTP error from fetch
    switch (error.status) {
      case 400:
        return 'Bad request. Please try again.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Access denied. You do not have permission.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please slow down.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Unexpected error (${error.status}). Please try again.`;
    }
  } else if (error instanceof Error) {
    // Network or JS error
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection.';
    }
    return error.message || 'An unknown error occurred.';
  } else {
    return 'An unknown error occurred.';
  }
} 