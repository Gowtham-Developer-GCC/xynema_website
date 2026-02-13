/**
 * Enterprise-grade Logging & Monitoring
 * Production-ready logging system
 */

/**
 * Log Levels
 */
const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

/**
 * Logger Class
 */
class Logger {
  constructor(serviceName = 'App', minLevel = LogLevels.INFO) {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
    this.logs = [];
    this.maxLogs = 1000;
  }

  /**
   * Format log message
   */
  _formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevels).find(
      key => LogLevels[key] === level
    );

    return {
      timestamp,
      level: levelName,
      service: this.serviceName,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    };
  }

  /**
   * Store log
   */
  _storeLog(logEntry) {
    this.logs.push(logEntry);
    
    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Send to server in production
    if (process.env.VITE_ENV === 'PRODUCTION' && logEntry.level === 'ERROR') {
      this._sendToServer(logEntry);
    }
  }

  /**
   * Send log to server
   */
  _sendToServer(logEntry) {
    if (typeof fetch !== 'undefined') {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      }).catch(err => {
        console.error('Failed to send log to server:', err);
      });
    }
  }

  /**
   * Console output with styling
   */
  _consoleOutput(level, logEntry) {
    if (this.minLevel > level) return;

    const styles = {
      DEBUG: 'color: #00BFFF; font-weight: bold',
      INFO: 'color: #32CD32; font-weight: bold',
      WARN: 'color: #FFD700; font-weight: bold',
      ERROR: 'color: #FF0000; font-weight: bold',
      CRITICAL: 'color: #FF00FF; font-weight: bold; background: #FFE4E1',
    };

    const style = styles[logEntry.level] || 'color: black';
    console.log(
      `%c[${logEntry.service}] ${logEntry.timestamp} ${logEntry.level}`,
      style,
      logEntry.message,
      logEntry.data
    );
  }

  /**
   * Debug logging
   */
  debug(message, data) {
    const logEntry = this._formatMessage(LogLevels.DEBUG, message, data);
    this._storeLog(logEntry);
    this._consoleOutput(LogLevels.DEBUG, logEntry);
  }

  /**
   * Info logging
   */
  info(message, data) {
    const logEntry = this._formatMessage(LogLevels.INFO, message, data);
    this._storeLog(logEntry);
    this._consoleOutput(LogLevels.INFO, logEntry);
  }

  /**
   * Warning logging
   */
  warn(message, data) {
    const logEntry = this._formatMessage(LogLevels.WARN, message, data);
    this._storeLog(logEntry);
    this._consoleOutput(LogLevels.WARN, logEntry);
  }

  /**
   * Error logging
   */
  error(message, error = {}, data = {}) {
    const errorData = {
      ...data,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code,
    };
    const logEntry = this._formatMessage(LogLevels.ERROR, message, errorData);
    this._storeLog(logEntry);
    this._consoleOutput(LogLevels.ERROR, logEntry);
  }

  /**
   * Critical logging
   */
  critical(message, error = {}, data = {}) {
    const errorData = {
      ...data,
      errorMessage: error.message,
      errorStack: error.stack,
    };
    const logEntry = this._formatMessage(LogLevels.CRITICAL, message, errorData);
    this._storeLog(logEntry);
    this._consoleOutput(LogLevels.CRITICAL, logEntry);
    this._sendToServer(logEntry);
  }

  /**
   * Get all logs
   */
  getLogs(filter = {}) {
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.service && log.service !== filter.service) return false;
      return true;
    });
  }

  /**
   * Export logs
   */
  exportLogs(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'service', 'message'];
      const rows = this.logs.map(log =>
        `"${log.timestamp}","${log.level}","${log.service}","${log.message}"`
      );
      return [headers.join(','), ...rows].join('\n');
    }
    return '';
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }
}

/**
 * Performance Logger
 */
class PerformanceLogger {
  constructor() {
    this.timers = {};
    this.metrics = {};
  }

  /**
   * Start timer
   */
  startTimer(label) {
    this.timers[label] = performance.now();
  }

  /**
   * End timer and log
   */
  endTimer(label, logger = null) {
    if (!this.timers[label]) {
      console.warn(`Timer "${label}" not found`);
      return;
    }

    const duration = performance.now() - this.timers[label];
    this.metrics[label] = duration;

    if (logger) {
      logger.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    }

    delete this.timers[label];
    return duration;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return this.metrics;
  }
}

/**
 * API Request Logger
 */
class APILogger {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Log API request
   */
  logRequest(method, url, config = {}) {
    this.logger.debug('API Request', {
      method,
      url,
      headers: config.headers,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log API response
   */
  logResponse(method, url, status, duration) {
    const level = status >= 200 && status < 300 ? 'info' : 'warn';
    this.logger[level]('API Response', {
      method,
      url,
      status,
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  /**
   * Log API error
   */
  logError(method, url, error) {
    this.logger.error('API Error', error, {
      method,
      url,
      message: error.message,
    });
  }
}

/**
 * User Activity Tracker
 */
class ActivityTracker {
  constructor(logger) {
    this.logger = logger;
    this.activities = [];
  }

  /**
   * Track page view
   */
  trackPageView(pageName, pageData = {}) {
    const activity = {
      type: 'pageView',
      pageName,
      timestamp: new Date().toISOString(),
      ...pageData,
    };
    this.activities.push(activity);
    this.logger.info('Page View', { pageName });
  }

  /**
   * Track user action
   */
  trackAction(actionName, actionData = {}) {
    const activity = {
      type: 'userAction',
      actionName,
      timestamp: new Date().toISOString(),
      ...actionData,
    };
    this.activities.push(activity);
    this.logger.debug('User Action', { actionName });
  }

  /**
   * Track event
   */
  trackEvent(eventName, eventData = {}) {
    const activity = {
      type: 'event',
      eventName,
      timestamp: new Date().toISOString(),
      ...eventData,
    };
    this.activities.push(activity);
    this.logger.info('Event Tracked', { eventName });
  }

  /**
   * Get activities
   */
  getActivities(filter = {}) {
    return this.activities.filter(activity => {
      if (filter.type && activity.type !== filter.type) return false;
      if (filter.name) {
        const name = activity.pageName || activity.actionName || activity.eventName;
        if (name !== filter.name) return false;
      }
      return true;
    });
  }
}

// Create singleton instances
const logger = new Logger('Xynema', LogLevels.INFO);
const performanceLogger = new PerformanceLogger();
const apiLogger = new APILogger(logger);
const activityTracker = new ActivityTracker(logger);

export {
  Logger,
  PerformanceLogger,
  APILogger,
  ActivityTracker,
  logger,
  performanceLogger,
  apiLogger,
  activityTracker,
  LogLevels,
};

export default {
  logger,
  performanceLogger,
  apiLogger,
  activityTracker,
};
