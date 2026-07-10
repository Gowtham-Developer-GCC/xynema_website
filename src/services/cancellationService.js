// src/services/cancellationService.js
import api from './api';
import { ENDPOINTS } from './endpoints';

export const getCancellationPolicy = async (bookingId) => {
    try {
        const response = await api.get(ENDPOINTS.CANCELLATION.MOVIES.GET_POLICY(bookingId));
        return response.data; 
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const cancelBooking = async (bookingId) => {
    try {
        const payload = { cancellationReason: "i need to cancel" };
        const response = await api.post(ENDPOINTS.CANCELLATION.MOVIES.CANCEL(bookingId), payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// --- NEW TURF SERVICES ---
export const getTurfCancellationPolicy = async (turfId) => {
    try {
        const response = await api.get(ENDPOINTS.CANCELLATION.TURF.GET_POLICY(turfId));
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const cancelTurfBooking = async (bookingId) => {
    try {
        const payload = { cancellationReason: "i need to cancel" }; // Default Payload
        const response = await api.post(ENDPOINTS.CANCELLATION.TURF.CANCEL(bookingId), payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// 👇 NEW EVENT SERVICES 👇
export const getEventCancellationPolicy = async (eventId) => {
    try {
        const response = await api.get(ENDPOINTS.CANCELLATION.EVENTS.GET_POLICY(eventId));
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const cancelEventBooking = async (bookingId) => {
    try {
        const payload = { cancellationReason: "i need to cancel" };
        const response = await api.post(ENDPOINTS.CANCELLATION.EVENTS.CANCEL(bookingId), payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// 👇 ADD THESE TWO FUNCTIONS AT THE BOTTOM 👇
export const getParkCancellationPolicy = async (parkId) => {
    try {
        const response = await api.get(ENDPOINTS.CANCELLATION.PARKS.GET_POLICY(parkId));
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const cancelParkBooking = async (bookingId) => {
    try {
        const payload = { cancellationReason: "i need to cancel" };
        const response = await api.post(ENDPOINTS.CANCELLATION.PARKS.CANCEL(bookingId), payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};