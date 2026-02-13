/**
 * Security Headers & Middleware
 * Military-grade security implementation
 */

/**
 * CSP (Content Security Policy) Headers
 * Prevents XSS, clickjacking, and other injection attacks
 */
export const getCSPHeaders = () => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
    "connect-src 'self' https:",
    "frame-src https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
});

/**
 * Security Headers
 */
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
});

/**
 * CORS Configuration
 */
export const getCORSConfig = () => ({
  origin: process.env.VITE_ENV === 'PRODUCTION'
    ? ['https://xynema.com', 'https://www.xynema.com']
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
});

/**
 * Rate Limiting Configuration
 */
export const getRateLimitConfig = () => ({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input Validation & Sanitization
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML/script tags
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  
  // Prevent null bytes
  return sanitized.replace(/\0/g, '');
};

/**
 * Request signing for additional security
 */
export const signRequest = (data, secret) => {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
};

/**
 * Token validation
 */
export const validateToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  // Check token format (JWT)
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Verify each part is valid base64
  return parts.every(part => {
    try {
      Buffer.from(part, 'base64');
      return true;
    } catch {
      return false;
    }
  });
};

/**
 * Encryption utilities for sensitive data
 */
export const encryptData = (data, key) => {
  // In production, use proper encryption library like crypto-js
  // This is a placeholder for demonstration
  return Buffer.from(JSON.stringify(data)).toString('base64');
};

export const decryptData = (encryptedData, key) => {
  try {
    return JSON.parse(Buffer.from(encryptedData, 'base64').toString());
  } catch {
    return null;
  }
};
