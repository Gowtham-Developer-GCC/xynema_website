import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Ticket, Home, ChevronRight, Share2 } from 'lucide-react';
import SEO from '../components/SEO';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingData } = location.state || {};

    const isPark = bookingData?.isPark;
    const isEvent = bookingData?.isEvent;
    const isTurf = bookingData?.isTurf;
    const isMovie = !isPark && !isEvent && !isTurf;

    const title = isPark 
        ? bookingData.parkName 
        : isEvent 
            ? bookingData.eventName 
            : isTurf 
                ? bookingData.turfName 
                : (bookingData?.movieTitle || sessionStorage.getItem('booking_movie_title') || 'Movie');

    const posterUrl = isPark 
        ? bookingData.posterUrl 
        : isEvent 
            ? bookingData.eventImage 
            : isTurf 
                ? bookingData.turfImage 
                : (bookingData?.posterUrl || sessionStorage.getItem('booking_movie_landscape_poster') || '');

    const placeName = isPark 
        ? bookingData.parkName 
        : isEvent 
            ? bookingData.venueName 
            : isTurf 
                ? (bookingData.courtName || bookingData.turfName)
                : (bookingData?.theaterName || sessionStorage.getItem('booking_theater_name') || 'Theater');

    const showTime = isPark 
        ? '' 
        : (bookingData?.time || sessionStorage.getItem('booking_show_time') || '');

    const showDate = bookingData?.date || '';
    const seats = isMovie ? (bookingData?.seatIds || bookingData?.seats || []) : [];
    const bookingId = bookingData?.bookingId || bookingData?.id || 'BK' + Date.now();
    const totalTicketCount = isPark 
        ? (bookingData?.tickets?.reduce?.((acc, t) => acc + (t.quantity || t.qty || 0), 0) || 1) 
        : isEvent 
            ? 1 
            : isTurf 
                ? 1 
                : seats.length;

    useEffect(() => {
        window.scrollTo(0, 0);
        // If someone directly accesses this page without state, redirect to home
        if (!bookingData) {
            navigate('/', { replace: true });
            return;
        }

        // Trigger a local notification for immediate feedback
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Booking Confirmed!", {
                body: isPark ? `Your booking for ${title} is confirmed!` : `Your booking for ${title} is locked in!`,
                icon: "/logo.png"
            });
        }
    }, [bookingData, navigate, title, isPark]);

    if (!bookingData) return null;

    const handleViewTicket = () => {
        if (isPark) {
            navigate(`/activities/park-bookings/${bookingId}`);
        } else if (isEvent) {
            navigate(`/event-bookings/${bookingId}`);
        } else if (isTurf) {
            navigate(`/activities/bookings/${bookingId}`);
        } else {
            navigate(`/bookings/${bookingId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
            <SEO title="Booking Confirmed! - Xynema" />
            
            <div className="max-w-xl w-full space-y-8 animate-in fade-in zoom-in duration-700">
                {/* Success Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/20">
                        <CheckCircle className="w-10 h-10 text-emerald-500 animate-in zoom-in spin-in-12 duration-1000" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Booking Confirmed!</h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Your ticket is ready and has been saved to your account.</p>
                    </div>
                </div>

                {/* Premium Ticket Preview Card */}
                <div className="bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 transition-all">
                    <div className="relative h-48 bg-gray-900 overflow-hidden">
                        {posterUrl ? (
                            <img src={posterUrl} alt={title} className="w-full h-full object-cover opacity-60" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <Ticket className="w-16 h-16 text-white/10" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                        
                        <div className="absolute bottom-6 left-6 right-6">
                            <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                                {isPark ? 'Park Pass' : isEvent ? 'Event Pass' : isTurf ? 'Turf Slot' : 'Movie Ticket'}
                            </span>
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-2 line-clamp-1">{title}</h2>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-dashed border-gray-100 dark:border-gray-800 relative">
                        {/* Simulated Ticket Cutouts */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F5F5FA] dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800" />
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F5F5FA] dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800" />

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Venue</p>
                                    <p className="text-xs md:text-sm font-black text-gray-800 dark:text-gray-200 uppercase line-clamp-1">{placeName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Date</p>
                                    <p className="text-xs md:text-sm font-black text-gray-800 dark:text-gray-200 uppercase">
                                        {showDate ? new Date(showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {showTime && (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Time</p>
                                        <p className="text-xs md:text-sm font-black text-gray-800 dark:text-gray-200 uppercase">{showTime}</p>
                                    </div>
                                </div>
                            )}

                            {seats.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
                                        <Ticket className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Seats</p>
                                        <p className="text-xs md:text-sm font-black text-gray-800 dark:text-gray-200 uppercase truncate max-w-[160px]">{seats.join(', ')}</p>
                                    </div>
                                </div>
                            )}

                            {totalTicketCount > 0 && !seats.length && (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-center shrink-0">
                                        <Ticket className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Quantity</p>
                                        <p className="text-xs md:text-sm font-black text-gray-800 dark:text-gray-200 uppercase">{totalTicketCount} Ticket(s)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 md:px-8 md:py-5 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-gray-400">
                        <span>Booking ID</span>
                        <span className="text-gray-800 dark:text-gray-200 font-black">{bookingId}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                        onClick={() => navigate('/')} 
                        className="flex-grow flex-1 bg-white dark:bg-gray-900 text-slate-800 dark:text-white font-black text-[13px] uppercase tracking-[0.2em] py-5 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-gray-850 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Home className="w-4 h-4" /> Go to Home
                    </button>
                    <button 
                        onClick={handleViewTicket}
                        className="flex-1 bg-primary text-white font-black text-[13px] uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 animate-pulse"
                    >
                        View Digital Ticket <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <button className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-colors py-2">
                    <Share2 className="w-3.5 h-3.5" /> Share Ticket with Friends
                </button>
            </div>
        </div>
    );
};

export default BookingSuccess;
