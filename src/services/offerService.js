import api from './api';
import { ENDPOINTS } from './endpoints';

export const getOffers = async () => {
    try {
        const response = await api.get(ENDPOINTS.OFFERS.LIST);
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching offers:', error);
        return [];
    }
};

export const getCoupons = async () => {
    try {
        const response = await api.get(ENDPOINTS.USER.COUPONS);
        return response?.data ?? null;
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return null;
    }
};
