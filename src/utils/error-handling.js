/**
 * Advanced Error Handling & Recovery System
 * Comprehensive error management with recovery strategies
 */

/**
 * Error Types
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  RATE_LIMITED: 'RATE_LIMITED_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Error Severity Levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Custom Error Class
 */
export class AppError extends Error {
  constructor(
    message,
    type = ErrorTypes.UNKNOWN,
    statusCode = 500,
    severity = ErrorSeverity.HIGH,
    originalError = null
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.severity = severity;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.userMessage = this._getUserMessage();
  }

  /**
   * Get user-friendly message
   */
  _getUserMessage() {
    const messages = {
      [ErrorTypes.NETWORK]: 'Network connection failed. Please check your internet connection.',
      [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
      [ErrorTypes.AUTHENTICATION]: 'Please log in to continue.',
      [ErrorTypes.AUTHORIZATION]: 'You do not have permission to perform this action.',
      [ErrorTypes.SERVER]: 'Server error. Please try again later.',
      [ErrorTypes.TIMEOUT]: 'Request took too long. Please try again.',
      [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorTypes.CONFLICT]: 'There was a conflict. Please refresh and try again.',
      [ErrorTypes.RATE_LIMITED]: 'Too many requests. Please wait before trying again.',
      [ErrorTypes.UNKNOWN]: 'An unexpected error occurred.',
    };

    return messages[this.type] || messages[ErrorTypes.UNKNOWN];
  }

  /**
   * Is retriable
   */
  isRetriable() {
    return [
      ErrorTypes.NETWORK,
      ErrorTypes.TIMEOUT,
      ErrorTypes.RATE_LIMITED,
      ErrorTypes.SERVER,
    ].includes(this.type);
  }

  /**
   * Should notify user
   */
  shouldNotifyUser() {
    return [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL].includes(this.severity);
  }

  /**
   * To object
   */
  toObject() {
    return {
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      severity: this.severity,
      userMessage: this.userMessage,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Error Factory
 */
export class ErrorFactory {
  static create(error, type = ErrorTypes.UNKNOWN, severity = ErrorSeverity.HIGH) {
    if (error instanceof AppError) return error;
    return new AppError(
      error?.message || String(error),
      type,
      500,
      severity,
      error
    );
  }

  static createNetworkError(message, originalError) {
    return new AppError(
      message || 'Network request failed',
      ErrorTypes.NETWORK,
      0,
      ErrorSeverity.HIGH,
      originalError
    );
  }

  static createValidationError(message, originalError) {
    return new AppError(
      message || 'Validation failed',
      ErrorTypes.VALIDATION,
      400,
      ErrorSeverity.MEDIUM,
      originalError
    );
  }

  static createAuthenticationError(message = 'Authentication failed') {
    return new AppError(
      message,
      ErrorTypes.AUTHENTICATION,
      401,
      ErrorSeverity.HIGH
    );
  }

  static createAuthorizationError(message = 'Access denied') {
    return new AppError(
      message,
      ErrorTypes.AUTHORIZATION,
      403,
      ErrorSeverity.HIGH
    );
  }

  static createServerError(statusCode, message, originalError) {
    return new AppError(
      message || 'Server error',
      ErrorTypes.SERVER,
      statusCode,
      ErrorSeverity.CRITICAL,
      originalError
    );
  }

  static createTimeoutError() {
    return new AppError(
      'Request timeout',
      ErrorTypes.TIMEOUT,
      408,
      ErrorSeverity.MEDIUM
    );
  }

  static createNotFoundError(resource) {
    return new AppError(
      `${resource} not found`,
      ErrorTypes.NOT_FOUND,
      404,
      ErrorSeverity.LOW
    );
  }

  static createConflictError(message) {
    return new AppError(
      message || 'Resource conflict',
      ErrorTypes.CONFLICT,
      409,
      ErrorSeverity.MEDIUM
    );
  }

  static createRateLimitError() {
    return new AppError(
      'Rate limit exceeded',
      ErrorTypes.RATE_LIMITED,
      429,
      ErrorSeverity.HIGH
    );
  }

  static fromHttpResponse(response) {
    const { status, statusText } = response;

    if (status === 401) {
      return this.createAuthenticationError();
    }
    if (status === 403) {
      return this.createAuthorizationError();
    }
    if (status === 404) {
      return this.createNotFoundError('Resource');
    }
    if (status === 409) {
      return this.createConflictError();
    }
    if (status === 429) {
      return this.createRateLimitError();
    }
    if (status >= 500) {
      return this.createServerError(status, statusText);
    }
    if (status >= 400) {
      return this.createValidationError(statusText);
    }

    return new AppError(statusText, ErrorTypes.UNKNOWN, status);
  }
}

/**
 * Error Recovery Strategy
 */
export class ErrorRecoveryStrategy {
  static getStrategy(error) {
    if (error.type === ErrorTypes.NETWORK) {
      return {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        fallbackAction: 'offline_mode',
      };
    }

    if (error.type === ErrorTypes.TIMEOUT) {
      return {
        maxRetries: 2,
        retryDelay: 2000,
        exponentialBackoff: true,
        fallbackAction: 'cached_data',
      };
    }

    if (error.type === ErrorTypes.RATE_LIMITED) {
      return {
        maxRetries: 1,
        retryDelay: 5000,
        exponentialBackoff: false,
        fallbackAction: 'queue_request',
      };
    }

    if (error.type === ErrorTypes.AUTHENTICATION) {
      return {
        maxRetries: 0,
        fallbackAction: 'redirect_to_login',
      };
    }

    return {
      maxRetries: 0,
      fallbackAction: 'show_error',
    };
  }
}

/**
 * Retry Manager
 */
export class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.attempts = 0;
  }

  /**
   * Execute with retry
   */
  async executeWithRetry(fn, onRetry = null) {
    this.attempts = 0;

    while (this.attempts < this.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        this.attempts++;

        if (this.attempts >= this.maxRetries) {
          throw error;
        }

        const delay = this.baseDelay * Math.pow(2, this.attempts - 1);

        if (onRetry) {
          onRetry(error, this.attempts, delay);
        }

        await this._sleep(delay);
      }
    }
  }

  /**
   * Sleep helper
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get attempt count
   */
  getAttemptCount() {
    return this.attempts;
  }

  /**
   * Reset
   */
  reset() {
    this.attempts = 0;
  }
}

/**
 * Error Boundary
 */
export class ErrorBoundary {
  constructor(onError = null) {
    this.onError = onError;
    this.errors = [];
    this.errorCount = 0;
  }

  /**
   * Catch error
   */
  catch(error, context = '') {
    const appError = error instanceof AppError
      ? error
      : new AppError(
        error.message || String(error),
        ErrorTypes.UNKNOWN,
        500,
        ErrorSeverity.HIGH,
        error
      );

    this.errors.push({
      error: appError,
      context,
      timestamp: new Date().toISOString(),
    });

    this.errorCount++;

    if (this.onError) {
      this.onError(appError, context);
    }

    return appError;
  }

  /**
   * Get errors
   */
  getErrors(context = null) {
    if (!context) return this.errors;
    return this.errors.filter(e => e.context === context);
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
    this.errorCount = 0;
  }

  /**
   * Get error count
   */
  getErrorCount() {
    return this.errorCount;
  }
}

/**
 * Error Handler
 */
export class ErrorHandler {
  constructor() {
    this.errorBoundary = new ErrorBoundary();
    this.retryManager = new RetryManager();
    this.handlers = new Map();
    this._setupDefaultHandlers();
  }

  /**
   * Handle error
   */
  handle(error, context = '') {
    const appError = this.errorBoundary.catch(error, context);

    // Get handler for error type
    const handler = this.handlers.get(appError.type);
    if (handler) {
      handler(appError);
    }

    // Get recovery strategy
    const strategy = ErrorRecoveryStrategy.getStrategy(appError);
    return { error: appError, strategy };
  }

  /**
   * Register error handler
   */
  registerHandler(errorType, handler) {
    this.handlers.set(errorType, handler);
  }

  /**
   * Setup default handlers
   */
  _setupDefaultHandlers() {
    this.registerHandler(ErrorTypes.AUTHENTICATION, (error) => {
      // Redirect to login
      window.location.href = '/login';
    });

    this.registerHandler(ErrorTypes.AUTHORIZATION, (error) => {
      console.error('Access denied:', error.message);
    });

    this.registerHandler(ErrorTypes.SERVER, (error) => {
      console.error('Server error:', error.message);
      // Send to error tracking service
    });
  }

  /**
   * Get error boundary
   */
  getErrorBoundary() {
    return this.errorBoundary;
  }

  /**
   * Get retry manager
   */
  getRetryManager() {
    return this.retryManager;
  }
}

/**
 * Error Logger
 */
export class ErrorLogger {
  constructor() {
    this.errors = [];
  }

  /**
   * Log error
   */
  logError(error, context = '', additionalData = {}) {
    const log = {
      timestamp: new Date().toISOString(),
      error: error instanceof AppError ? error.toObject() : { message: String(error) },
      context,
      additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errors.push(log);

    if (error.severity === ErrorSeverity.CRITICAL) {
      this._sendToServer(log);
    }

    return log;
  }

  /**
   * Get errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Export errors
   */
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }

  /**
   * Send to server
   */
  async _sendToServer(log) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.error('Failed to send error log to server:', error);
    }
  }
}

// Create singleton instances
export const errorHandler = new ErrorHandler();
export const errorLogger = new ErrorLogger();

export default {
  AppError,
  ErrorFactory,
  ErrorRecoveryStrategy,
  RetryManager,
  ErrorBoundary,
  ErrorHandler,
  ErrorLogger,
  ErrorTypes,
  ErrorSeverity,
  errorHandler,
  errorLogger,
};
