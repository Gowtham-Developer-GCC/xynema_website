import api, { safeApiCall } from './api';
import { ENDPOINTS } from './endpoints';
import { Event, EventBooking } from '../models/index.js';

export const getEvents = async (city) => {
    const targetCity = city || localStorage.getItem('selected_city') || 'mumbai';

    return safeApiCall(async () => {
        try {
            const response = await api.get(ENDPOINTS.EVENTS.LIST, { params: { city: targetCity } });
            let body = response.data;

            if (Array.isArray(body)) {
                body = body[0] || {};
            }

            if (body.success && body.data) {
                const eventsData = body.data.events || body.data;
                return Array.isArray(eventsData) ? eventsData.map(e => new Event(e)) : [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching backend events:', error);
            return [];
        }
    });
};

export const getAllEventsList = async () => {
    return safeApiCall(async () => {
        try {
            const response = await api.get(ENDPOINTS.EVENTS.LIST);
            let body = response.data;

            if (Array.isArray(body)) {
                body = body[0] || {};
            }

            if (body.success && body.data) {
                const eventsData = body.data.events || body.data;
                return Array.isArray(eventsData) ? eventsData.map(e => new Event(e)) : [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching global events:', error);
            return [];
        }
    });
};

export const getEventDetails = async (eventIdOrSlug) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.EVENTS.DETAILS(eventIdOrSlug));
        if (response.data.success) {
            const eventData = response.data.data;
            return eventData ? new Event(eventData) : null;
        }
        return null;
    });
};

export const getEventBookings = async (page = 1) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.EVENT_BOOKING.LIST, { params: { page } });
        let body = response.data;
        if (Array.isArray(body)) body = body[0] || {};

        if (body.success) {
            const data = body.data;
            const bookings = Array.isArray(data) ? data : (data?.bookings || []);
            
            return {
                bookings: Array.isArray(bookings) ? bookings.map(b => EventBooking.fromJson(b)) : [],
                totalPages: body.totalPages || 1,
                currentPage: body.currentPage || 1,
                total: body.totalCount || (Array.isArray(bookings) ? bookings.length : 0)
            };
        }
        return { bookings: [], totalPages: 1, currentPage: 1, total: 0 };
    });
};

export const getEventBookingDetails = async (bookingId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.EVENT_BOOKING.DETAILS(bookingId));
        let body = response.data;

        if (Array.isArray(body)) {
            body = body[0] || {};
        }

        if (body.success && body.data) {
            return body.data;
        }
        return null;
    });
};

export const reserveEventTickets = async (eventId, tickets, showDate = null, showTime = null) => {
    return safeApiCall(async () => {
        const body = { tickets };
        if (showDate) body.showDate = showDate;
        if (showTime) body.showTime = showTime;

        const response = await api.post(ENDPOINTS.EVENT_BOOKING.RESERVE(eventId), body);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to reserve tickets');
    });
};

export const confirmEventBooking = async (reservationId, bookingData) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.EVENT_BOOKING.CONFIRM(reservationId), {
            ...bookingData,
            source: 'web'
        });
        if (response.data.success) {
            return response.data;
        }
        throw new Error(response.data.message || 'Failed to confirm booking');
    });
};

export const submitPrivateEventEnquiry = async (data) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.EVENTS.ENQUIRY, data);
        return response.data;
    }, 'submit private event enquiry');
};
