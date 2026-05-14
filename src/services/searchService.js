import api, { safeApiCall } from './api';

export const fetchGlobalSearch = async (query, city, type = null) => {
    return safeApiCall(async () => {
        // Build query parameters dynamically
        const params = { q: query };
        
        // Only append city if it's explicitly selected and not 'All'
        if (city && city !== 'All') {
            params.city = city;
        }
        
        // Optional: If you ever want to build dedicated search pages (e.g., only search movies)
        if (type) {
            params.type = type;
        }

        const response = await api.get('/search', { params });
        
        if (response.data.success) {
            return response.data.data;
        }
        
        // Fallback empty state matching new unified API response
        return { results: [] };
    });
};
