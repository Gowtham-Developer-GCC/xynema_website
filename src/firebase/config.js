import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyAuNTtI-eQ5dwNt_yA5u6NLF1VYuIrnIwM",
    authDomain: "xynema-04.firebaseapp.com",
    projectId: "xynema-04",
    storageBucket: "xynema-04.firebasestorage.app",
    messagingSenderId: "306095400751",
    appId: "1:306095400751:web:e8c9eff3ef3b9575b223da",
    measurementId: "G-FLK0MKSYVV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Messaging
export const messaging = getMessaging(app);

export default app;
