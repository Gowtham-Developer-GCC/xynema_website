import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
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

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);
