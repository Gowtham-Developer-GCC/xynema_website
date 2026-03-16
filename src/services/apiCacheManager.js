/**
 * API Cache Manager - Production-ready cache with deduplication and TTL
 * 
 * Features:
 * - Request deduplication (prevents duplicate API calls in-flight)
 * - TTL-based cache expiration (auto-refresh of stale data)
 * - Memory-safe with LRU eviction (no memory bloat)
 * - Exception-safe (errors don't corrupt cache state)
 * - Comprehensive error handling and logging
 * - Production metrics and debug stats
 */

class ApiCacheManager {
    static instance = new ApiCacheManager();

    // Development mode check for logging
    isDevelopment = import.meta.env.DEV;

    // Cache storage: key -> { value, expiry }
    cache = {};

    // In-flight requests: key -> Promise (prevents duplicate requests)
    inFlightRequests = {};

    // LRU tracking for memory management
    accessOrder = [];

    // Max cache entries before LRU eviction
    static MAX_ENTRIES = 500;

    // TTL constants (in seconds) - tuned for production
    static PROFILE_TTL = 300;        // 5 minutes - user profile data
    static BOOKINGS_TTL = 180;       // 3 minutes - bookings change frequently
    static MOVIES_TTL = 1800;        // 30 minutes - movie lists are stable
    static THEATERS_TTL = 3600;      // 1 hour - theater data rarely changes
    static CITIES_TTL = 7200;        // 2 hours - cities don't change
    static EVENTS_TTL = 1800;        // 30 minutes - event data
    static FOOD_TTL = 1800;          // 30 minutes - food items

    /**
     * Production-ready get-or-execute with full error handling
     * 
     * Behavior:
     * 1. If in-flight request exists and cache is valid → return same Promise
     * 2. If cache is valid → return cached value immediately
     * 3. Otherwise → execute function, cache result, return value
     * 
     * Exceptions in executeFn are propagated (not swallowed)
     */
    async getOrExecute(key, executeFn, ttlSeconds) {
        try {
            // 1. Scenario: Valid cached value exists (Cache Hit)
            if (this.isValid(key)) {
                this.updateAccessOrder(key);
                console.log(`[Cache] Hit (TTL valid): ${key}`);
                return this.cache[key].value;
            }

            // 2. Scenario: Request already in-flight (Deduplication)
            // This is critical for preventing duplicate calls on initial load
            if (this.inFlightRequests[key]) {
                if (this.isDevelopment) console.log(`[Cache] Reusing in-flight request: ${key}`);
                try {
                    return await this.inFlightRequests[key];
                } catch (error) {
                    // If in-flight request fails, clear it and fall through to fresh attempt
                    if (this.isDevelopment) console.warn(`[Cache] In-flight request failed: ${key}, will attempt fresh fetch`);
                    delete this.inFlightRequests[key];
                }
            }

            // 3. Scenario: Cache miss and no in-flight request - execute fresh
            if (this.isDevelopment) console.log(`[Cache] Miss: ${key} - Executing API call`);

            try {
                const promise = executeFn();
                this.inFlightRequests[key] = promise;

                const result = await promise;

                // Cache successful result
                this.set(key, result, ttlSeconds);

                // Cleanup in-flight after success
                delete this.inFlightRequests[key];

                return result;
            } catch (error) {
                // Clear in-flight on error to allow retry next time
                delete this.inFlightRequests[key];
                console.error(`[Cache] API call failed: ${key} - ${error.message}`);
                throw error; // Propagate exception
            }
        } catch (error) {
            console.error(`[Cache] getOrExecute error for ${key}:`, error);
            throw error;
        }
    }

    /**
     * Set cache value with TTL and memory management
     */
    set(key, value, ttlSeconds = 300) {
        try {
            const expiryTime = Date.now() + (ttlSeconds * 1000);
            this.cache[key] = {
                value,
                expiry: expiryTime,
                createdAt: Date.now()
            };

            this.updateAccessOrder(key);
            this.evictIfNeeded();

            if (this.isDevelopment) console.log(`[Cache] Set: ${key} (TTL: ${ttlSeconds}s)`);
        } catch (error) {
            console.error(`[Cache] Error setting cache for ${key}:`, error);
        }
    }

    /**
     * Check if cached value is still valid (TTL check)
     */
    isValid(key) {
        try {
            if (!this.cache[key]) {
                return false;
            }

            const { expiry } = this.cache[key];
            const isValid = Date.now() < expiry;

            if (!isValid) {
                delete this.cache[key];
                const idx = this.accessOrder.indexOf(key);
                if (idx > -1) this.accessOrder.splice(idx, 1);
            }

            return isValid;
        } catch (error) {
            console.error(`[Cache] Error validating ${key}:`, error);
            delete this.cache[key];
            return false;
        }
    }

    /**
     * Update LRU access order
     */
    updateAccessOrder(key) {
        const idx = this.accessOrder.indexOf(key);
        if (idx > -1) {
            this.accessOrder.splice(idx, 1);
        }
        this.accessOrder.push(key);
    }

    /**
     * Evict oldest entry if cache exceeds max size
     */
    evictIfNeeded() {
        try {
            if (Object.keys(this.cache).length > ApiCacheManager.MAX_ENTRIES) {
                if (this.accessOrder.length > 0) {
                    const oldestKey = this.accessOrder.shift();
                    delete this.cache[oldestKey];
                    console.info(`[Cache] Evicted oldest entry: ${oldestKey}`);
                }
            }
        } catch (error) {
            console.error('[Cache] Error during eviction:', error);
        }
    }

    /**
     * Invalidate specific cache entry (production-safe)
     */
    invalidate(key) {
        try {
            if (this.cache[key]) {
                delete this.cache[key];
            }

            // Don't remove in-flight request - let it complete naturally
            // This prevents race conditions with pending calls

            const idx = this.accessOrder.indexOf(key);
            if (idx > -1) this.accessOrder.splice(idx, 1);

            console.log(`[Cache] Invalidated: ${key}`);
        } catch (error) {
            console.error(`[Cache] Error invalidating ${key}:`, error);
        }
    }

    /**
     * Invalidate multiple cache entries by pattern (production-safe)
     */
    invalidatePattern(pattern) {
        try {
            const keysToRemove = Object.keys(this.cache).filter(key =>
                key.includes(pattern)
            );

            keysToRemove.forEach(key => {
                delete this.cache[key];
                const idx = this.accessOrder.indexOf(key);
                if (idx > -1) this.accessOrder.splice(idx, 1);
            });

            console.log(`[Cache] Invalidated pattern: ${pattern} (${keysToRemove.length} entries)`);
        } catch (error) {
            console.error(`[Cache] Error invalidating pattern ${pattern}:`, error);
        }
    }

    /**
     * Clear all cache safely (use on logout)
     */
    clearAll() {
        try {
            this.cache = {};
            this.inFlightRequests = {};
            this.accessOrder = [];
            console.log('[Cache] Cleared all cache');
        } catch (error) {
            console.error('[Cache] Error clearing cache:', error);
        }
    }

    /**
     * Get detailed cache statistics (debug/monitoring)
     */
    getStats() {
        try {
            const validEntries = Object.keys(this.cache).filter(key =>
                this.isValid(key)
            ).length;

            const expiredEntries = Object.keys(this.cache).length - validEntries;

            return {
                total_entries: Object.keys(this.cache).length,
                valid_entries: validEntries,
                expired_entries: expiredEntries,
                in_flight_requests: Object.keys(this.inFlightRequests).length,
                max_entries: ApiCacheManager.MAX_ENTRIES,
                keys: Object.keys(this.cache),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[Cache] Error getting stats:', error);
            return { error: error.message };
        }
    }

    // ============= Production Helper Methods =============

    /**
     * Helper: Get or fetch user profile
     */
    async getOrFetchProfile(fetchFn) {
        return this.getOrExecute('user_profile', fetchFn, ApiCacheManager.PROFILE_TTL);
    }

    /**
     * Helper: Get or fetch movie bookings
     */
    async getOrFetchMovieBookings(fetchFn) {
        return this.getOrExecute('bookings_movies', fetchFn, ApiCacheManager.BOOKINGS_TTL);
    }

    /**
     * Helper: Get or fetch event bookings
     */
    async getOrFetchEventBookings(fetchFn) {
        return this.getOrExecute('bookings_events', fetchFn, ApiCacheManager.BOOKINGS_TTL);
    }

    /**
     * Helper: Get or fetch movies
     */
    async getOrFetchMovies(city, fetchFn) {
        return this.getOrExecute(`movies_${city}`, fetchFn, ApiCacheManager.MOVIES_TTL);
    }

    /**
     * Helper: Get or fetch theaters
     */
    async getOrFetchTheaters(city, fetchFn) {
        return this.getOrExecute(`theaters_${city}`, fetchFn, ApiCacheManager.THEATERS_TTL);
    }

    /**
     * Helper: Get or fetch cities
     */
    async getOrFetchCities(fetchFn) {
        return this.getOrExecute('cities', fetchFn, ApiCacheManager.CITIES_TTL);
    }

    /**
     * Helper: Get or fetch events
     */
    async getOrFetchEvents(city, fetchFn) {
        return this.getOrExecute(`events_${city || 'all'}`, fetchFn, ApiCacheManager.EVENTS_TTL);
    }

    /**
     * Helper: Get or fetch food items
     */
    async getOrFetchFood(fetchFn) {
        return this.getOrExecute('food_items', fetchFn, ApiCacheManager.FOOD_TTL);
    }

    /**
     * Helper: Get or fetch upcoming movies
     */
    async getOrFetchUpcomingMovies(city, fetchFn) {
        return this.getOrExecute(`upcoming_movies_${city || 'global'}`, fetchFn, ApiCacheManager.MOVIES_TTL);
    }

    /**
     * Helper: Get or fetch theater details
     */
    async getOrFetchTheaterDetails(theaterId, date, fetchFn) {
        return this.getOrExecute(`theater_details_${theaterId}_${date}`, fetchFn, ApiCacheManager.THEATERS_TTL);
    }

    /**
     * Helper: Get or fetch similar movies
     */
    async getOrFetchSimilarMovies(movieId, fetchFn) {
        return this.getOrExecute(`similar_movies_${movieId}`, fetchFn, ApiCacheManager.MOVIES_TTL);
    }

    /**
     * Helper: Get or fetch movie merchandise
     */
    async getOrFetchMovieMerchandise(movieId, fetchFn) {
        return this.getOrExecute(`merchandise_${movieId}`, fetchFn, ApiCacheManager.FOOD_TTL);
    }

    /**
     * Helper: Get or fetch event details
     */
    async getOrFetchEventDetails(slug, fetchFn) {
        return this.getOrExecute(`event_details_${slug}`, fetchFn, ApiCacheManager.EVENTS_TTL);
    }

    /**
     * Helper: Get or fetch similar events
     */
    async getOrFetchSimilarEvents(eventId, fetchFn) {
        return this.getOrExecute(`similar_events_${eventId}`, fetchFn, ApiCacheManager.EVENTS_TTL);
    }
}

// Export singleton instance and class
export default ApiCacheManager.instance;
export { ApiCacheManager };

