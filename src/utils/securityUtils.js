import cardValidator from 'card-validator';
import validator from 'validator';

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return validator.escape(input).trim();
};

/**
 * Sanitize HTML content (for display purposes)
 */
export const sanitizeHTML = (html) => {
    if (typeof html !== 'string') return html;
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    return validator.isEmail(email, {
        allow_display_name: false,
        require_tld: true,
        allow_utf8_local_part: false
    });
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone) => {
    // Indian mobile: 10 digits starting with 6-9
    return validator.isMobilePhone(phone, 'en-IN');
};

/**
 * Validate card number using Luhn algorithm (industry-standard)
 */
export const isValidCardNumber = (cardNumber) => {
    const validation = cardValidator.number(cardNumber);
    return validation.isValid;
};

/**
 * Get card type (Visa, Mastercard, Amex, etc.)
 */
export const getCardType = (cardNumber) => {
    if (!cardNumber || cardNumber.length < 1) return '';
    
    const validation = cardValidator.number(cardNumber);
    
    // Return early if no card match yet (user still typing)
    if (!validation.card) return '';
    
    return validation.card.type || '';
};

/**
 * Get friendly card type name for display
 */
export const getCardTypeName = (cardNumber) => {
    const cardType = getCardType(cardNumber);
    
    const typeMap = {
        'visa': 'Visa',
        'mastercard': 'Mastercard',
        'american-express': 'Amex',
        'discover': 'Discover',
        'diners-club': 'Diners',
        'jcb': 'JCB',
        'unionpay': 'UnionPay',
        'maestro': 'Maestro',
        'elo': 'Elo',
        'mir': 'Mir',
        'hiper': 'Hiper',
        'hipercard': 'Hipercard'
    };
    
    return typeMap[cardType] || '';
};

/**
 * Validate CVV using card-validator
 */
export const isValidCVV = (cvv, cardNumber = '') => {
    // Get card type to determine CVV length
    const cardType = getCardType(cardNumber);
    const validation = cardValidator.cvv(cvv, cardType === 'american-express' ? 4 : 3);
    return validation.isValid;
};

/**
 * Validate card expiry using card-validator
 */
export const isValidExpiry = (expiry) => {
    const validation = cardValidator.expirationDate(expiry);
    return validation.isValid;
};

/**
 * Sanitize card holder name
 */
export const sanitizeCardName = (name) => {
    return cardValidator.cardholderName(name).isValid 
        ? name.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim().toUpperCase().substring(0, 50)
        : name.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim().toUpperCase().substring(0, 50);
};

/**
 * Mask card number for display
 */
export const maskCardNumber = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 4) return '****';
    return '**** **** **** ' + cleanNumber.slice(-4);
};

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
    return validator.isMongoId(id);
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query) => {
    if (typeof query !== 'string') return '';
    return validator.escape(query).trim().substring(0, 100);
};

/**
 * Validate URL
 */
export const isValidURL = (url) => {
    return validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true
    });
};

/**
 * Rate limiter for client-side API calls
 */
export class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    canMakeRequest(key) {
        const now = Date.now();
        const requestLog = this.requests.get(key) || [];
        
        // Remove old requests outside the window
        const recentRequests = requestLog.filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        if (recentRequests.length >= this.maxRequests) {
            return {
                allowed: false,
                retryAfter: Math.ceil((recentRequests[0] + this.windowMs - now) / 1000)
            };
        }
        
        recentRequests.push(now);
        this.requests.set(key, recentRequests);
        
        return { allowed: true };
    }

    reset(key) {
        this.requests.delete(key);
    }
}

/**
 * Secure random string generator
 */
export const generateSecureToken = (length = 32) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate booking data integrity
 */
export const validateBookingData = (bookingData) => {
    const errors = [];
    
    if (!bookingData.seatIds || !Array.isArray(bookingData.seatIds) || bookingData.seatIds.length === 0) {
        errors.push('Invalid seat selection');
    }
    
    if (!bookingData.sessionId || typeof bookingData.sessionId !== 'string') {
        errors.push('Invalid session');
    }
    
    if (!bookingData.paymentDetails || typeof bookingData.paymentDetails !== 'object') {
        errors.push('Invalid payment details');
    }
    
    // Validate seat IDs are ObjectIds
    if (bookingData.seatIds) {
        const invalidSeats = bookingData.seatIds.filter(id => !isValidObjectId(id));
        if (invalidSeats.length > 0) {
            errors.push('Invalid seat IDs detected');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Prevent timing attacks on sensitive comparisons
 */
export const secureCompare = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
};

/**
 * Content Security Policy headers (for reference)
 */
export const CSP_HEADERS = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: http:",
        "connect-src 'self' https://api.example.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ')
};

/**
 * Security headers for production
 */
export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

/**
 * Check if running in secure context (HTTPS)
 */
export const isSecureContext = () => {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
};

/**
 * Log security events (for audit trail)
 */
export const logSecurityEvent = (eventType, details) => {
    if (process.env.NODE_ENV === 'production') {
        // In production, send to backend logging service
        console.warn(`[SECURITY] ${eventType}:`, {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...details
        });
    } else {
        console.log(`[SECURITY] ${eventType}:`, details);
    }
};

export default {
    sanitizeInput,
    sanitizeHTML,
    isValidEmail,
    isValidPhone,
    isValidCardNumber,
    getCardType,
    getCardTypeName,
    isValidCVV,
    isValidExpiry,
    sanitizeCardName,
    maskCardNumber,
    isValidObjectId,
    sanitizeSearchQuery,
    isValidURL,
    RateLimiter,
    generateSecureToken,
    validateBookingData,
    secureCompare,
    isSecureContext,
    logSecurityEvent
};
