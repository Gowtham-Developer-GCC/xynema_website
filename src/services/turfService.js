import api, { safeApiCall } from './api';
import { ENDPOINTS } from './endpoints';
import { Turf } from '../models/index.js';

// Global Pagination Configuration for Turfs
export const TURF_PAGE_LIMIT = 6;

/**
 * Fetch list of available turfs based on city and other filters
 * @param {Object} params - Query parameters (city, search, tags)
 * @returns {Promise<Turf[]>}
 */
export const getAvailableTurfs = async (params = {}) => {
    const targetCity = params.city || localStorage.getItem('selected_city') || 'kochi';

    return safeApiCall(async () => {
        try {
            const response = await api.get(ENDPOINTS.TURFS.AVAILABLE, {
                params: { ...params, city: targetCity }
            });
            let body = response.data;

            // Handle potential array response
            if (Array.isArray(body)) {
                body = body[0] || {};
            }

            if (body.success && body.data) {
                const isArray = Array.isArray(body.data);
                const turfsRaw = isArray ? body.data : (body.data.turfs || []);
                const turfs = Array.isArray(turfsRaw) ? turfsRaw.map(t => new Turf(t)) : [];

                // Normalize pagination — harvest from root sibling (body.pagination) or nested (body.data.pagination)
                const rawPagination = body.pagination || (!isArray && body.data?.pagination ? body.data.pagination : null);
                
                let pagination;
                if (rawPagination) {
                    const p = rawPagination;
                    pagination = {
                        page:       p.currentPage   ?? p.page  ?? 1,
                        totalPages: p.totalPages     ?? 1,
                        total:      p.totalItems     ?? p.total ?? turfs.length,
                        limit:      p.itemsPerPage   ?? p.limit ?? TURF_PAGE_LIMIT,
                        hasNextPage: p.hasNextPage   ?? false,
                    };
                } else {
                    const limit = params.limit || TURF_PAGE_LIMIT;
                    const hasNext = turfs.length >= limit;
                    pagination = {
                        page: params.page || 1,
                        totalPages: hasNext ? 9999 : (params.page || 1),
                        total: hasNext ? 9999 : (params.page || 1) * turfs.length,
                        limit,
                        hasNextPage: hasNext,
                    };
                }

                return { turfs, pagination };
            }
            return { turfs: [], pagination: { page: 1, total: 0, hasNextPage: false } };
        } catch (error) {
            console.error('Error fetching available turfs:', error);
            return { turfs: [], pagination: { total: 0, page: 1 } };
        }
    });
};

/**
 * Fetch detailed information for a specific turf
 * @param {string} turfId
 * @returns {Promise<Turf|null>}
 */
export const getTurfDetails = async (turfId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.TURFS.DETAILS(turfId));
        let body = response.data;

        // Handle array response if backend wraps it
        if (Array.isArray(body)) {
            body = body[0] || {};
        }

        if (body.success && body.data) {
            return new Turf(body.data);
        }
        return null;
    });
};

/**
 * Fetch available slots for a specific court on a given date
 * @param {string} courtId
 * @param {string} date - Format YYYY-MM-DD
 * @returns {Promise<Object[]>}
 */
export const getAvailableSlots = async (courtId, date) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.TURFS.SLOTS(courtId), {
            params: { date }
        });
        const body = response.data;

        if (body.success && body.data) {
            return body.data.slots || [];
        }
        return [];
    });
};
/**
 * Reserve specific slots for a turf booking
 * @param {string[]} slotIds - Array of slot IDs to reserve
 * @param {string} sport - Type of sport (e.g., "football", "cricket")
 * @returns {Promise<Object|null>}
 */
export const reserveSlots = async (slotIds, sport) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.TURFS.RESERVE, {
            slotIds,
            sport: sport.toLowerCase()
        });
        const body = response.data;

        if (body.success) {
            return body.data;
        }
        return null;
    });
};
/**
 * Confirm a turf booking after payment
 * @param {Object} bookingData - Payload containing slotIds, paymentMethod, transactionId, and notes
 * @returns {Promise<Object|null>}
 */
export const confirmTurfBooking = async (bookingData) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.TURFS.CONFIRM, bookingData);
        if (response.data?.success) {
            return response.data.data;
        }
        return null;
    });
};

/**
 * Create a payment order for turf booking
 * @param {string[]} slotIds - Array of slot IDs
 * @returns {Promise<Object|null>}
 */
export const createTurfOrder = async (slotIds) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.TURFS.CREATE_ORDER, { slotIds });
        if (response.data?.success) {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to create turf order');
    });
};

/**
 * Cancel a turf reservation and release the slots
 * @param {string[]} slotIds - Array of slot IDs to release
 * @returns {Promise<Object|null>}
 */
export const cancelTurfReservation = async (slotIds) => {
    return safeApiCall(async () => {
        const response = await api.delete(ENDPOINTS.TURFS.CANCEL, {
            data: { slotIds }
        });
        if (response.data?.success) {
            return response.data;
        }
        return null;
    });
};

/**
 * Get the current user's turf bookings
 * @returns {Promise<Object[]>}
 */
export const getMyTurfBookings = async () => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.TURFS.MY_BOOKINGS);
        if (response.data?.success) {
            return response.data.data || [];
        }
        return [];
    });
};

/**
 * Get details for a specific turf booking
 * @param {string} bookingId 
 * @returns {Promise<Object>}
 */
export const getTurfBookingDetails = async (bookingId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.TURFS.BOOKING_DETAILS(bookingId));
        const body = response.data;
        if (body.success) {
            return body.data;
        }
        // Fallback for cases where the object is returned directly
        if (body._id || body.id) {
            return body;
        }
        return null;
    });
};
/**
 * Get similar turfs for a specific turf
 * @param {string} turfId 
 * @returns {Promise<Turf[]>}
 */
export const getSimilarTurfs = async (turfId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.TURFS.SIMILAR(turfId));
        const body = response.data;
        if (body.success && body.data) {
            return (body.data.turfs || body.data).map(t => new Turf(t));
        }
        return [];
    });
};

/**
 * Toggle interest for a specific turf
 * @param {string} turfId 
 * @returns {Promise<Object>}
 */
export const toggleTurfInterest = async (turfId, interested) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.TURFS.INTEREST(turfId), { interested });
        return response.data;
    }, 'toggle turf interest');
};
