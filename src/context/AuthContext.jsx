import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getStoredUser, storeUser, removeUser } from '../services/api';
import { loginWithGoogle, logout, sendPhoneLogin, verifyPhoneOtp } from '../services/userService';
import { googleLogout } from '@react-oauth/google';
import { User } from '../models/index.js';
import apiCacheManager from '../services/apiCacheManager';
import { registerNotificationToken, removeNotificationToken, onMessageListener } from '../services/notificationService';
import { toast } from 'react-hot-toast';

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
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('auth_user');
            const storedToken = localStorage.getItem('auth_token');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                const tokenToUse = parsed?.token || storedToken;
                if (tokenToUse) {
                    return new User({ ...parsed, token: tokenToUse });
                }
            }
        } catch (err) {
            console.error('Error initializing user from storage:', err);
        }
        return null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [showEmailPrompt, setShowEmailPrompt] = useState(false);
    const [loginCallback, setLoginCallback] = useState(null);
    const [emailCallback, setEmailCallback] = useState(null);

    // Synchronize token and registration whenever user changes
    useEffect(() => {
        if (user && user.token) {
            localStorage.setItem('auth_token', user.token);
            
            // Sync with storage
            const stored = localStorage.getItem('auth_user');
            const currentUserJson = JSON.stringify(user instanceof User ? user.toJson() : user);
            if (stored !== currentUserJson) {
                localStorage.setItem('auth_user', currentUserJson);
            }

            // REGISTER NOTIFICATION TOKEN
            registerNotificationToken().catch(err => {
                console.error('[Auth] Failed to register push token:', err);
            });
        }
    }, [user]);
        // State already initialized via lazy initializer in useState

    // Setup notifications and FCM
    useEffect(() => {
        // Setup Foreground notification listener
        let unsubscribeMessaging = () => {};
        if ('Notification' in window) {
            unsubscribeMessaging = onMessageListener((payload) => {
                if (payload?.notification) {
                    const { title, body } = payload.notification;
                    console.log('[FCM] Foreground message received:', title, body);
                    
                    // 1. Native browser notification (Protected)
                    try {
                        if ('Notification' in window && Notification.permission === 'granted') {
                            const n = new Notification(title, {
                                body: body,
                                icon: '/logo.png',
                            });
                            n.onclick = () => window.focus();
                        }
                    } catch (err) {
                        console.warn('[FCM] Native notification suppressed:', err.message);
                    }

                    // 2. Stylish Toast Notification
                    toast(
                        (t) => (
                            <div className="flex flex-col gap-1">
                                <span className="font-bold">{title}</span>
                                <span className="text-sm">{body}</span>
                            </div>
                        ),
                        {
                            duration: 6000,
                            position: 'top-right',
                            icon: '🔔',
                        }
                    );
                }
            });
        }

        return () => {
            if (typeof unsubscribeMessaging === 'function') {
                unsubscribeMessaging();
            }
        };
    }, []);

    const isAuthenticated = !!user && !!user.token;

    /**
     * Login with Google OAuth
     */
    const loginUser = useCallback(async (idToken) => {
        setLoading(true);
        setError(null);
        try {
            const loginResult = await loginWithGoogle(idToken);
            if (loginResult && loginResult.success) {
                const rawData = loginResult.user || loginResult.data || {};
                const token = loginResult.token || rawData.token || rawData.accessToken || loginResult.accessToken;

                // 1. COMPLETELY WIPE OLD SESSION FIRST
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');

                // 2. Build new identity
                const userData = new User({ ...rawData, token });

                // 3. Force update headers immediately
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    localStorage.setItem('auth_token', token);
                }

                setUser(userData);
                storeUser(userData.toJson());
                
                setIsLoginModalOpen(false);
                setLoginCallback(null);
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
            // Unregister notifications before logging out
            await removeNotificationToken();
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            googleLogout();
            removeUser();
            localStorage.removeItem('auth_token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
            setError(null);
            setLoading(false);

            // Clear all cached data on logout
            apiCacheManager.clearAll();
        }
    }, []);

    /**
     * Initiate login with phone
     */
    const initiatePhoneLogin = useCallback(async (phone) => {
        setLoading(true);
        setError(null);
        try {
            const result = await sendPhoneLogin(phone);
            return result;
        } catch (err) {
            console.error('Phone login initiation error:', err);
            setError(err.message || 'Failed to send OTP');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Verify OTP and complete login
     */
    const verifyOtp = useCallback(async (phone, otp) => {
        setLoading(true);
        setError(null);
        try {
            const loginResult = await verifyPhoneOtp(phone, otp);
            if (loginResult && loginResult.success) {
                const rawData = loginResult.data || loginResult;
                const token = loginResult.token || rawData.token || rawData.accessToken || loginResult.accessToken;
                
                // 1. COMPLETELY WIPE OLD SESSION FIRST
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
                
                // 2. Build new identity
                const userObj = rawData.user || rawData.data || rawData;
                const userData = new User({ ...userObj, token: token });
                
                // 3. Force update headers immediately for the next API call
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    localStorage.setItem('auth_token', token);
                }
                
                console.log('[Auth] OTP Verified. Session force-updated.');
                
                setUser(userData);
                storeUser(userData.toJson());
                
                setIsLoginModalOpen(false);
                setLoginCallback(null);
                return userData;
            } else {
                setError('OTP Verification failed. Please try again.');
                return null;
            }
        } catch (err) {
            console.error('OTP verification error:', err);
            setError(err.message || 'Verification failed');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Update user profile
     */
    const updateUser = useCallback(userData => {
        if (!userData) return;
        
        setUser(prevUser => {
            // CRITICAL: Always preserve the current session token
            const contextToken = prevUser?.token;
            const storageToken = localStorage.getItem('auth_token');
            const tokenToPreserve = userData.token || contextToken || storageToken;
            
            // Extract pure data for merging
            const rawNewData = userData instanceof User ? userData.toJson() : userData;
            const baseData = prevUser instanceof User ? prevUser.toJson() : (prevUser || {});
            
            const mergedData = { 
                ...baseData, 
                ...rawNewData, 
                token: tokenToPreserve 
            };
            
            const updated = new User(mergedData);
            return updated;
        });
        
        console.log('[Auth] User profile update triggered');
    }, []);

    const openLogin = useCallback((callback = null) => {
        // If already authenticated, just execute callback
        if (isAuthenticated) {
            if (callback) callback();
            return;
        }
        
        if (callback) {
            setLoginCallback(() => callback);
        }
        setIsLoginModalOpen(true);
    }, [isAuthenticated, user]);

    /**
     * Specialized helper for booking flows
     * Ensures user is logged in AND has an email if they are a phone user
     * Returns true if all good, false if a modal was opened
     */
    const ensureAuthAndEmail = useCallback((callback = null) => {
        try {
            const hasStoredToken = !!localStorage.getItem('auth_token');
            const isFullyAuth = isAuthenticated || (!!user && !!user.token) || hasStoredToken;
            
            console.log('[Auth] ensureAuthAndEmail check initiated', { isFullyAuth, isAuthenticated });
            
            if (!isFullyAuth) {
                console.log('[Auth] User not authenticated, opening login');
                openLogin(callback);
                return false;
            }

            // User is authenticated - IMMEDIATELY proceed and NEVER open modal again
            console.log('[Auth] Session active, allowing progression');
            if (callback) {
                // If it was already true, we might need to trigger the callback manually
                // for some button flows
            }
            return true;
        } catch (err) {
            console.error('[Auth] Error in ensureAuthAndEmail:', err);
            if (callback) callback();
            return true;
        }
    }, [isAuthenticated, user, openLogin]);

    const closeLogin = useCallback(() => {
        setIsLoginModalOpen(false);
        setLoginCallback(null);
    }, []);

    const value = {
        user,
        loading,
        error,
        isAuthenticated,
        isLoginModalOpen,
        showEmailPrompt,
        setShowEmailPrompt,
        emailCallback,
        setEmailCallback,
        loginCallback,
        setLoginCallback,
        openLogin,
        closeLogin,
        ensureAuthAndEmail,
        loginUser,
        logoutUser,
        updateUser,
        initiatePhoneLogin,
        verifyOtp,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
