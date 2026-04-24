import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chrome, X, ArrowRight } from 'lucide-react';

const GoogleLinkPrompt = () => {
    const { user, isAuthenticated, logoutUser, openLogin } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show only if authenticated via phone and hasn't dismissed it in this session
        const isDismissed = sessionStorage.getItem('dismiss_google_prompt');
        const isPhoneUser = user?.loginMethod === 'phone' || (!user?.email && user?.phoneNumber);
        
        if (isAuthenticated && isPhoneUser && user?.loginMethod !== 'google' && !isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isAuthenticated, user]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('dismiss_google_prompt', 'true');
    };

    const handleSwitch = () => {
        // Since we want them to login with Google for "priority"
        // We'll suggest logging out and logging in with Google
        logoutUser();
        openLogin();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[400px] z-[60] animate-in slide-in-from-bottom-8 duration-700">
            <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-white/5 ring-1 ring-black/5">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <button 
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex gap-5 relative z-10">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-inner border border-gray-100 dark:border-white/5">
                        <Chrome className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-grow pt-1">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">
                            Link Your Google Account
                        </h3>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                            Unlock priority status and sync your bookings across all devices by signing in with Google.
                        </p>
                        
                        <button 
                            onClick={handleSwitch}
                            className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:gap-3 transition-all"
                        >
                            Switch to Google Login <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleLinkPrompt;
