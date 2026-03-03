import axios from 'axios';
import { emitUnauthorized } from './authEvents';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Axios instance with base configuration
 * Handles all HTTP requests with automatic auth token injection
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
    timeout: 15000, // Matching Flutter's 15s timeout
});

/**
 * Global API Utility: safeApiCall
 * Matches Flutter's ApiUtils.safeApiCall logic
 */
export const safeApiCall = async (apiCall, retries = 3) => {
    try {
        const response = await apiCall();
        return response;
    } catch (error) {
        // Handle Timeout, Network Errors (Socket Exception equivalent)
        const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error';

        if (isNetworkError && retries > 0) {
            console.warn(`[API] Network issue detected. Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return safeApiCall(apiCall, retries - 1);
        }

        console.error('[API Error]', error);
        throw error;
    }
};

// ============= Local Storage Helpers =============
/**
 * Retrieve stored user from localStorage
 */
export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('auth_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error parsing stored user:', e);
        return null;
    }
};

/**
 * Store user in localStorage
 */
export const storeUser = (user) => {
    try {
        localStorage.setItem('auth_user', JSON.stringify(user));
    } catch (e) {
        console.error('Error storing user:', e);
    }
};

/**
 * Remove user from localStorage
 */
export const removeUser = () => {
    try {
        localStorage.removeItem('auth_user');
    } catch (e) {
        console.error('Error removing user:', e);
    }
};

// ============= Interceptors =============
/**
 * Request interceptor - Add authorization header
 */
api.interceptors.request.use(
    (config) => {
        const user = getStoredUser();
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor - Handle errors and unauthorized access
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLogoutRequest = error.config?.url?.includes('/user/logout');

        if (error.response?.status === 401 && !isLogoutRequest) {
            removeUser();
            emitUnauthorized();
        }
        return Promise.reject(error);
    }
);

// ============= Error Handler =============
export const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error status
        return {
            status: error.response.status,
            message: error.response.data?.message || 'An error occurred',
            data: error.response.data,
        };
    } else if (error.request) {
        // Request made but no response
        return {
            status: 0,
            message: 'No response from server',
            data: null,
        };
    }
    // Error in request setup
    return {
        status: -1,
        message: error.message || 'Unknown error',
        data: null,
    };
};

export default api;
