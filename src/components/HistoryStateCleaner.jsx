import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Utility component to clean up stale 'openLogin' markers from the browser history 
 * as soon as an authenticated session is detected.
 */
const HistoryStateCleaner = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // If we are logged in but the current URL state still thinks it needs to open login
        if (isAuthenticated && location.state?.openLogin) {
            console.log('[HistoryCleaner] Cleaning up stale login trigger from path:', location.pathname);
            
            // Wipe the state while staying on the same page
            navigate(location.pathname, { 
                replace: true, 
                state: { ...location.state, openLogin: false } 
            });
        }
    }, [isAuthenticated, location, navigate]);

    return null; // This component doesn't render anything
};

export default HistoryStateCleaner;
