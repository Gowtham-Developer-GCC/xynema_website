/**
 * Performance Monitoring & Optimization
 * Enterprise-grade performance tracking
 */

/**
 * Performance Metrics Collector
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.marks = {};
  }

  /**
   * Start measuring performance
   */
  start(label) {
    performance.mark(`${label}-start`);
    this.marks[label] = Date.now();
  }

  /**
   * End measuring and record duration
   */
  end(label) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    this.metrics[label] = measure?.duration || 0;
    
    return this.metrics[label];
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Report metrics to analytics
   */
  reportMetrics() {
    const webVitals = {
      navigationTiming: this._getNavigationTiming(),
      resourceTiming: this._getResourceTiming(),
      customMetrics: this.metrics,
    };

    // Send to analytics service
    if (window.gtag) {
      Object.entries(webVitals.customMetrics).forEach(([label, duration]) => {
        window.gtag('event', 'performance', {
          metric_name: label,
          metric_value: duration,
          metric_unit: 'ms',
        });
      });
    }

    return webVitals;
  }

  /**
   * Get Navigation Timing
   */
  _getNavigationTiming() {
    const perfData = performance.timing;
    return {
      dnsTime: perfData.domainLookupEnd - perfData.domainLookupStart,
      tcpTime: perfData.connectEnd - perfData.connectStart,
      requestTime: perfData.responseStart - perfData.requestStart,
      responseTime: perfData.responseEnd - perfData.responseStart,
      renderTime: perfData.domComplete - perfData.domLoading,
      totalTime: perfData.loadEventEnd - perfData.navigationStart,
    };
  }

  /**
   * Get Resource Timing
   */
  _getResourceTiming() {
    return performance
      .getEntriesByType('resource')
      .map(entry => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
      }));
  }
}

/**
 * Web Vitals Collection
 */
export const collectWebVitals = () => {
  const vitals = {};

  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.error('LCP observer error:', e);
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        vitals.FID = entries[0].processingDuration;
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.error('FID observer error:', e);
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            vitals.CLS = (vitals.CLS || 0) + entry.value;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.error('CLS observer error:', e);
    }
  }

  return vitals;
};

/**
 * Memory Usage Monitor
 */
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      utilization: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%',
    };
  }
  return null;
};

/**
 * Network Information
 */
export const getNetworkInfo = () => {
  if (navigator.connection) {
    return {
      type: navigator.connection.type,
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink + ' Mbps',
      rtt: navigator.connection.rtt + ' ms',
      saveData: navigator.connection.saveData,
    };
  }
  return null;
};

/**
 * Cache Strategy Configuration
 */
export const cacheStrategy = {
  // Cache-first: Check cache first, fallback to network
  cacheFirst: {
    cacheName: 'cache-first-v1',
    expirationTime: 86400000, // 24 hours
    files: ['*.woff2', '*.woff', '*.png', '*.svg'],
  },

  // Network-first: Check network first, fallback to cache
  networkFirst: {
    cacheName: 'network-first-v1',
    expirationTime: 604800000, // 7 days
    files: ['*.html', '/api/*'],
  },

  // Stale-while-revalidate: Return cache, update in background
  staleWhileRevalidate: {
    cacheName: 'stale-while-revalidate-v1',
    expirationTime: 2592000000, // 30 days
    files: ['*.js', '*.css'],
  },
};

/**
 * Image Optimization
 */
export const optimizeImage = (url, options = {}) => {
  const { width = 1200, height = 630, quality = 80, format = 'webp' } = options;

  // Use image optimization service (e.g., Cloudinary, Imgix)
  const params = new URLSearchParams({
    w: width,
    h: height,
    q: quality,
    f: format,
    auto: 'format',
  });

  return `${url}?${params}`;
};

/**
 * Code Lazy Loading Helper
 */
export const lazyLoadComponent = async (componentPath) => {
  try {
    const component = await import(/* @vite-ignore */ componentPath);
    return component.default;
  } catch (error) {
    console.error(`Failed to lazy load component: ${componentPath}`, error);
    return null;
  }
};

/**
 * Analytics Event Tracking
 */
export class AnalyticsTracker {
  static trackEvent(eventName, eventData = {}) {
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }
    if (window.mixpanel) {
      window.mixpanel.track(eventName, eventData);
    }
  }

  static trackPageView(pageName, pageData = {}) {
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: pageName,
        ...pageData,
      });
    }
  }

  static trackException(error, fatal = false) {
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal,
      });
    }
    console.error('Exception tracked:', error);
  }

  static trackTiming(timingName, timingValue, timingCategory = 'performance') {
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: timingName,
        value: timingValue,
        event_category: timingCategory,
      });
    }
  }
}

/**
 * Error Tracking & Reporting
 */
export class ErrorTracker {
  static init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error);
    });

    // Unhandled Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason);
    });
  }

  static captureError(error) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      memory: getMemoryUsage(),
      network: getNetworkInfo(),
    };

    // Send to error tracking service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }

    console.error('Error captured:', errorData);
  }

  static captureMessage(message, level = 'info') {
    const messageData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    if (window.Sentry) {
      window.Sentry.captureMessage(message, level);
    }

    console.log('Message captured:', messageData);
  }
}

export const performanceMonitor = new PerformanceMonitor();
export { PerformanceMonitor };

export default {
  PerformanceMonitor,
  performanceMonitor,
  collectWebVitals,
  getMemoryUsage,
  getNetworkInfo,
  optimizeImage,
  lazyLoadComponent,
  AnalyticsTracker,
  ErrorTracker,
};
