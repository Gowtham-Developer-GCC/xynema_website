import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, storeUser, removeUser, loginWithGoogle, logout } from '../services/api';
import { googleLogout } from '@react-oauth/google';
import { AUTH_EVENTS } from '../services/authEvents';
import { User } from '../models/index.js';
import apiCacheManager from '../services/apiCacheManager';

const AuthContext = createContext();

/**
 * Hook to use auth context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

/**
 * Auth Provider Component
 * Manages authentication state and operations
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Initialize auth state from storage
    useEffect(() => {
        try {
            const storedUser = getStoredUser();
            if (storedUser && storedUser.token) {
                setUser(new User(storedUser));
            }
        } catch (err) {
            console.error('Error loading user from storage:', err);
        } finally {
            setLoading(false);
        }

        // Handle unauthorized events
        const handleUnauthorized = () => {
            logoutUser();
        };

        window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
        return () => {
            window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
        };
    }, []);

    /**
     * Login with Google OAuth
     */
    const loginUser = useCallback(async token => {
        setLoading(true);
        setError(null);
        try {
            console.log('Attempting login with token:', token?.substring(0, 20) + '...');
            const result = await loginWithGoogle(token);
            console.log('loginWithGoogle result:', result);
            const userData = new User(result.data);

            // Store and set user
            storeUser(userData.toJson());
            setUser(userData);
            console.log('User state updated successfully');

            return true;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Login failed';
            setError(errorMsg);
            console.error('Login User Error details:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Logout user
     */
    const logoutUser = useCallback(async () => {
        setLoading(true);
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            googleLogout();
            removeUser();
            setUser(null);
            setError(null);
            setLoading(false);

            // Clear all cached data on logout
            apiCacheManager.clearAll();
        }
    }, []);

    /**
     * Update user profile
     */
    const updateUser = useCallback(userData => {
        const updated = new User({ ...user, ...userData });
        storeUser(updated.toJson());
        setUser(updated);
    }, [user]);

    /**
     * Login Modal Handlers
     */
    const openLogin = useCallback(() => setIsLoginModalOpen(true), []);
    const closeLogin = useCallback(() => setIsLoginModalOpen(false), []);

    /**
     * Check if user is authenticated
     */
    const isAuthenticated = !!user && !!user.token;

    const value = {
        user,
        loading,
        error,
        isAuthenticated,
        isLoginModalOpen,
        openLogin,
        closeLogin,
        loginUser,
        logoutUser,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
