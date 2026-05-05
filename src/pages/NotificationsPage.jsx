import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Bell, Ticket, CreditCard, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { getUserNotifications, markNotificationAsRead } from '../services/notificationService';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getUserNotifications();
                const unreadOnly = (Array.isArray(data) ? data : []).filter(n => !n.isRead);
                setNotifications(unreadOnly);
            } catch (error) {
                console.error('Error loading notifications:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const handleNotificationClick = async (notif) => {
        try {
            if (!notif.isRead) {
                // Optimistic update - Remove from list instead of just marking read
                setNotifications(prev => prev.filter(n => n._id !== notif._id));
                await markNotificationAsRead(notif._id);
            }
            
            // Handle navigation if notif has a URL
            if (notif.data?.url) {
                navigate(notif.data.url);
            }
        } catch (err) {
            console.error('[Notification Page] Error in click handler:', err);
        }
    };

    const filteredNotifications = Array.isArray(notifications) ? notifications.filter(notif => {
        if (filter === 'All') return true;
        const type = (notif.type || '').toLowerCase();
        if (filter === 'Bookings') return type.includes('booking');
        if (filter === 'Payments') return type.includes('payment');
        return true;
    }) : [];

    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    const getIcon = (type = '') => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('booking')) return Ticket;
        if (lowerType.includes('payment')) return CreditCard;
        return Bell;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title="Notifications - XYNEMA" 
                description="Stay updated with your bookings, offers, and more."
            />
            
            {/* Header */}
            <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-[64px] md:top-[80px] z-[50]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
                    <button 
                        onClick={() => navigate('/notifications/settings')}
                        className="flex items-center gap-2 text-primary hover:text-primary/90 font-black text-[11px] uppercase tracking-widest transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="hidden sm:inline">Settings</span>
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Filters */}
                <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Bookings', 'Payments'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${
                                filter === f 
                                ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-white/5'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="space-y-12">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="w-12 h-12 rounded-2xl border-4 border-primary border-t-transparent animate-spin mb-6" />
                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Fetching notifications...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap pl-1">Today</span>
                                <div className="h-px flex-grow bg-gray-100 dark:bg-white/5" />
                            </div>

                            <div className="space-y-4">
                                {filteredNotifications.map((notif) => {
                                    const Icon = getIcon(notif.type);
                                    return (
                                        <div 
                                            key={notif._id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`group bg-white dark:bg-gray-800/50 rounded-[32px] p-6 border transition-all cursor-pointer relative overflow-hidden ${
                                                !notif.isRead 
                                                ? 'border-primary/20 bg-primary/5 shadow-lg shadow-primary/5' 
                                                : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1'
                                            }`}
                                        >
                                            <div className="flex gap-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                                                    (notif.type || '').toLowerCase().includes('booking') ? 'bg-primary/10 text-primary' :
                                                    (notif.type || '').toLowerCase().includes('payment') ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-gray-500/10 text-gray-500'
                                                }`}>
                                                    <Icon className="w-7 h-7" />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight uppercase">
                                                            {notif.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                                                {getRelativeTime(notif.createdAt)}
                                                            </span>
                                                            {!notif.isRead && (
                                                                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
                                                        {notif.body}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-white/5 flex items-center justify-center mb-8 shadow-xl">
                                <Inbox className="w-10 h-10 text-gray-200 dark:text-gray-700" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3">No notifications yet</h3>
                            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] max-w-xs mx-auto leading-loose">
                                We'll let you know when something important happens!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
