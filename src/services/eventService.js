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

export const getEventBookings = async () => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.EVENT_BOOKING.LIST);
        if (response.data.success) {
            const bookings = response.data.data || [];
            return Array.isArray(bookings)
                ? bookings.map(b => EventBooking.fromJson(b))
                : [];
        }
        return [];
    });
};

export const getEventBookingDetails = async (bookingId) => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.EVENT_BOOKING.DETAILS(bookingId));
        if (response.data.success) {
            return response.data.data;
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
