import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, storeUser, removeUser } from '../services/api';
import { loginWithGoogle, logout } from '../services/userService';
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
    const [loginCallback, setLoginCallback] = useState(null);

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
    const loginUser = useCallback(async (idToken) => {
        setLoading(true);
        setError(null);
        try {
            const loginResult = await loginWithGoogle(idToken);
            console.log('Login result from service:', loginResult);
            if (loginResult && loginResult.success) {
                const userData = loginResult.user || loginResult.data;
                setUser(userData);
                return userData;
            } else {
                setError('Login failed. Please try again.');
                return null;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed');
            return null;
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
    const openLogin = useCallback((callback = null) => {
        if (callback) {
            setLoginCallback(() => callback);
        }
        setIsLoginModalOpen(true);
    }, []);

    const closeLogin = useCallback(() => {
        setIsLoginModalOpen(false);
        setLoginCallback(null);
    }, []);

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
        loginCallback,
        setLoginCallback,
        openLogin,
        closeLogin,
        loginUser,
        logoutUser,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
