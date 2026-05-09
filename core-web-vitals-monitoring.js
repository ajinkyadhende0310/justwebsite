/**
 * Core Web Vitals Monitoring Setup
 * Dhende Associates | Performance Tracking Dashboard
 * 
 * This script measures and sends Core Web Vitals metrics to Google Analytics
 * Metrics tracked:
 * - Largest Contentful Paint (LCP)
 * - First Input Delay (FID) / Interaction to Next Paint (INP)
 * - Cumulative Layout Shift (CLS)
 * - First Contentful Paint (FCP)
 * - Time to First Byte (TTFB)
 */

// Import Web Vitals library
import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } from 'https://cdn.jsdelivr.net/npm/web-vitals@4/+esm';

/**
 * Configuration
 */
const CONFIG = {
  enableConsoleLogging: true,
  enableGoogleAnalytics: true,
  enableLocalStorage: true,
  thresholds: {
    LCP: 2500,    // Good: < 2.5s, Needs improvement: > 4s
    FID: 100,     // Good: < 100ms, Needs improvement: > 300ms
    INP: 200,     // Good: < 200ms, Needs improvement: > 500ms
    CLS: 0.1,     // Good: < 0.1, Needs improvement: > 0.25
    FCP: 1800,    // Good: < 1.8s, Needs improvement: > 3s
    TTFB: 600     // Good: < 600ms, Needs improvement: > 1.8s
  }
};

/**
 * Storage for metrics
 */
const metrics = {};

/**
 * Determine if metric is "Good", "Needs Improvement", or "Poor"
 */
function getRating(metricName, value) {
  const threshold = CONFIG.thresholds[metricName];
  
  if (metricName === 'CLS') {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }
  
  if (threshold === undefined) return 'unknown';
  
  const poorThreshold = threshold * 1.5;
  if (value <= threshold) return 'good';
  if (value <= poorThreshold) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to Google Analytics
 */
function sendToGoogleAnalytics(metricName, value, rating) {
  if (!CONFIG.enableGoogleAnalytics || typeof gtag === 'undefined') {
    return;
  }
  
  gtag('event', metricName, {
    'value': Math.round(value),
    'event_category': 'web_vitals',
    'event_label': rating,
    'metric_value': Math.round(value),
    'metric_rating': rating,
    'page_path': window.location.pathname,
    'page_title': document.title
  });
}

/**
 * Store metric in localStorage for dashboard
 */
function storeMetricLocally(metricName, value, rating) {
  if (!CONFIG.enableLocalStorage) return;
  
  try {
    const key = `core_web_vitals_${metricName}`;
    const storedData = localStorage.getItem(key);
    const data = storedData ? JSON.parse(storedData) : [];
    
    data.push({
      timestamp: new Date().toISOString(),
      value: Math.round(value),
      rating: rating,
      device: getDeviceType(),
      connection: getConnectionType()
    });
    
    // Keep last 50 entries
    if (data.length > 50) {
      data.shift();
    }
    
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('[Core Web Vitals] Failed to store metric:', error);
  }
}

/**
 * Handle metric collection
 */
function handleMetric(metricName, callback) {
  return (metric) => {
    const value = metric.value || 0;
    const rating = getRating(metricName, value);
    
    metrics[metricName] = {
      value,
      rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: new Date().toISOString(),
      device: getDeviceType(),
      connection: getConnectionType(),
      url: window.location.href
    };
    
    if (CONFIG.enableConsoleLogging) {
      console.log(`[Core Web Vitals] ${metricName}: ${Math.round(value)}ms (${rating})`);
    }
    
    // Send to analytics
    sendToGoogleAnalytics(metricName, value, rating);
    
    // Store locally
    storeMetricLocally(metricName, value, rating);
    
    // Custom callback
    if (callback) {
      callback(metric, rating);
    }
  };
}

/**
 * Get device type
 */
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

/**
 * Get connection type
 */
function getConnectionType() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return 'unknown';
  return connection.effectiveType || 'unknown';
}

/**
 * Initialize Core Web Vitals Monitoring
 */
function initCoreWebVitalsMonitoring() {
  console.log('[Core Web Vitals] Initializing monitoring...');
  
  // Largest Contentful Paint
  getLCP(handleMetric('LCP', (metric, rating) => {
    console.log(`LCP (Largest Contentful Paint): ${Math.round(metric.value)}ms - ${rating}`);
  }));
  
  // First Input Delay / Interaction to Next Paint
  getINP(handleMetric('INP', (metric, rating) => {
    console.log(`INP (Interaction to Next Paint): ${Math.round(metric.value)}ms - ${rating}`);
  }));
  
  // Cumulative Layout Shift
  getCLS(handleMetric('CLS', (metric, rating) => {
    console.log(`CLS (Cumulative Layout Shift): ${metric.value.toFixed(3)} - ${rating}`);
  }));
  
  // First Contentful Paint
  getFCP(handleMetric('FCP', (metric, rating) => {
    console.log(`FCP (First Contentful Paint): ${Math.round(metric.value)}ms - ${rating}`);
  }));
  
  // Time to First Byte
  getTTFB(handleMetric('TTFB', (metric, rating) => {
    console.log(`TTFB (Time to First Byte): ${Math.round(metric.value)}ms - ${rating}`);
  }));
}

/**
 * Get metrics summary
 */
function getMetricsSummary() {
  const summary = {};
  
  for (const [name, data] of Object.entries(metrics)) {
    summary[name] = {
      value: data.value,
      rating: data.rating,
      threshold: CONFIG.thresholds[name]
    };
  }
  
  return summary;
}

/**
 * Log performance data
 */
function logPerformanceData() {
  const summary = getMetricsSummary();
  const overallRating = calculateOverallRating(summary);
  
  console.group('[Performance Summary]');
  console.table(summary);
  console.log('Overall Rating:', overallRating);
  console.log('Device Type:', getDeviceType());
  console.log('Connection:', getConnectionType());
  console.log('Navigation Timing:', {
    dns: performance.timing.domainLookupEnd - performance.timing.domainLookupStart,
    tcp: performance.timing.connectEnd - performance.timing.connectStart,
    ttfb: performance.timing.responseStart - performance.timing.navigationStart,
    download: performance.timing.responseEnd - performance.timing.responseStart,
    domInteractive: performance.timing.domInteractive - performance.timing.navigationStart,
    domComplete: performance.timing.domComplete - performance.timing.navigationStart,
    pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
  });
  console.groupEnd();
}

/**
 * Calculate overall rating
 */
function calculateOverallRating(summary) {
  const ratings = Object.values(summary).map(m => m.rating);
  const goodCount = ratings.filter(r => r === 'good').length;
  const totalCount = ratings.length;
  
  if (goodCount === totalCount) return 'excellent';
  if (goodCount >= totalCount * 0.75) return 'good';
  if (goodCount >= totalCount * 0.5) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metrics batch to server
 */
function sendMetricsBatch(endpoint = '/api/metrics') {
  const payload = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    device: getDeviceType(),
    connection: getConnectionType(),
    metrics: metrics,
    userAgent: navigator.userAgent
  };
  
  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
  } else {
    // Fallback to fetch
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true
    }).catch(error => {
      console.warn('[Core Web Vitals] Failed to send metrics:', error);
    });
  }
}

/**
 * Export functions
 */
window.CoreWebVitals = {
  init: initCoreWebVitalsMonitoring,
  getMetrics: () => metrics,
  getSummary: getMetricsSummary,
  log: logPerformanceData,
  sendBatch: sendMetricsBatch,
  config: CONFIG
};

/**
 * Auto-initialize on DOM ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initCoreWebVitalsMonitoring();
  });
} else {
  initCoreWebVitalsMonitoring();
}

/**
 * Send metrics before page unload
 */
window.addEventListener('beforeunload', () => {
  logPerformanceData();
  sendMetricsBatch();
});

console.log('[Core Web Vitals] Monitoring initialized and ready');
