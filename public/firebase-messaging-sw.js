importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAuNTtI-eQ5dwNt_yA5u6NLF1VYuIrnIwM",
    authDomain: "xynema-04.firebaseapp.com",
    projectId: "xynema-04",
    storageBucket: "xynema-04.firebasestorage.app",
    messagingSenderId: "306095400751",
    appId: "1:306095400751:web:e8c9eff3ef3b9575b223da",
    measurementId: "G-FLK0MKSYVV"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'XYNEMA Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new update.',
        icon: '/logo.png', 
        badge: '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
