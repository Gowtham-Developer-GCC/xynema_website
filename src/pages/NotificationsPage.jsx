import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Ticket, Gift, Film, Smartphone, Mail, MessageSquare, Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeContext';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    // Notification states
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('notification_settings');
        return saved ? JSON.parse(saved) : {
            bookingConfirmations: true,
            offersPromotions: true,
            newReleases: true,
            pushNotifications: true,
            email: true,
            sms: false
        };
    });

    const [showSavedToast, setShowSavedToast] = useState(false);

    useEffect(() => {
        localStorage.setItem('notification_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
    };

    const Toggle = ({ enabled, onToggle }) => (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );

    const NotificationItem = ({ icon: Icon, title, description, enabled, onToggle }) => (
        <div className="flex items-center justify-between py-5 first:pt-0 last:pb-0 group">
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                    enabled 
                    ? 'bg-primary/10 border-primary/20 text-primary' 
                    : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-500'
                }`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">
                        {title}
                    </span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                        {description}
                    </span>
                </div>
            </div>
            <Toggle enabled={enabled} onToggle={onToggle} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title="Notifications Settings - XYNEMA" 
                description="Manage how you receive updates about your bookings and exclusive offers."
            />

            {/* Header */}
            <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-[64px] md:top-[80px] z-[50]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                            Notifications
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                
                {/* Content Notifications Section */}
                <div className="mb-10">
                    <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 pl-1">
                        Content Notifications
                    </h2>
                    <div className="bg-white dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-white/5 p-6 md:p-8 backdrop-blur-md shadow-sm">
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            <NotificationItem 
                                icon={Ticket}
                                title="Booking Confirmations"
                                description="Updates about your bookings"
                                enabled={settings.bookingConfirmations}
                                onToggle={() => toggleSetting('bookingConfirmations')}
                            />
                            <NotificationItem 
                                icon={Gift}
                                title="Offers & Promotions"
                                description="Exclusive deals and discounts"
                                enabled={settings.offersPromotions}
                                onToggle={() => toggleSetting('offersPromotions')}
                            />
                            <NotificationItem 
                                icon={Film}
                                title="New Releases"
                                description="Latest movies and shows"
                                enabled={settings.newReleases}
                                onToggle={() => toggleSetting('newReleases')}
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Channels Section */}
                <div className="mb-10">
                    <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 pl-1">
                        Notification Channels
                    </h2>
                    <div className="bg-white dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-white/5 p-6 md:p-8 backdrop-blur-md shadow-sm">
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            <NotificationItem 
                                icon={Smartphone}
                                title="Push Notifications"
                                description="Receive push notifications on your device"
                                enabled={settings.pushNotifications}
                                onToggle={() => toggleSetting('pushNotifications')}
                            />
                            <NotificationItem 
                                icon={Mail}
                                title="Email"
                                description="Receive notifications via email"
                                enabled={settings.email}
                                onToggle={() => toggleSetting('email')}
                            />
                            <NotificationItem 
                                icon={MessageSquare}
                                title="SMS"
                                description="Receive text messages"
                                enabled={settings.sms}
                                onToggle={() => toggleSetting('sms')}
                            />
                        </div>
                    </div>
                </div>

                {/* Privacy Badge Card */}
                <div className="bg-indigo-500/5 dark:bg-indigo-500/10 rounded-3xl border border-indigo-500/10 p-6 flex flex-col md:flex-row items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Your Data is Private</h4>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                            We use your contact info only for requested notifications. Unsubscribe anytime in account settings.
                        </p>
                    </div>
                </div>
            </div>

            {/* Saved Toast Overlay */}
            <div className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
                showSavedToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
            }`}>
                <div className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Settings Saved</span>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
