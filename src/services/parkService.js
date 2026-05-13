import api, { safeApiCall } from './api';
import { ENDPOINTS } from './endpoints';
import { ActivityPark } from '../models/index.js';


// Global Pagination Configuration for Parks
export const PARK_PAGE_LIMIT = 6;

/**
 * Fetch all activity parks with filters
 * @param {Object} params - { city, search, parkType, page, limit }
 */
export const getAllParks = async (params = {}) => {
    return safeApiCall(async () => {
        try {
            const response = await api.get(ENDPOINTS.PARKS.LIST, { params });
            let body = response.data;

            // Handle potential array wrapper from backend
            if (Array.isArray(body)) {
                body = body[0] || {};
            }

            if (body.success && body.data) {
                const isArray = Array.isArray(body.data);
                const parksData = isArray ? body.data : (body.data.parks || []);
                const parks = parksData.map(p => new ActivityPark(p));

                // Normalize pagination
                const rawPagination = body.pagination || (!isArray && body.data?.pagination ? body.data.pagination : null);
                
                let pagination;
                if (rawPagination) {
                    const p = rawPagination;
                    pagination = {
                        page:       p.currentPage   ?? p.page  ?? 1,
                        totalPages: p.totalPages     ?? p.pages ?? 1,
                        total:      p.totalItems     ?? p.total ?? parks.length,
                        limit:      p.itemsPerPage   ?? p.limit ?? PARK_PAGE_LIMIT,
                        hasNextPage: (p.currentPage < p.totalPages) ?? (p.page < p.pages) ?? (p.page < p.totalPages) ?? false,
                    };
                } else {
                    const limit = params.limit || PARK_PAGE_LIMIT;
                    const hasNext = parks.length >= limit;
                    pagination = {
                        page: params.page || 1,
                        totalPages: hasNext ? 9999 : (params.page || 1),
                        total: hasNext ? 9999 : (params.page || 1) * parks.length,
                        limit,
                        hasNextPage: hasNext,
                    };
                }

                const availableParkTypes = body.availableParkTypes || (!isArray && body.data?.availableParkTypes ? body.data.availableParkTypes : []);
                
                return { parks, pagination, availableParkTypes };
            }
            return { parks: [], pagination: { page: 1, total: 0, hasNextPage: false }, availableParkTypes: [] };
        } catch (error) {
            console.error('Error fetching activity parks:', error);
            return { parks: [], pagination: { page: 1, total: 0, hasNextPage: false }, availableParkTypes: [] };
        }
    });
};

/**
 * Fetch a single park by slug or ID
 */
export const getParkBySlug = async (slug) => {
    return safeApiCall(async () => {
        try {
            // 1. Try to fetch specific details
            const response = await api.get(ENDPOINTS.PARKS.DETAILS(slug));
            const body = response.data;

            if (body.success && body.data) {
                return new ActivityPark(body.data);
            }
        } catch (error) {
            // If 404, the detail endpoint might not exist, try to find in list
            if (error.response?.status === 404) {
                console.warn('Park detail API not found, falling back to search in list...');
                const result = await getAllParks({ limit: PARK_PAGE_LIMIT }); // Try to get a large chunk
                const parks = result.parks || (Array.isArray(result) ? result : []);
                const found = parks.find(p => p.id === slug || p.slug === slug);
                if (found) return found;
            }
            console.error('Error fetching park details:', error);
        }
        return null;
    });
};

/**
 * Parks the user has "visited"
 */
export const getVisitedParks = async () => {
    // In a real app this would come from a dedicated endpoint or filtered bookings
    // For now we'll just return an empty array or handle it in the component
    return [];
};
/**
 * Fetch park availability and tickets for a specific date
 * @param {string} parkId 
 * @param {string} date - YYYY-MM-DD
 */
export const getParkAvailability = async (parkId, date) => {
    return safeApiCall(async () => {
        try {
            const response = await api.get(ENDPOINTS.PARKS.AVAILABILITY(parkId), {
                params: { date }
            });
            const body = response.data;

            if (body.success) {
                const result = body.data || {};
                result.success = body.success;
                result.message = body.message;
                if (body.bookingDayId) {
                    result.bookingDayId = body.bookingDayId;
                }
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error fetching park availability:', error);
            return null;
        }
    });
};

/**
 * Reserve tickets for a park
 * @param {Object} data - { parkId, scheduleId, bookingDayId, date, tickets: [{ ticketId, quantity }] }
 */
export const reserveParkTickets = async (data) => {
    return safeApiCall(async () => {
        try {
            const response = await api.post(ENDPOINTS.PARKS.RESERVE, data);
            if (response.data?.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Failed to reserve tickets');
        } catch (error) {
            console.error('Error reserving park tickets:', error);
            throw error;
        }
    });
};

/**
 * Cancel a park ticket reservation
 * @param {Object} data - { reservationId, bookingDayId, ticketIds: [] }
 */
export const cancelParkReservation = async (data) => {
    return safeApiCall(async () => {
        try {
            const response = await api.post(ENDPOINTS.PARKS.CANCEL_RESERVE, data);
            return response.data;
        } catch (error) {
            console.error('Error cancelling park reservation:', error);
            throw error;
        }
    });
};

/**
 * Create a payment order for a reserved park ticket
 * @param {string} reservationId 
 * @param {Object} data - { parkId, date, ticketIds: [], bookingDayId }
 */
export const createParkOrder = async (reservationId, data) => {
    return safeApiCall(async () => {
        try {
            const response = await api.post(ENDPOINTS.PARKS.CREATE_ORDER(reservationId), data);
            if (response.data?.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Failed to create order');
        } catch (error) {
            console.error('Error creating park order:', error);
            throw error;
        }
    });
};

/**
 * Confirm a park ticket booking after payment
 * @param {string} reservationId 
 * @param {Object} paymentData - Razorpay response and other details
 */
export const confirmParkBooking = async (reservationId, paymentData) => {
    return safeApiCall(async () => {
        try {
            const response = await api.post(ENDPOINTS.PARKS.CONFIRM(reservationId), paymentData);
            return response.data;
        } catch (error) {
            console.error('Error confirming park booking:', error);
            throw error;
        }
    });
};

/**
 * Fetch details of a specific park booking
 * @param {string} bookingId 
 */
export const getParkBookingDetails = async (bookingId) => {
    return safeApiCall(async () => {
        try {
            const response = await api.get(ENDPOINTS.PARKS.BOOKING_DETAILS(bookingId));
            return response.data;
        } catch (error) {
            console.error('Error fetching park booking details:', error);
            throw error;
        }
    });
};

import { ticketLimit } from './bookingService.js';

/**
 * Fetch all park bookings for the current user
 */
export const getMyParkBookings = async (page = 1, limit = ticketLimit) => {
    return safeApiCall(async () => {
        try {
            const response = await api.get(ENDPOINTS.PARKS.MY_BOOKINGS, {
                params: { page, limit }
            });
            let body = response.data;

            // Handle potential array wrapper from backend
            if (Array.isArray(body)) {
                body = body[0] || {};
            }

            if (body?.success) {
                const bookings = Array.isArray(body.data) ? body.data : (body.data?.bookings || []);
                const totalPages = body.totalPages || body.pagination?.totalPages || body.data?.pagination?.totalPages || 1;
                const currentPage = body.currentPage || body.pagination?.currentPage || body.data?.pagination?.currentPage || 1;
                const total = body.totalCount || body.total || body.pagination?.totalItems || body.pagination?.total || 0;

                return {
                    bookings: Array.isArray(bookings) ? bookings : [],
                    totalPages,
                    currentPage,
                    total
                };
            }
            return { bookings: [], totalPages: 1, currentPage: 1, total: 0 };
        } catch (error) {
            console.error('Error fetching my park bookings:', error);
            return { bookings: [], totalPages: 1, currentPage: 1, total: 0 };
        }
    });
};



