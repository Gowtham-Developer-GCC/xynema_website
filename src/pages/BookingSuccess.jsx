import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Ticket, Home, ChevronRight, Share2 } from 'lucide-react';
import SEO from '../components/SEO';
import { optimizeImage } from '../utils/helpers';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingData } = location.state || {};

    useEffect(() => {
        window.scrollTo(0, 0);
        // If someone directly accesses this page without state, redirect to home
        if (!bookingData) {
            navigate('/', { replace: true });
        }
    }, [bookingData, navigate]);

    if (!bookingData) return null;

    const movieTitle = bookingData.movieTitle || sessionStorage.getItem('booking_movie_title') || 'Movie';
    const posterUrl = bookingData.posterUrl || sessionStorage.getItem('booking_movie_landscape_poster') || '';
    const theaterName = bookingData.theaterName || sessionStorage.getItem('booking_theater_name') || 'Theater';
    const showTime = bookingData.time || sessionStorage.getItem('booking_show_time') || '';
    const showDate = bookingData.date || '';
    const seats = bookingData.seatIds || bookingData.seats || [];
    const bookingId = bookingData.bookingId || bookingData.id || 'BK' + Date.now();

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

                {/* Digital Ticket Card */}
                <div className="relative group">
                    {/* Background Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                    
                    <div className="relative bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5 transition-transform hover:-translate-y-1 duration-500">
                        
                        {/* Ticket Header/Poster */}
                        <div className="h-48 relative overflow-hidden bg-slate-900">
                            <img 
                                src={optimizeImage(posterUrl, { width: 800 }) || "/logo.png"} 
                                alt={movieTitle}
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                            <div className="absolute bottom-6 left-8 right-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-wider truncate">{movieTitle}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded uppercase tracking-widest">U/A</span>
                                    <span className="text-[10px] font-black bg-white/10 text-white px-2 py-0.5 rounded backdrop-blur-md uppercase tracking-widest">2D (ATMOS)</span>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Details */}
                        <div className="p-8 md:p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Theater</p>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase truncate">{theaterName}</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Booking ID</p>
                                    <div className="flex items-center gap-2">
                                        <Ticket className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase truncate"># {bookingId.slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Date & Time</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase">
                                            {showDate} • {showTime}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Selected Seats</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {seats.map((s, idx) => (
                                            <span key={idx} className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white px-2 py-1 rounded text-xs font-black tracking-tighter">
                                                {typeof s === 'string' ? s : `${s.row}${s.seatNumber || s.number}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Divider Line */}
                            <div className="relative flex items-center py-4">
                                <div className="absolute -left-14 w-8 h-8 rounded-full bg-[#f5f5fa] dark:bg-gray-950 border-r border-gray-100 dark:border-white/5"></div>
                                <div className="flex-grow border-t-2 border-dashed border-gray-100 dark:border-white/10"></div>
                                <div className="absolute -right-14 w-8 h-8 rounded-full bg-[#f5f5fa] dark:bg-gray-950 border-l border-gray-100 dark:border-white/5"></div>
                            </div>

                            {/* QR Mock / Summary */}
                            <div className="flex items-center justify-between gap-6 pt-2">
                                <div className="space-y-2 flex-grow">
                                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3" /> Booking Paid
                                    </p>
                                    <h4 className="text-[16px] font-black text-slate-900 dark:text-white uppercase">Scan at Entrance</h4>
                                    <p className="text-[11px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-tight">Show this QR locally or on your "My Bookings" page.</p>
                                </div>
                                <div className="shrink-0 group-hover:scale-110 transition-transform duration-500 p-2 bg-white rounded-2xl shadow-inner border border-slate-50">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${bookingId}&color=e50914`} 
                                        alt="Ticket QR"
                                        className="w-20 h-20 md:w-24 md:h-24 mix-blend-multiply opacity-90"
                                    />
                                </div>
                            </div>
                        </div>
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
                        onClick={() => navigate('/bookings')}
                        className="flex-1 bg-white dark:bg-gray-900 text-slate-800 dark:text-white font-black text-[13px] uppercase tracking-[0.2em] py-5 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-gray-850 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        View My Bookings <ChevronRight className="w-4 h-4" />
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
