// Add these to your src/services/bookingService.js file
import api from './api';
import { ENDPOINTS } from './endpoints'; // Adjust this import based on your setup

export const getCancellationPolicy = async (bookingId) => {
    try {
        const response = await api.get(ENDPOINTS.CANCELLATION.MOVIES.GET_POLICY(bookingId));
        return response.data; // Should return the { success: true, data: {...} } object
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const cancelBooking = async (bookingId) => {
    try {
        // Define the default body payload
        const payload = {
            cancellationReason: "i need to cancel"
        };
        const response = await api.post(ENDPOINTS.CANCELLATION.MOVIES.CANCEL(bookingId), payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};