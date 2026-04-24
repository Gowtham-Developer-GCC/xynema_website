import { messaging } from '../firebase/config';
import { getToken, onMessage } from 'firebase/messaging';
import api from './api';

// VAPID Key is required for Web Push notifications
// You can find this in Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration
const VAPID_KEY = 'BNhLhAAujCphhZ-XlurxuJlIvG_lU86eiBd_uQx93Ytz6N5GQh2TOhEEu1UWF7t0gkeKuhUaDHSqvMitc0RAD_g';

/**
 * Register the device for push notifications
 * 1. Requests permission
 * 2. Registers service worker
 * 3. Fetches FCM token                                                                                         
 * 4. Sends token to backend
 */
export async function registerNotificationToken() {
    try {
        // 1. Ask permission
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notification");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('[FCM] Notification permission not granted. Current state:', permission);
            return null;
        }

        console.log('[FCM] Notification permission granted. Registering Service Worker...');
        
        // 2. Register service worker explicitly for messaging
        console.log('[FCM] Registering Service Worker...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Wait for the service worker to be active
        let sw = registration.installing || registration.waiting || registration.active;
        if (sw) {
            if (sw.state === 'activated') {
                console.log('[FCM] SW already active');
            } else {
                await new Promise((resolve) => {
                    sw.addEventListener('statechange', (e) => {
                        if (e.target.state === 'activated') {
                            console.log('[FCM] SW activated');
                            resolve();
                        }
                    });
                    // Fallback timeout
                    setTimeout(resolve, 2000);
                });
            }
        }

        // 3. Get FCM token from Firebase
        console.log('[FCM] Fetching token with VAPID Key...');
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            // Only provide registration if explicitly needed, usually Firebase finds it correctly
            serviceWorkerRegistration: registration,
        });

        if (token) {
            console.log('FCM Token:', token);

            // 4. Send token to your backend
            try {
                console.log('[FCM] Registering token with backend at /notifications/register-token...');
                await api.post('/notifications/register-token', {
                    token,
                    platform: 'web',
                });
                console.log('[FCM] Backend registration successful.');
            } catch (apiErr) {
                console.error('[FCM] Backend registration failed:', apiErr);
                throw new Error('Server failed to register token');
            }

            // 5. Save token locally for persistence/cleanup
            localStorage.setItem('fcmToken', token);
            return token;
        } else {
            throw new Error('No token generated');
        }
    } catch (err) {
        console.error('[FCM] registerNotificationToken error:', err);
        throw err; // Propagate to UI
    }
}

/**
 * Remove the notification token from backend (e.g., on logout)
 */
export async function removeNotificationToken() {
    try {
        const token = localStorage.getItem('fcmToken');
        if (!token) return;

        await api.post('/notifications/remove-token', { token });
        localStorage.removeItem('fcmToken');
    } catch (err) {
        console.error('Token removal failed:', err);
    }
}

/**
 * Listener for foreground messages
 * Pass a callback to be executed when a message is received
 */
export const onMessageListener = (callback) => {
    if (!messaging) return () => {};
    
    // onMessage returns an unsubscribe function
    return onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground message received:', payload);
        if (callback) callback(payload);
    });
};
