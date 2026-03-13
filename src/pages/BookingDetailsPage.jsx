import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Shield, Info, Monitor, Calendar, MapPin, Armchair, ShoppingBag, Star, CheckCircle, Ticket, Clock } from 'lucide-react';
import { getBookingDetails } from '../services/bookingService';
import { useData } from '../context/DataContext';
import SEO from '../components/SEO';
import BookingQr from '../components/BookingQr';
import ErrorState from '../components/ErrorState';
import LoadingScreen from '../components/LoadingScreen';
import ReviewModal from '../components/ReviewModal';

const BookingDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userBookings } = useData();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [justReviewed, setJustReviewed] = useState(false);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                setLoading(true);
                const response = await getBookingDetails(id);
                if (response) {
                    const globalBooking = userBookings?.find(b => (b.id || b.bookingId) === id);
                    if (globalBooking?.isReviewed && !response.isReviewed) {
                        console.log("Setting isReviewed from global state for booking:", id);
                        response.isReviewed = true;
                    }
                    setBooking(response);
                } else {
                    throw new Error('Booking details not found');
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [id, userBookings]);

    if (loading) return <LoadingScreen message="Ticket Readying" />;
    if (error) return <ErrorState error={error} onRetry={() => navigate('/bookings')} title="Ticket Missing" buttonText="My Bookings" />;

    const bookingDateRaw = booking.showDate || booking.date;
    const bookingDate = bookingDateRaw ? new Date(bookingDateRaw).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : 'TBD';

    const bookingTime = booking.showTime || booking.time || '';

    // Seat Parsing Logic
    const getSeatString = () => {
        if (!booking.seats) return '';
        if (Array.isArray(booking.seats)) {
            return booking.seats.map(s => {
                if (typeof s === 'object') return s.seatLabel || `${s.row}${s.seatNumber}`;
                return s;
            }).join(', ');
        }
        return String(booking.seats);
    };

    const formatLocation = (loc, city) => {
        if (!loc) return city || '';
        // If it's the raw GeoJSON object string
        if (typeof loc === 'string' && (loc.includes('{') || loc.includes('Point') || loc.includes('coordinates'))) {
            return city || '';
        }
        // If it's an actual object
        if (typeof loc === 'object') {
            return city || '';
        }
        return loc;
    };

    const handleDownload = () => {
        window.print();
    };

    const handleReviewSuccess = () => {
        setJustReviewed(true);
        setShowReviewModal(false);
    };



    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 pb-20 transition-colors duration-300">
            <SEO title={`Ticket - ${booking.movieTitle} | XYNEMA`} description="View your movie ticket" />

            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 print:hidden transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center flex items-center gap-2">
                        <Ticket size={16} className="text-primary" />
                        <h1 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Boarding Pass</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Main High-Fidelity Ticket Card */}
                <div className="relative rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">

                    {/* Top Section: Hero Image & Movie Info */}
                    <div className="relative w-full h-56 bg-gray-900 overflow-hidden">
                        {/* Immersive Background */}
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-105 opacity-60 contrast-125 saturate-150"
                            style={{ backgroundImage: `url(${booking.landscapePosterUrl || booking.posterUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent flex flex-col justify-end p-8">
                            <div className="relative z-10 flex gap-6 items-end">
                                {/* Portrait Poster inset */}
                                <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20 shrink-0 transform translate-y-4">
                                    <img
                                        src={booking.posterUrl || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image'}
                                        className="w-full h-full object-cover shadow-inner"
                                        alt={booking.movieTitle}
                                    />
                                </div>
                                {/* Title and Tags */}
                                <div className="flex-1 pb-2">
                                    <h2 className="text-3xl font-black tracking-tighter uppercase text-white leading-none mb-3 drop-shadow-md">
                                        {booking.movieTitle}
                                    </h2>
                                    <div className="flex flex-wrap gap-2 drop-shadow-sm">
                                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-[9px] font-black text-white rounded uppercase tracking-widest">
                                            {booking.format || '2D'}
                                        </span>
                                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-[9px] font-black text-white rounded uppercase tracking-widest">
                                            {booking.language}
                                        </span>
                                        {(booking.movie?.certification || booking.certification) && (
                                            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-[9px] font-black text-white rounded uppercase tracking-widest">
                                                {booking.movie?.certification || booking.certification}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Primary Booking Data */}
                    <div className="p-8 pt-12">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Date & Time */}
                            <div className="col-span-2 sm:col-span-1 space-y-1">
                                <p className="text-[10px] font-black text-primary dark:text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Calendar size={12} /> Show Time
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{bookingDate}</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{bookingTime}</p>
                            </div>

                            {/* Location */}
                            <div className="col-span-2 sm:col-span-1 space-y-1 sm:text-right">
                                <p className="text-[10px] font-black text-primary dark:text-primary uppercase tracking-[0.2em] flex items-center sm:justify-end gap-2">
                                    <MapPin size={12} /> Venue
                                </p>
                                <p className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase line-clamp-2">{booking.theatre?.theatreName || booking.theaterName}</p>
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-0.5">{booking.screen?.screenName || booking.screen || 'Screen 1'}</p>
                            </div>

                            {/* Seats */}
                            <div className="col-span-2 bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 border border-primary/10 dark:border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary dark:text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Armchair size={12} /> Your Seats
                                    </p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{getSeatString()}</p>
                                </div>
                                <div className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                    <span className="text-lg font-black text-gray-900 dark:text-white">{booking.totalSeats || booking.seats?.length || 1}</span>
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Tickets</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Highly Visual Perforation Structural Metaphor */}
                    <div className="relative flex items-center justify-between h-8 z-20 pointer-events-none">
                        {/* Left Cutout */}
                        <div className="absolute left-0 w-8 h-8 -translate-x-1/2 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-800 shadow-[inset_-4px_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_-4px_0_8px_rgba(0,0,0,0.2)]" />

                        {/* Dashed Line */}
                        <div className="w-full border-t-2 border-dashed border-gray-200 dark:border-gray-800 mx-8" />

                        {/* Right Cutout */}
                        <div className="absolute right-0 w-8 h-8 translate-x-1/2 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-800 shadow-[inset_4px_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_4px_0_8px_rgba(0,0,0,0.2)]" />
                    </div>

                    {/* Bottom Section: QR, Pricing, & IDs */}
                    <div className="p-8 pt-6 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">

                            {/* Verification Block */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-gray-700">
                                    <BookingQr booking={booking} size={140} />
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-1.5 text-primary dark:text-primary bg-primary/5 dark:bg-primary/10 px-3 py-1 rounded-full">
                                    <Shield size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{booking.status}</span>
                                </div>
                            </div>

                            {/* Details & Pricing */}
                            <div className="flex-1 w-full space-y-6">
                                {/* Identifiers */}
                                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Booking ID</p>
                                        <p className="text-xs font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">{booking.bookingId || booking.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Transaction ID</p>
                                        <p className="text-xs font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block truncate max-w-full" title={booking.payment?.transactionId || booking.transactionId}>
                                            {booking.payment?.transactionId || booking.transactionId || 'N/A'}
                                        </p>
                                    </div>
                                    {booking.user && (
                                        <div className="col-span-2">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5"><ShoppingBag size={10} /> Booked By</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{booking.user.name}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Clean Receipt */}
                                <div className="space-y-3">
                                    <ReceiptRow label="Tickets Subtotal" value={booking.pricing?.subtotal || booking.ticketPrice} />
                                    {!!booking.foodPrice && <ReceiptRow label="Food & Bev" value={booking.foodPrice} />}
                                    <ReceiptRow label="Convenience Fee" value={booking.pricing?.convenienceFee || booking.convenienceFee} />
                                    <ReceiptRow label="Taxes" value={booking.pricing?.gst || booking.tax} />
                                    {(booking.pricing?.discount > 0 || booking.discount > 0) && (
                                        <ReceiptRow label="Discount" value={-(booking.pricing?.discount || booking.discount)} isDiscount />
                                    )}
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Total</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Paid via {(booking.payment?.method || booking.paymentMethod)?.toUpperCase()}</p>
                                        </div>
                                        <span className="text-3xl font-black text-primary dark:text-primary tracking-tighter leading-none">
                                            ₹{(booking.pricing?.total || booking.totalAmount)?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Section (Conditional) */}
                {(() => {
                    if (!booking) return null;
                    const showDate = booking.showDate || booking.date;
                    const showTime = booking.showTime || booking.time;

                    const parseDateTime = (d, t) => {
                        if (!d) return null;
                        const date = new Date(d);
                        if (t) {
                            const [time, period] = t.toUpperCase().split(' ');
                            if (time && period) {
                                let [hours, minutes] = time.split(':').map(Number);
                                if (period === 'PM' && hours < 12) hours += 12;
                                if (period === 'AM' && hours === 12) hours = 0;
                                date.setHours(hours, minutes, 0, 0);
                            }
                        }
                        return date;
                    };

                    const bookingDateTime = parseDateTime(showDate, showTime);
                    const now = new Date();
                    const isPast = bookingDateTime && bookingDateTime < now;

                    if (!isPast) return null;

                    if (booking.isReviewed || justReviewed) {
                        return (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-[24px] p-6 border border-green-100 dark:border-green-800/30 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-3">
                                    <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Thanks for your review!</h3>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Your feedback helps others choose better movies.</p>
                            </div>
                        );
                    }

                    return (
                        <div className="bg-white dark:bg-gray-900 rounded-[24px] p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-black/30 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500 transition-colors duration-300">
                            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-6 ring-1 ring-amber-500/20">
                                <Star size={32} className="text-amber-500 fill-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">How was the movie?</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">Rate your experience to help our community.</p>
                             <button
                                onClick={() => setShowReviewModal(true)}
                                className="w-full max-w-xs h-14 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 dark:shadow-primary/30 hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Rate Movie
                            </button>
                        </div>
                    );
                })()}

                {/* Footer Actions */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 print:hidden flex justify-center">
                    <button
                        onClick={handleDownload}
                        className="w-full max-w-[200px] h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={14} /> Download Pass
                    </button>
                </div>

                {/* Review Modal */}
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    booking={booking}
                    onSuccess={handleReviewSuccess}
                />
                {/* 
                <div className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <Info size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-wide">
                        <span className="text-gray-900 font-black">Note:</span> Please show this QR at the entrance 15 mins before showtime.
                    </p>
                </div> */}
            </main>
        </div>
    );
};

const DetailItem = ({ icon, label, value, subValue, className = '' }) => (
    <div className={`space-y-1 ${className}`}>
        <p className="text-[9px] font-black text-primary dark:text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            {icon} {label}
        </p>
        <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight uppercase truncate">{value}</p>
            {subValue && <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-0.5">{subValue}</p>}
        </div>
    </div>
);

const ReceiptRow = ({ label, value, isDiscount }) => (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={isDiscount ? "text-green-500 dark:text-green-400" : "text-gray-900 dark:text-white"}>
            {isDiscount ? '-' : ''}₹{(value || 0).toLocaleString()}
        </span>
    </div>
);


// ErrorState removed - imported from components

export default BookingDetailsPage;
