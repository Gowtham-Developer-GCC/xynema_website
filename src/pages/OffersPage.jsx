import React, { useState } from 'react';
import { ArrowLeft, Gift, Ticket, Calendar, Copy, Check, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeContext';

const OffersPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [copiedCode, setCopiedCode] = useState(null);

    const offers = [
        {
            id: 1,
            title: '50% off on Movie Tickets',
            code: 'MOVIE50',
            expiry: 'Valid till 28 February',
            type: 'Movie',
            isExpiring: true,
            discount: '50%',
            bgColor: 'bg-primary/5',
            borderColor: 'border-primary/20'
        },
        {
            id: 2,
            title: 'Get ₹100 Cashback on Events',
            code: 'EVENTS100',
            expiry: 'Valid till 28 March',
            type: 'Event',
            isExpiring: false,
            discount: '₹100',
            bgColor: 'bg-indigo-500/5',
            borderColor: 'border-indigo-500/20'
        },
        {
            id: 3,
            title: 'Buy 1 Get 1 Free on Popcorn',
            code: 'BOGOPOPCORN',
            expiry: 'Valid till 15 April',
            type: 'Food',
            isExpiring: false,
            discount: 'B1G1',
            bgColor: 'bg-amber-500/5',
            borderColor: 'border-amber-500/20'
        },
        {
            id: 4,
            title: '₹200 Off on Store Merchandise',
            code: 'STORE200',
            expiry: 'Valid till 30 April',
            type: 'Store',
            isExpiring: false,
            discount: '₹200',
            bgColor: 'bg-emerald-500/5',
            borderColor: 'border-emerald-500/20'
        }
    ];

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title="Offers & Promos - XYNEMA" 
                description="Check out the latest offers and promo codes for movie tickets, events, and snacks."
            />

            {/* Header */}
            <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-[64px] md:top-[80px] z-[50]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                            Offers & <span className="text-primary">Promos</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map((offer) => (
                        <div 
                            key={offer.id} 
                            className={`relative group bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden ${offer.isExpiring ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            {/* Glass background effects */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110 ${offer.isExpiring ? 'bg-primary' : 'bg-indigo-500'}`} />
                            
                            {offer.isExpiring && (
                                <div className="absolute top-4 right-4 z-10">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 animate-pulse">
                                        <div className="w-1 h-1 bg-white rounded-full" />
                                        Expiring
                                    </div>
                                </div>
                            )}

                            <div className="p-6 md:p-8 relative z-10 flex flex-col h-full">
                                {/* Offer Body */}
                                <div className="flex gap-5 mb-8">
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border backdrop-blur-md ${offer.isExpiring ? 'bg-primary/10 border-primary/20' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700'}`}>
                                        <span className={`text-[13px] font-black ${offer.isExpiring ? 'text-primary' : 'text-slate-500 dark:text-gray-400'}`}>
                                            {offer.discount}
                                        </span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-snug">
                                        {offer.title}
                                    </h3>
                                </div>

                                {/* Promo Code Card */}
                                <div className="mt-auto">
                                    <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border mb-5 transition-all group/code ${offer.isExpiring ? 'bg-primary/5 border-primary/10' : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/5'}`}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Promo Code</span>
                                            <span className="text-sm md:text-base font-black text-slate-800 dark:text-white tracking-widest uppercase">
                                                {offer.code}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(offer.code)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${copiedCode === offer.code ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-white/70 hover:scale-110 shadow-sm border border-gray-100 dark:border-gray-700'}`}
                                        >
                                            {copiedCode === offer.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {offer.expiry}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative line */}
                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${offer.isExpiring ? 'w-full bg-primary' : 'w-0 group-hover:w-full bg-indigo-500'}`} />
                        </div>
                    ))}
                </div>

                {/* Empty State Mockup (Alternative) */}
                {offers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                            <Gift className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase mb-2">No active offers</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm px-6">
                            We're working on getting you more amazing deals. Check back soon!
                        </p>
                    </div>
                )}
            </div>

            {/* Support section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 mt-10">
                <div className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 rounded-[32px] md:rounded-[40px] border border-primary/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                    
                    <div className="relative z-10 text-center md:text-left">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase mb-4 leading-none">
                            Have an Issue with <br /><span className="text-primary">Promo Codes?</span>
                        </h3>
                        <p className="text-sm md:text-base font-semibold text-slate-500 dark:text-gray-400 max-w-md">
                            Our support team is available 24/7 to help you with any promotional issues.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/help')}
                        className="relative z-10 px-8 py-4 bg-primary text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <MessageSquare className="w-5 h-5 fill-current opacity-20" />
                        Contact Support
                    </button>
                    
                    {/* Animated background circles */}
                    <div className="absolute bottom-10 left-10 w-4 h-4 border-2 border-primary/20 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                    <div className="absolute top-20 left-1/2 w-2 h-2 bg-primary/20 rounded-full group-hover:translate-y-10 transition-transform duration-[2000ms]" />
                </div>
            </div>
        </div>
    );
};

export default OffersPage;
