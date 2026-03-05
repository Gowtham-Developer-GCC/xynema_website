/**
 * Validation Utilities
 * Handle input validation, error checking, and data sanitization
 */

export const validators = {
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone number (basic 10-digit validation)
     */
    isValidPhone(phone) {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    },

    /**
     * Validate password strength
     */
    isStrongPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return strongRegex.test(password);
    },

    /**
     * Validate card number (Luhn algorithm)
     */
    isValidCardNumber(cardNumber) {
        const sanitized = cardNumber.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(sanitized)) return false;

        let sum = 0;
        let isEven = false;

        for (let i = sanitized.length - 1; i >= 0; i--) {
            let digit = parseInt(sanitized.charAt(i), 10);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    },

    /**
     * Validate CVV
     */
    isValidCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    },

    /**
     * Validate expiry date (MM/YY)
     */
    isValidExpiryDate(expiry) {
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

        const [month, year] = expiry.split('/').map(Number);
        if (month < 1 || month > 12) return false;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;

        return true;
    },

    /**
     * Validate date format (YYYY-MM-DD)
     */
    isValidDate(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) return false;

        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },

    /**
     * Check if date is in the future
     */
    isFutureDate(dateString) {
        const date = new Date(dateString);
        return date > new Date();
    },

    /**
     * Validate seat selection (not empty)
     */
    hasValidSeats(seats) {
        return Array.isArray(seats) && seats.length > 0;
    },

    /**
     * Validate booking amount
     */
    isValidAmount(amount) {
        return typeof amount === 'number' && amount > 0 && !isNaN(amount);
    },
};

/**
 * Utility Functions
 */
export const utils = {
    /**
     * Format date to readable string
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    },

    /**
     * Format date to time string
     */
    formatTime(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    },

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
        }).format(amount);
    },

    /**
     * Format phone number
     */
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10
            ? cleaned.replace(/(\d{5})(\d{5})/, '$1 $2')
            : phone;
    },

    /**
     * Debounce function
     */
    debounce(func, delay) {
        let timeoutId;
        return function debounced(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function throttled(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
        };
    },

    /**
     * Deep copy object
     */
    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    /**
     * Image Optimization
     * Safely handles internal and external URLs
     */
    optimizeImage(url, options = {}) {
        if (!url) return 'https://placehold.co/400x600/333/FFF?text=XY';

        // Skip optimization for external CDNs that might break with extra params
        if (url.includes('bmscdn.com') || url.includes('unsplash.com') || url.includes('cloudinary.com') || url.startsWith('http')) {
            return url;
        }

        const { width = 1200, height = 630, quality = 80, format = 'webp' } = options;
        const params = new URLSearchParams({
            w: width,
            h: height,
            q: quality,
            f: format,
            auto: 'format',
        });

        return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
    },

    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Safely parse JSON
     */
    safeJsonParse(jsonString, defaultValue = {}) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return defaultValue;
        }
    },

    /**
     * Calculate age from date of birth
     */
    calculateAge(dob) {
        const ageDiff = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(ageDiff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    },

    /**
     * Get days between two dates
     */
    daysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Convert seconds to HH:MM:SS format
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return [hours, minutes, secs]
            .map(val => String(val).padStart(2, '0'))
            .join(':');
    },

    /**
     * Truncate string with ellipsis
     */
    truncate(str, length = 50) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Sleep/delay function for async operations
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
};

export const optimizeImage = utils.optimizeImage;

/**
 * Error Handling Utilities
 */
export const errorHandler = {
    /**
     * Get user-friendly error message
     */
    getUserMessage(error) {
        if (typeof error === 'string') {
            return error;
        }

        if (error.response?.data?.message) {
            return error.response.data.message;
        }

        if (error.message) {
            return error.message;
        }

        return 'An unexpected error occurred. Please try again.';
    },

    /**
     * Get error status code
     */
    getStatusCode(error) {
        return error.response?.status || error.status || 500;
    },

    /**
     * Check if error is network error
     */
    isNetworkError(error) {
        return !error.response && error.request;
    },

    /**
     * Check if error is timeout
     */
    isTimeout(error) {
        return error.code === 'ECONNABORTED' || error.message === 'timeout';
    },

    /**
     * Log error for debugging/monitoring
     */
    logError(error, context = '') {
        console.error(`Error ${context}:`, {
            message: this.getUserMessage(error),
            status: this.getStatusCode(error),
            timestamp: new Date().toISOString(),
            url: error.config?.url,
            method: error.config?.method,
        });
    },
};
