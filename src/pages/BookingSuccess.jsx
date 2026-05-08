import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Ticket, Home, ChevronRight, Share2 } from 'lucide-react';
import SEO from '../components/SEO';
import { optimizeImage } from '../utils/helpers';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingData } = location.state || {};

    const isPark = bookingData?.isPark;
    const title = isPark ? bookingData.parkName : (bookingData?.movieTitle || sessionStorage.getItem('booking_movie_title') || 'Movie');
    const posterUrl = isPark ? bookingData.posterUrl : (bookingData?.posterUrl || sessionStorage.getItem('booking_movie_landscape_poster') || '');
    const placeLabel = isPark ? 'Park' : 'Theater';
    const placeName = isPark ? bookingData.parkName : (bookingData?.theaterName || sessionStorage.getItem('booking_theater_name') || 'Theater');
    const showTime = isPark ? '' : (bookingData?.time || sessionStorage.getItem('booking_show_time') || '');
    const showDate = bookingData?.date || '';
    const seats = isPark ? [] : (bookingData?.seatIds || bookingData?.seats || []);
    const bookingId = bookingData?.bookingId || bookingData?.id || 'BK' + Date.now();
    const totalTicketCount = isPark ? (bookingData?.tickets?.reduce?.((acc, t) => acc + (t.quantity || t.qty || 0), 0) || 1) : 0;

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
                body: isPark ? `Your booking for ${title} is confirmed!` : `Your seats for ${title} are locked in!`,
                icon: "/logo.png"
            });
        }
    }, [bookingData, navigate, title, isPark]);

    if (!bookingData) return null;

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
                        <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Your ticket is ready and has been sent to your phone.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                        onClick={() => navigate('/')} 
                        className="flex-1 bg-primary text-white font-black text-[13px] uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Home className="w-4 h-4" /> Go to Home
                    </button>
                    <button 
                        onClick={() => navigate(isPark ? `/activities/park-bookings/${bookingId}` : '/bookings', { state: { isNewBooking: true } })}
                        className="flex-grow flex-1 bg-white dark:bg-gray-900 text-slate-800 dark:text-white font-black text-[13px] uppercase tracking-[0.2em] py-5 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-gray-850 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isPark ? 'View Ticket' : 'View My Bookings'} <ChevronRight className="w-4 h-4" />
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
