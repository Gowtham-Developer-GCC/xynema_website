import api, { safeApiCall, storeUser, removeUser, getStoredUser } from './api';
import { ENDPOINTS } from './endpoints';
import { User } from '../models/index.js';

export const getUserProfile = async () => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.USER.PROFILE);
        if (response.data.success) {
            const userData = response.data.data;
            return new User(userData);
        }
        return null;
    });
};

export const getUser = async (userId) => {
    return getUserProfile();
};

export const updateUserProfile = async (profileData) => {
    return safeApiCall(async () => {
        const response = await api.put(ENDPOINTS.USER.UPDATE, profileData);
        if (response.data.success) {
            const userData = response.data.data;
            return new User(userData);
        }
        throw new Error(response.data.message || 'Failed to update profile');
    });
};

export const loginWithGoogle = async (idToken) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.USER.GOOGLE_LOGIN, { idToken });
        if (response.data.success) {
            // Token may be at root level OR inside data — check both
            const token = response.data.token || response.data.data?.token || '';
            const initialUser = new User({ ...response.data.data, token, loginMethod: 'google' });
            storeUser(initialUser.toJson());

            try {
                const fullProfile = await getUserProfile();
                if (fullProfile) {
                    fullProfile.token = token || initialUser.token;
                    storeUser(fullProfile.toJson());
                    return {
                        success: true,
                        data: fullProfile,
                        user: fullProfile,
                        token: fullProfile.token,
                    };
                }
            } catch (error) {
                console.warn('Failed to fetch full profile after login, proceeding with basic info:', error);
            }

            return {
                success: true,
                data: initialUser,
                user: initialUser,
                token: initialUser.token,
            };
        }
        throw new Error(response.data.message || 'Google login failed');
    });
};

export const sendPhoneLogin = async (phone) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.USER.PHONE_LOGIN, { phone });
        return response.data;
    });
};

export const verifyPhoneOtp = async (phone, otp) => {
    return safeApiCall(async () => {
        const response = await api.post(ENDPOINTS.USER.VERIFY_OTP, { phone, otp });
        if (response.data.success) {
            // Token may be at root level OR inside data — check both
            const token = response.data.token || response.data.data?.token || '';
            const initialUser = new User({ ...response.data.data, token, loginMethod: 'phone' });
            storeUser(initialUser.toJson());

            try {
                const fullProfile = await getUserProfile();
                if (fullProfile) {
                    fullProfile.token = token || initialUser.token;
                    storeUser(fullProfile.toJson());
                    return {
                        success: true,
                        data: fullProfile,
                        user: fullProfile,
                        token: fullProfile.token,
                    };
                }
            } catch (error) {
                console.warn('Failed to fetch full profile after login, proceeding with basic info:', error);
            }

            return {
                success: true,
                data: initialUser,
                user: initialUser,
                token: initialUser.token,
            };
        }
        throw new Error(response.data.message || 'OTP Verification failed');
    });
};

export const logout = async () => {
    try {
        const user = getStoredUser();
        if (user && user.token) {
            await api.post(ENDPOINTS.USER.LOGOUT);
        }
    } catch (error) {
        console.error('Error logging out:', error);
    } finally {
        removeUser();
    }
};

export const getCoupons = async () => {
    return safeApiCall(async () => {
        const response = await api.get(ENDPOINTS.USER.COUPONS);
        if (response.data.success) {
            return response.data.data.coupons;
        }
        return [];
    });
};

export const addEmail = async (email) => {
    return safeApiCall(async () => {
        const response = await api.post('/user/add-email', { email });
        return response.data;
    });
};
