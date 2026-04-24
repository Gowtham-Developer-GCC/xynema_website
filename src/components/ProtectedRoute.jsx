import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Check both React state AND localStorage to avoid race condition flashes
    const hasStoredSession = !!localStorage.getItem('auth_user');
    const isLoggedIn = !!user || hasStoredSession;

    if (!isLoggedIn) {
        // Only redirect with openLogin if there's truly no session
        return <Navigate to="/" state={{ from: location, openLogin: true }} replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
