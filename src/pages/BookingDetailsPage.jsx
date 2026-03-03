import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Shield, Info, Monitor, Calendar, MapPin, Armchair, ShoppingBag, Star, CheckCircle } from 'lucide-react';
import { getBookingDetails } from '../services/bookingService';
import { useData } from '../context/DataContext';
import SEO from '../components/SEO';
import BookingQr from '../components/BookingQr';
import ErrorState from '../components/ErrorState';
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

    if (loading) return <LoadingState />;
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
        <div className="min-h-screen bg-whiteSmoke pb-20">
            <SEO title={`Ticket - ${booking.movieTitle} | XYNEMA`} description="View your movie ticket" />

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100 print:hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-xs font-black text-gray-900 uppercase tracking-widest">E-Ticket</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Main Ticket Card */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 translate-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Movie Header Section */}
                    <div className="p-8 pb-0">
                        <div className="flex gap-6 items-start mb-0">
                            <div className="w-24 aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-gray-100 shrink-0">
                                <img
                                    src={booking.posterUrl || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image'}
                                    className="w-full h-full object-cover"
                                    alt={booking.movieTitle}
                                />
                            </div>
                            <div className="flex-1 pt-2">
                                <h2 className="text-2xl font-black tracking-tighter uppercase text-gray-900 leading-tight mb-2">
                                    {booking.movieTitle}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 border border-gray-100 rounded uppercase tracking-widest">
                                        {booking.format || '2D'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 border border-gray-100 rounded uppercase tracking-widest">
                                        {booking.language}
                                    </span>
                                    {(booking.movie?.certification || booking.certification) && (
                                        <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 border border-gray-100 rounded uppercase tracking-widest">
                                            {booking.movie?.certification || booking.certification}
                                        </span>
                                    )}
                                    {(booking.movie?.duration || booking.duration) ? (
                                        <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 border border-gray-100 rounded uppercase tracking-widest">
                                            {Math.floor((booking.movie?.duration || booking.duration) / 60)}h {(booking.movie?.duration || booking.duration) % 60}m
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section - Integrated */}
                        <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center border border-gray-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <Shield size={16} className="text-green-500/20" />
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 ring-1 ring-gray-100 transition-transform group-hover:scale-105 duration-500">
                                <BookingQr booking={booking} size={160} />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-[14px] font-black text-charcoalSlate font-mono uppercase tracking-tight bg-white px-3 py-1 rounded-lg ring-1 ring-gray-100 inline-block shadow-sm">
                                    {booking.bookingId || booking.id}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Perforation Line */}
                    <div className="relative h-10 flex items-center justify-between pointer-events-none">
                        <div className="w-6 h-10 bg-whiteSmoke rounded-r-full border-y border-r border-gray-100 -ml-1" />
                        <div className="flex-1 border-t-2 border-dashed border-gray-100 mx-4" />
                        <div className="w-6 h-10 bg-whiteSmoke rounded-l-full border-y border-l border-gray-100 -mr-1" />
                    </div>

                    {/* Details Section */}
                    <div className="p-8 pt-0 space-y-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                            {/* Theater - Full Width */}
                            <DetailItem className="col-span-2" icon={<MapPin size={12} />} label="Theater" value={booking.theatre?.theatreName || booking.theaterName} />

                            {/* Date & Time - Split */}
                            <DetailItem icon={<Calendar size={12} />} label="Date" value={bookingDate} />
                            <DetailItem icon={<Calendar size={12} />} label="Time" value={bookingTime} />

                            {/* Screen & Seats - Split */}
                            <DetailItem icon={<Monitor size={12} />} label="Screen" value={booking.screen?.screenName || booking.screen || '1'} />
                            <DetailItem icon={<Armchair size={12} />} label="Seats" value={getSeatString()} subValue={`${booking.totalSeats || booking.seats?.length || 1} Tickets`} />

                            {/* User Info - Full Width */}
                            {booking.user && (
                                <div className="col-span-2 pt-4 border-t border-dashed border-gray-100">
                                    <DetailItem icon={<ShoppingBag size={12} />} label="Booked By" value={booking.user.name} subValue={booking.user.email} />
                                </div>
                            )}
                        </div>

                        {/* Detailed Receipt View */}
                        <div className="pt-8 border-t border-gray-50 space-y-4">
                            <div className="space-y-2">
                                <ReceiptRow label="Subtotal" value={booking.pricing?.subtotal || booking.ticketPrice} />
                                <ReceiptRow label="Convenience Fee" value={booking.pricing?.convenienceFee || booking.convenienceFee} />
                                <ReceiptRow label="GST" value={booking.pricing?.gst || booking.tax} />
                                {(booking.pricing?.discount > 0 || booking.discount > 0) && (
                                    <ReceiptRow label="Discount" value={-(booking.pricing?.discount || booking.discount)} isDiscount />
                                )}
                            </div>
                            <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                                        TXN ID: <span className="text-gray-400">{booking.payment?.transactionId || booking.transactionId || 'N/A'}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-xynemaRose tracking-tighter">₹{(booking.pricing?.total || booking.totalAmount)?.toLocaleString()}</span>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Paid via {(booking.payment?.method || booking.paymentMethod)?.toUpperCase()}</p>
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
                            <div className="bg-green-50 rounded-[24px] p-6 border border-green-100 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                    <CheckCircle size={24} className="text-green-600" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Thanks for your review!</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Your feedback helps others choose better movies.</p>
                            </div>
                        );
                    }

                    return (
                        <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-xl shadow-gray-200/30 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="w-16 h-16 rounded-3xl bg-xynemaRose/5 flex items-center justify-center mb-6 ring-1 ring-xynemaRose/10">
                                <Star size={32} className="text-xynemaRose fill-xynemaRose" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">How was the movie?</h3>
                            <p className="text-xs text-gray-500 mt-1 mb-6">Rate your experience to help our community.</p>
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="w-full max-w-xs h-14 rounded-2xl bg-xynemaRose text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-xynemaRose/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Rate Movie
                            </button>
                        </div>
                    );
                })()}

                {/* Footer Actions */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 print:hidden">
                    <button
                        onClick={handleDownload}
                        className="w-full h-14 rounded-2xl bg-xynemaRose text-white text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-xynemaRose/10 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Download size={14} /> Download Ticket
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
    <div className={`space-y-1.5 ${className}`}>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            {icon} {label}
        </p>
        <div>
            <p className="text-sm font-bold text-gray-900 leading-tight uppercase truncate">{value}</p>
            {subValue && <p className="text-[10px] font-bold text-xynemaRose uppercase mt-0.5">{subValue}</p>}
        </div>
    </div>
);

const ReceiptRow = ({ label, value, isDiscount }) => (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
        <span className="text-gray-400">{label}</span>
        <span className={isDiscount ? "text-green-500" : "text-gray-900"}>
            {isDiscount ? '-' : ''}₹{(value || 0).toLocaleString()}
        </span>
    </div>
);

const LoadingState = () => (
    <div className="min-h-screen bg-whiteSmoke flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-xynemaRose animate-spin" />
        <div className="text-center font-display">
            <p className="text-xynemaRose font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Ticket Readying</p>
        </div>
    </div>
);

// ErrorState removed - imported from components

export default BookingDetailsPage;
