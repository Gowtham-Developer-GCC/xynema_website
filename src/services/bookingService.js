import api, { safeApiCall } from './api';
import { ENDPOINTS } from './endpoints';
import { ShowLayoutResponse, Booking } from '../models/index.js';

export const getShowSeats = async (showId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.BOOKING.SHOWS.AVAILABLE_SEATS(showId));
        let responseData = response.data;
        if (Array.isArray(responseData)) {
            responseData = responseData[0];
        }
        const data = responseData?.data || responseData;
        return new ShowLayoutResponse(data);
    });
};

export const getSeats = async (showId) => {
    const response = await getShowSeats(showId);
    return {
        success: true,
        data: response
    };
};

export const lockSeats = async (showId, payload) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.BOOKING.SHOWS.LOCK_SEATS(showId), payload);
        if (response.data.success) {
            return response.data.data?.sessionId || null;
        }
        throw new Error(response.data.message || 'Failed to lock seats');
    });
};

export const releaseSeats = async (showId, seatIds) => {
    return safeApiCall(async () => {
        try {
            const response = await api.post(ENDPOINTS.BOOKING.SHOWS.RELEASE_SEATS(showId), { seatIds });
            return response.data.success || false;
        } catch (error) {
            console.error(`[API] releaseSeats failed:`, error);
            return false;
        }
    });
};

export const confirmBooking = async (showId, bookingData) => {
    try {
        const response = await api.post(ENDPOINTS.BOOKING.SHOWS.CONFIRM(showId), {
            ...bookingData,
            platform: 'web'
        }, {
            timeout: 60000
        });

        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('[API] confirmBooking failed:', error);
        throw error;
    }
};

export const getUserBookings = async (page = 1) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.BOOKING.MY_BOOKINGS, { params: { page } });
        if (response.data.success) {
            const data = response.data.data;
            // Handle both nested { bookings: [] } and direct [] response
            const bookings = Array.isArray(data) ? data : (data?.bookings || []);

            return {
                bookings: Array.isArray(bookings) ? bookings.map(b => Booking.fromApiJson(b)) : [],
                totalPages: data?.totalPages || 1,
                currentPage: data?.currentPage || 1,
                total: data?.total || (Array.isArray(data) ? data.length : 0)
            };
        }
        return { bookings: [], totalPages: 1, currentPage: 1, total: 0 };
    });
};

export const getBookingDetails = async (bookingId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.BOOKING.BOOKING_DETAILS(bookingId));
        if (response.data.success) {
            const booking = response.data.data?.booking || response.data.data;
            return booking ? Booking.fromApiJson(booking) : null;
        }
        return null;
    });
};

export const getFoodAndBeverages = async (theaterId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.BOOKING.SHOWS.FOOD_AND_BEVERAGES(theaterId));
        return response.data;
    });
};
