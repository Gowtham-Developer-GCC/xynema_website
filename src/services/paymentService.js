import api, { safeApiCall } from './api';
import { ENDPOINTS } from './endpoints';
import { Booking } from '../models/index.js';

export const initiatePayment = async (bookingData) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.PAYMENT.INITIATE, bookingData);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to initiate payment');
    });
};

export const verifyPayment = async (paymentData) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.PAYMENT.VERIFY, paymentData);
        if (response.data.success) {
            return new Booking(response.data.data);
        }
        throw new Error(response.data.message || 'Payment verification failed');
    });
};
