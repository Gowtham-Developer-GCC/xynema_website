import React, { useEffect, useState } from 'react';
import { ArrowLeft, Gift, Ticket, Calendar, Copy, Check, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeContext';
import { getCoupons } from '../services/offerService';

const OffersPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [copiedCode, setCopiedCode] = useState(null);
    const [offers, setOffers] = useState([]);
    const offerStyles = [
        {
            card: 'bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-950/20 border-indigo-200/60 dark:border-indigo-700/40',
            glow: 'bg-indigo-500',
            badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-300',
            promo: 'bg-white/90 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/40',
            line: 'bg-indigo-500',
        },
        {
            card: 'bg-gradient-to-br from-white to-emerald-50/60 dark:from-gray-900 dark:to-emerald-950/20 border-emerald-200/60 dark:border-emerald-700/40',
            glow: 'bg-emerald-500',
            badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300',
            promo: 'bg-white/90 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40',
            line: 'bg-emerald-500',
        },
        {
            card: 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white',
            glow: 'bg-primary',
            badge: 'bg-white/10 border-white/20 text-white',
            promo: 'bg-white/10 border-white/10',
            line: 'bg-primary',
        },
    ];

    const formatExpiry = (rawDate) => {
        if (!rawDate) return 'No expiry';

        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return 'No expiry';

        return `Valid till ${date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })}`;
    };

    const getDiscountLabel = (coupon) => {
        const discountValue = coupon?.discountValue ?? coupon?.discount_value;
        const discountType = (coupon?.discountType ?? coupon?.discount_type ?? '').toString().toUpperCase();
        const amount = Number(discountValue);

        if (Number.isFinite(amount) && amount > 0) {
            if (discountType.includes('PERCENT')) {
                return `${amount}%`;
            }
            if (discountType.includes('AMOUNT') || discountType.includes('FLAT')) {
                return `₹${amount}`;
            }
        }

        return coupon?.label || coupon?.type || 'OFFER';
    };

    const isExpiringSoon = (rawDate) => {
        if (!rawDate) return false;
        const expiryDate = new Date(rawDate);
        if (Number.isNaN(expiryDate.getTime())) return false;

        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
    };

    useEffect(() => {
        const fetchCoupons = async () => {
            const apiResult = await getCoupons();
            const possibleList =
                apiResult?.data?.coupons ||
                apiResult?.data ||
                apiResult?.coupons ||
                apiResult;

            const coupons = Array.isArray(possibleList) ? possibleList : [];

            const mappedCoupons = coupons.map((coupon, index) => ({
                id: coupon?._id || coupon?.id || `${coupon?.code || coupon?.couponCode || 'coupon'}-${index}`,
                title: coupon?.title || coupon?.description || coupon?.name || 'Special Offer',
                code: coupon?.code || coupon?.couponCode || coupon?.coupon_code || 'N/A',
                expiry: formatExpiry(coupon?.expiryDate || coupon?.expiry || coupon?.validTill || coupon?.valid_till),
                isExpiring: isExpiringSoon(coupon?.expiryDate || coupon?.expiry || coupon?.validTill || coupon?.valid_till),
                discount: getDiscountLabel(coupon),
                styleIndex: index % offerStyles.length,
            }));

            setOffers(mappedCoupons);
        };

        fetchCoupons();
    }, []);

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
                        (() => {
                            const style = offerStyles[offer.styleIndex] || offerStyles[0];
                            const isDarkAccent = offer.styleIndex === 2;

                            return (
                        <div 
                            key={offer.id} 
                            className={`relative group rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 overflow-hidden ${style.card} ${offer.isExpiring ? 'ring-1 ring-primary/40 shadow-lg shadow-primary/10' : ''}`}
                        >
                            {/* Glass background effects */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110 ${offer.isExpiring ? 'bg-primary' : style.glow}`} />
                            
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
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border backdrop-blur-md ${offer.isExpiring ? 'bg-primary/10 border-primary/20 text-primary' : style.badge}`}>
                                        <span className="text-[13px] font-black">
                                            {offer.discount}
                                        </span>
                                    </div>
                                    <h3 className={`text-lg md:text-xl font-black tracking-tight leading-snug ${isDarkAccent ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                        {offer.title}
                                    </h3>
                                </div>

                                {/* Promo Code Card */}
                                <div className="mt-auto">
                                    <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border mb-5 transition-all group/code ${offer.isExpiring ? 'bg-primary/5 border-primary/10' : style.promo}`}>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkAccent ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>Promo Code</span>
                                            <span className={`text-sm md:text-base font-black tracking-widest uppercase ${isDarkAccent ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                                {offer.code}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(offer.code)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${copiedCode === offer.code ? 'bg-emerald-500 text-white' : isDarkAccent ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-white/70 hover:scale-110 shadow-sm border border-gray-100 dark:border-gray-700'}`}
                                        >
                                            {copiedCode === offer.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className={`flex items-center gap-2 ${isDarkAccent ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {offer.expiry}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative line */}
                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${offer.isExpiring ? 'w-full bg-primary' : `w-0 group-hover:w-full ${style.line}`}`} />
                        </div>
                            );
                        })()
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
