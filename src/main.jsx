import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Environment from './config/environment.js';

// Validate environment configuration on startup
try {
    Environment.validate();
    // Log configuration only in development (removed for cleaner console)
} catch (error) {
    console.error('❌ Configuration Error:', error.message);
    document.body.innerHTML = '<h1>Application Configuration Error</h1><p>Please check your environment variables.</p>';
    process.exit(1);
}

const clientId = Environment.googleClientId;

if (!clientId) {
    console.error('❌ Google Client ID is not configured');
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={clientId}>
            <ThemeProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
