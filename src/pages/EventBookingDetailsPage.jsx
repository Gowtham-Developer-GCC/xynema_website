import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Shield, Info, MapPin, Ticket, Calendar, Clock, ShoppingBag } from 'lucide-react';
import { getEventBookingDetails } from '../services/eventService';
import SEO from '../components/SEO';
import ErrorState from '../components/ErrorState';
import LoadingScreen from '../components/LoadingScreen';

const EventBookingDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                setLoading(true);
                const response = await getEventBookingDetails(id);
                if (response) {
                    setBooking(response);
                } else {
                    throw new Error('Booking details not found');
                }
            } catch (err) {
                console.error("Error details:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [id]);

    const handleDownload = () => {
        window.print();
    };



    if (loading) return <LoadingScreen message="Ticket Readying" />;
    if (error) return <ErrorState error={error} onRetry={() => navigate('/bookings')} title="Ticket Not Found" buttonText="Go Back" />;

    const getDisplayDate = (dateStr) => {
        if (!dateStr) return 'TBD';
        try {
            // Standardize display by parsing local components to avoid timezone shifts
            const d = dateStr.includes('-') && !dateStr.includes('T')
                ? new Date(...dateStr.split('-').map((v, i) => i === 1 ? v - 1 : v))
                : new Date(dateStr);

            return d.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const eventData = booking.eventDetails || booking.event || {};
    const eventName = booking.eventName || eventData.eventName || eventData.heading || 'Untitled Event';
    const showDate = booking.showDate || eventData.showDate || '';
    const showTime = booking.showTime || eventData.showTime || '';
    const venue = booking.venue || eventData.venue || {};
    const venueName = venue.venueName || venue.name || 'Venue TBD';
    const venueCity = venue.city || 'City TBD';

    const bookingDate = getDisplayDate(showDate);
    const eventImages = eventData.eventImages || eventData.images || [];
    const primaryImageUrl = eventImages.find(img => img.isPrimary)?.url || eventImages[0]?.url;
    const heroImageUrl = primaryImageUrl || 'https://placehold.co/800x400';
    const posterImageUrl = primaryImageUrl || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image';

    const ticketClasses = booking.ticketClass
        ? [booking.ticketClass]
        : (booking.tickets?.map(t => t.ticketClass) || []);

    const totalQuantity = booking.quantity || booking.tickets?.reduce((acc, t) => acc + (t.quantity || 0), 0) || 0;
    const totalAmount = booking.totalPrice || booking.pricing?.totalAmount || 0;
    const subtotal = booking.totalPrice ? (booking.pricePerTicket * booking.quantity) : (booking.pricing?.subtotal || 0);
    const convenienceFee = booking.pricing?.convenienceFee || 0;
    const tax = booking.pricing?.tax || 0;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 pb-20 print:bg-white print:pb-0 transition-colors duration-300">
            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                }
            `}</style>
            <SEO title={`Event Ticket - ${eventName} | XYNEMA`} description="View your event ticket" />

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
                        <h1 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Event Pass</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Main High-Fidelity Ticket Card */}
                <div className="relative rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">

                    {/* Top Section: Hero Image & Event Info */}
                    <div className="relative w-full h-64 bg-gray-900 overflow-hidden">
                        {/* Immersive Background */}
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-105 opacity-60 contrast-125 saturate-150"
                            style={{ backgroundImage: `url(${heroImageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent flex flex-col justify-end p-8">
                            <div className="relative z-10 flex gap-6 items-end">
                                {/* Portrait Poster inset */}
                                <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20 shrink-0 transform translate-y-4">
                                    <img
                                        src={posterImageUrl}
                                        className="w-full h-full object-cover shadow-inner"
                                        alt={eventName}
                                    />
                                </div>
                                {/* Title and Type */}
                                <div className="flex-1 pb-2">
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-white leading-none mb-3 drop-shadow-md line-clamp-2">
                                        {eventName}
                                    </h2>
                                    <div className="flex flex-wrap gap-2 drop-shadow-sm">
                                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-[9px] font-black text-white rounded uppercase tracking-widest">
                                            {booking.eventType || eventData.eventType || 'Single Day'}
                                        </span>
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
                                    <Calendar size={12} /> Event Time
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{bookingDate}</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{showTime || '11:00'}</p>
                            </div>

                            {/* Location */}
                            <div className="col-span-2 sm:col-span-1 space-y-1 sm:text-right">
                                <p className="text-[10px] font-black text-primary dark:text-primary uppercase tracking-[0.2em] flex items-center sm:justify-end gap-2">
                                    <MapPin size={12} /> Venue
                                </p>
                                <p className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase line-clamp-2">{venueName}</p>
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-0.5">{venueCity}</p>
                            </div>

                            {/* Ticket Classes */}
                            <div className="col-span-2 bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 border border-primary/10 dark:border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary dark:text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Armchair size={12} /> Your Experience
                                    </p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                        {ticketClasses.join(', ') || 'Standard'}
                                    </p>
                                </div>
                                <div className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                    <span className="text-lg font-black text-gray-900 dark:text-white">
                                        {totalQuantity}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Tickets</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Structural Perforation Metaphor */}
                    <div className="relative flex items-center justify-between h-8 z-20 pointer-events-none">
                        {/* Left Cutout */}
                        <div className="absolute left-0 w-8 h-8 -translate-x-1/2 bg-whiteSmoke dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-800 shadow-[inset_-4px_0_8px_rgba(0,0,0,0.02)]" />

                        {/* Dashed Line */}
                        <div className="w-full border-t-2 border-dashed border-gray-200 dark:border-gray-800 mx-8" />

                        {/* Right Cutout */}
                        <div className="absolute right-0 w-8 h-8 translate-x-1/2 bg-whiteSmoke dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-800 shadow-[inset_4px_0_8px_rgba(0,0,0,0.02)]" />
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
                                    <span className="text-[10px] font-black uppercase tracking-widest">{booking.status || 'Verified'}</span>
                                </div>
                            </div>

                            {/* Details & Pricing */}
                            <div className="flex-1 w-full space-y-6">
                                {/* Identifiers */}
                                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Booking ID</p>
                                        <p className="text-xs font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                                            {booking.bookingId}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Transaction ID</p>
                                        <p className="text-xs font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block truncate max-w-full" title={booking.payment?.transactionId}>
                                            {booking.payment?.transactionId || 'N/A'}
                                        </p>
                                    </div>
                                    {booking.user && (
                                        <div className="col-span-2">
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5"><ShoppingBag size={10} /> Booked By</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{booking.user.name}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Clean Receipt */}
                                <div className="space-y-3">
                                    <ReceiptRow label="Experience Subtotal" value={subtotal} />
                                    <ReceiptRow label="Convenience Fee" value={convenienceFee} />
                                    <ReceiptRow label="GST & Taxes" value={tax} />
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Grand Total</p>
                                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Paid via {(booking.payment?.method)?.toUpperCase()}</p>
                                        </div>
                                        <span className="text-3xl font-black text-primary dark:text-primary tracking-tighter leading-none">
                                            {booking.pricing?.currency === 'INR' || !booking.pricing?.currency ? '₹' : booking.pricing?.currency}
                                            {totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 print:hidden flex justify-center">
                    <button
                        onClick={handleDownload}
                        className="w-full max-w-[200px] h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={14} /> Download Pass
                    </button>
                </div>
            </main>
            {/* <div className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 print:hidden">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                        <Info size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-wide">
                        <span className="text-gray-900 font-black">Entry Rule:</span> This pass is only valid for a single entry. Please have it ready for scanning at the venue gate.
                    </p>
                </div> */}
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
            {subValue && <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-0.5 truncate">{subValue}</p>}
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


export default EventBookingDetailsPage;
