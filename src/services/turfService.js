import api, { safeApiCall } from './api';
import { ENDPOINTS } from './endpoints';
import { Turf } from '../models/index.js';

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
                // Return data directly if it's already an array, else check for turfs field
                const turfsData = Array.isArray(body.data) ? body.data : (body.data.turfs || []);
                return Array.isArray(turfsData) ? turfsData.map(t => new Turf(t)) : [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching available turfs:', error);
            return [];
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
        if (response.data.success && response.data.data) {
            return new Turf(response.data.data);
        }
        return null;
    });
};
