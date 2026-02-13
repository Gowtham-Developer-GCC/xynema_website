/**
 * Booking Session Manager - Security utilities for booking flow
 * 
 * Handles:
 * - Session validation with expiry timestamps
 * - Automatic cleanup on navigation
 * - Seat release on session end
 * - Security checks for URL manipulation
 * - CSRF-like token protection
 * - Rate limiting
 * - Integrity validation
 */

import * as api from '../services/api';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_BOOKING_ATTEMPTS = 5; // Max failed booking attempts
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes rate limit window

class BookingSessionManager {
    static instance = new BookingSessionManager();

    constructor() {
        this.bookingAttempts = [];
    }

    /**
     * Generate a secure session token (CSRF-like protection)
     */
    generateSessionToken(showId, userId) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const dataStr = `${showId}-${userId || 'guest'}-${timestamp}-${randomStr}`;
        
        // Simple hash (in production, use crypto.subtle.digest)
        let hash = 0;
        for (let i = 0; i < dataStr.length; i++) {
            const char = dataStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36) + randomStr;
    }

    /**
     * Initialize a new booking session with security token
     */
    startSession(showId, theaterName, userId = null) {
        const timestamp = Date.now();
        const sessionToken = this.generateSessionToken(showId, userId);
        
        sessionStorage.setItem('booking_show_id', showId);
        sessionStorage.setItem('booking_theater_name', theaterName);
        sessionStorage.setItem('booking_session_start', timestamp.toString());
        sessionStorage.setItem('booking_session_token', sessionToken);
        sessionStorage.setItem('booking_user_fingerprint', this.getUserFingerprint());
    }

    /**
     * Get user fingerprint for session validation
     */
    getUserFingerprint() {
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ].join('|');
        
        // Simple hash
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Validate if current session is still valid
     * Returns: { valid: boolean, reason?: string }
     */
    validateSession() {
        const showId = sessionStorage.getItem('booking_show_id');
        const theaterName = sessionStorage.getItem('booking_theater_name');
        const sessionStart = sessionStorage.getItem('booking_session_start');
        const sessionToken = sessionStorage.getItem('booking_session_token');
        const storedFingerprint = sessionStorage.getItem('booking_user_fingerprint');

        // Check if session data exists
        if (!showId || !theaterName) {
            return { valid: false, reason: 'missing_data' };
        }

        // Validate session token exists (CSRF-like protection)
        if (!sessionToken) {
            this.clearSession();
            return { valid: false, reason: 'missing_token' };
        }

        // Validate user fingerprint (prevent session hijacking)
        const currentFingerprint = this.getUserFingerprint();
        if (storedFingerprint && storedFingerprint !== currentFingerprint) {
            this.clearSession();
            return { valid: false, reason: 'fingerprint_mismatch' };
        }

        // Check if session has expired
        if (sessionStart) {
            const elapsed = Date.now() - parseInt(sessionStart);
            if (elapsed > SESSION_TIMEOUT) {
                this.clearSession();
                return { valid: false, reason: 'expired' };
            }
        }

        return { valid: true };
    }

    /**
     * Validate booking draft exists and has required data
     */
    validateBookingDraft(requiredFields = ['seats']) {
        const showId = sessionStorage.getItem('booking_show_id');
        if (!showId) {
            return { valid: false, reason: 'no_session' };
        }

        try {
            const draftData = sessionStorage.getItem(`booking_draft_${showId}`);
            if (!draftData) {
                return { valid: false, reason: 'no_draft' };
            }

            const draft = JSON.parse(draftData);

            // Check required fields
            for (const field of requiredFields) {
                if (!draft[field] || (Array.isArray(draft[field]) && draft[field].length === 0)) {
                    return { valid: false, reason: `missing_${field}` };
                }
            }

            return { valid: true, draft };
        } catch (error) {
            return { valid: false, reason: 'invalid_draft' };
        }
    }

    /**
     * Track booking attempt for rate limiting
     */
    trackBookingAttempt(success = false) {
        const now = Date.now();
        this.bookingAttempts.push({ timestamp: now, success });
        
        // Clean old attempts outside rate limit window
        this.bookingAttempts = this.bookingAttempts.filter(
            attempt => (now - attempt.timestamp) < RATE_LIMIT_WINDOW
        );
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem('booking_attempts', JSON.stringify(this.bookingAttempts));
    }

    /**
     * Check if user is rate limited
     */
    isRateLimited() {
        // Load attempts from sessionStorage
        try {
            const stored = sessionStorage.getItem('booking_attempts');
            if (stored) {
                this.bookingAttempts = JSON.parse(stored);
            }
        } catch (e) {
            this.bookingAttempts = [];
        }

        const now = Date.now();
        const recentAttempts = this.bookingAttempts.filter(
            attempt => (now - attempt.timestamp) < RATE_LIMIT_WINDOW
        );

        const failedAttempts = recentAttempts.filter(a => !a.success).length;
        
        if (failedAttempts >= MAX_BOOKING_ATTEMPTS) {
            return {
                limited: true,
                remainingTime: Math.ceil((RATE_LIMIT_WINDOW - (now - recentAttempts[0].timestamp)) / 1000 / 60),
                message: `Too many failed attempts. Please try again in ${Math.ceil((RATE_LIMIT_WINDOW - (now - recentAttempts[0].timestamp)) / 1000 / 60)} minutes.`
            };
        }

        return { limited: false };
    }

    /**
     * Get session token for API requests
     */
    getSessionToken() {
        return sessionStorage.getItem('booking_session_token');
    }

    /**
     * Clear entire booking session and release seats
     */
    async clearSession(releaseSeatIds = null) {
        const showId = sessionStorage.getItem('booking_show_id');

        // Release seats if provided or from draft
        if (showId) {
            let seatsToRelease = releaseSeatIds;

            if (!seatsToRelease) {
                try {
                    const draftData = sessionStorage.getItem(`booking_draft_${showId}`);
                    if (draftData) {
                        const draft = JSON.parse(draftData);
                        seatsToRelease = draft.seats;
                    }
                } catch (error) {
                    // Silent fail
                }
            }

            // Release seats on backend
            if (seatsToRelease && seatsToRelease.length > 0) {
                try {
                    await api.releaseSeats(showId, seatsToRelease);
                } catch (error) {
                    // Silent fail - backend will auto-release anyway
                }
            }

            // Clear all session data including security tokens
            sessionStorage.removeItem('booking_show_id');
            sessionStorage.removeItem('booking_theater_name');
            sessionStorage.removeItem('booking_session_start');
            sessionStorage.removeItem('booking_session_token');
            sessionStorage.removeItem('booking_user_fingerprint');
            sessionStorage.removeItem(`booking_draft_${showId}`);
            sessionStorage.removeItem('pending_seat_lock');
        }
    }

    /**
     * Update session timestamp (keep alive)
     */
    refreshSession() {
        if (sessionStorage.getItem('booking_show_id')) {
            sessionStorage.setItem('booking_session_start', Date.now().toString());
        }
    }

    /**
     * Get session info for debugging
     */
    getSessionInfo() {
        const showId = sessionStorage.getItem('booking_show_id');
        const theaterName = sessionStorage.getItem('booking_theater_name');
        const sessionStart = sessionStorage.getItem('booking_session_start');

        if (!showId) return null;

        const elapsed = sessionStart ? Date.now() - parseInt(sessionStart) : 0;
        const remaining = SESSION_TIMEOUT - elapsed;

        return {
            showId,
            theaterName,
            startTime: sessionStart ? new Date(parseInt(sessionStart)).toLocaleString() : null,
            elapsedMinutes: Math.floor(elapsed / 60000),
            remainingMinutes: Math.floor(remaining / 60000),
            isValid: remaining > 0,
        };
    }
}

// Export singleton instance
export default BookingSessionManager.instance;
export { BookingSessionManager };
