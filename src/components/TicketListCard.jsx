import React from 'react';
import { useNavigate } from 'react-router-dom';
import { optimizeImage } from '../utils/helpers';

// ─────────────────────────────────────
// SVG Ticket Shape Background Component
// ─────────────────────────────────────
const TicketBackground = () => (
    <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
        viewBox="0 0 340 500" 
        preserveAspectRatio="none"
    >
        {/* Ticket Outer Path with Concave Cutouts */}
        <path 
            d="M 0 16 A 16 16 0 0 1 16 0 L 20 0 A 12 12 0 0 0 44 0 L 158 0 A 12 12 0 0 0 182 0 L 296 0 A 12 12 0 0 0 320 0 L 324 0 A 16 16 0 0 1 340 16 L 340 348 A 12 12 0 0 0 340 372 L 340 484 A 16 16 0 0 1 324 500 L 16 500 A 16 16 0 0 1 0 484 L 0 372 A 12 12 0 0 0 0 348 Z" 
            className="fill-white dark:fill-[#1a1c23] stroke-gray-200 dark:stroke-gray-800" 
            strokeWidth="1.5"
        />
        {/* Perforated Dashed Divider Line */}
        <line 
            x1="24" 
            y1="360" 
            x2="316" 
            y2="360" 
            className="stroke-gray-300 dark:stroke-gray-700" 
            strokeWidth="1.5" 
            strokeDasharray="6,6" 
        />
    </svg>
);

// ─────────────────────────────────────
// Barcode Generator Helper
// ─────────────────────────────────────
const renderBarcode = () => {
    const code = '11010010000100111011001011101111011010001110101110011001101110010010111101110111001011001001000011011000111010110001001110111101101001011010111000101101';
    return (
        <div className="flex h-11 w-full items-stretch justify-center bg-white p-1.5 rounded border border-gray-200 dark:border-gray-700">
            {code.split('').map((char, index) => (
                <div
                    key={index}
                    className={`flex-grow ${char === '1' ? 'bg-black' : 'bg-white'}`}
                />
            ))}
        </div>
    );
};

// ─────────────────────────────────────
// 1. Movie Ticket Card (Dribbble Vintage)
// ─────────────────────────────────────
const MovieTicketCard = ({ booking }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch { return dateStr; }
    };

    const getSeatDetails = () => {
        const seats = booking.seats || [];
        if (!seats.length) return { row: 'A', seat: '12' };
        const first = seats[0];
        if (typeof first === 'object') {
            const row = first.row || 'A';
            const seatLabels = seats.map(s => s.seatLabel || s.seatNumber || s.number).join(', ');
            return { row, seat: seatLabels };
        }
        if (typeof first === 'string') {
            const match = first.match(/^([A-Za-z]+)(\d+)$/);
            if (match) {
                const row = match[1];
                const seatLabels = seats.join(', ');
                return { row, seat: seatLabels };
            }
            return { row: 'A', seat: seats.join(', ') };
        }
        return { row: 'A', seat: String(seats) };
    };

    const { row, seat } = getSeatDetails();
    const isCancelled = booking.status?.toLowerCase() === 'cancelled' || booking.slots?.every(slot => slot.status?.toLowerCase() === 'cancelled') || booking.cancellation?.isCancelled === true;


    return (
        <div
            onClick={() => navigate(`/bookings/${booking.id}`)}
            className="relative w-full max-w-[340px] h-[500px] mx-auto filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:drop-shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all duration-300 select-none cursor-pointer group flex flex-col justify-between bg-transparent"
        >
            {/* SVG Shaped Border and Background */}
            <TicketBackground />

            {/* Top Content Area (y: 0 to 348) */}
            <div className="relative z-10 pt-8 px-6 pb-2 h-[348px] flex flex-col justify-between">
                {/* Title Section */}
                <div className="text-center">
                    <p className="text-[10px] font-black tracking-widest text-primary uppercase truncate max-w-[280px] mx-auto">
                        {booking.theaterName || 'Xynema Cinema'} Presents
                    </p>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase leading-tight font-roboto tracking-tight mt-1 truncate">
                        {booking.movieTitle}
                    </h3>
                </div>

                {/* Poster Frame */}
                <div className="px-1 py-1">
                    <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                        <img
                            src={optimizeImage(booking.landscapePosterUrl || booking.portraitPosterUrl || booking.posterUrl, { width: 600, quality: 75 }) || 'https://placehold.co/400x250/f0f0f5/999?text=Movie'}
                            alt={booking.movieTitle}
                            className={`w-full h-full object-cover transition-transform duration-500 ${isCancelled ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
                        />
                        
                        {/* Cancelled Stamp */}
                        {isCancelled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-lg tracking-[0.2em] transform -rotate-12 border-2 border-white">
                                    CANCELLED
                                </span>
                            </div>
                        )}
                    </div>
                    {/* <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                        <img
                            src={optimizeImage(booking.landscapePosterUrl || booking.portraitPosterUrl || booking.posterUrl, { width: 600, quality: 75 }) || 'https://placehold.co/400x250/f0f0f5/999?text=Movie'}
                            alt={booking.movieTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div> */}
                </div>

                {/* Ticket Info Area */}
                <div className="flex flex-col gap-3 font-roboto">
                    {/* Row 1 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Screen</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase mt-0.5">{booking.screen || '01'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Row</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase mt-0.5">{row}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Seat</p>
                            <p className="text-lg font-black text-primary dark:text-primary uppercase mt-0.5 truncate max-w-[90px]">{seat}</p>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Price</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">₹{Math.round(booking.totalAmount || 0)?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Date</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">{formatDate(booking.date)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Time</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">{booking.time || '19:30'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer / Divider Section (y: 348 to 372) */}
            <div className="h-6 relative z-10 pointer-events-none" />

            {/* Bottom Content Area (y: 372 to 500) */}
            <div className="relative z-10 px-6 pb-6 pt-1 h-[128px] flex flex-col justify-center items-center w-full">
                 <button
                    className={`w-full py-4 text-[10px] sm:text-[11px] font-black rounded-md transition-all duration-300 font-roboto tracking-widest uppercase flex items-center justify-center gap-2 ${
                        isCancelled 
                        ? 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' 
                        : 'bg-primary text-white shadow-md shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] group-hover:scale-[1.01] group-hover:bg-primary/95'
                    }`}
                >
                    {isCancelled ? 'View Details' : 'View Ticket'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────
// 2. Event Ticket Card (Dribbble Vintage)
// ─────────────────────────────────────
const EventTicketCard = ({ booking }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch { return dateStr; }
    };

    const ticketCount = booking.tickets?.reduce((acc, t) => acc + (t.quantity || 0), 0) || booking.quantity || 1;
    const ticketClass = booking.ticketClass || booking.qrShows?.[0]?.ticketClassName || (booking.tickets?.[0]?.ticketClass) || 'Standard';

    // Pricing parsing
    const totalPrice = booking.pricing?.totalAmount || booking.totalAmount || 0;
    const currencySymbol = booking.pricing?.currency === 'INR' || booking.currency === 'INR' || !booking.pricing?.currency ? '₹' : (booking.pricing?.currency || booking.currency);

    // Event Image parsing
    const primaryImage = booking.eventDetails?.eventImages?.find(img => img.isPrimary)?.url || booking.eventDetails?.eventImages?.[0]?.url || booking.eventPoster || booking.posterUrl || booking.imageUrl;

    // Venue parsing
    const presenterVenue = (
        (typeof booking.venue === 'string' && booking.venue) || 
        booking.venue?.venueName || 
        booking.venue?.name || 
        booking.venueName || 
        booking.eventDetails?.location?.venue || 
        'Xynema Live'
    );
    const isCancelled = booking.bookingStatus?.toLowerCase() === 'cancelled' || booking.status?.toLowerCase() === 'cancelled' || booking.slots?.every(slot => slot.status?.toLowerCase() === 'cancelled') || booking.cancellation?.isCancelled === true;

    return (
        <div
            onClick={() => navigate(`/event-bookings/${booking.bookingId}`)}
            className="relative w-full max-w-[340px] h-[500px] mx-auto filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:drop-shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all duration-300 select-none cursor-pointer group flex flex-col justify-between bg-transparent"
        >
            {/* SVG Shaped Border and Background */}
            <TicketBackground />

            {/* Top Content Area (y: 0 to 348) */}
            <div className="relative z-10 pt-8 px-6 pb-2 h-[348px] flex flex-col justify-between">
                {/* Title Section */}
                <div className="text-center">
                    <p className="text-[10px] font-black tracking-widest text-primary uppercase truncate max-w-[280px] mx-auto">
                        {presenterVenue} Presents
                    </p>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase leading-tight font-roboto tracking-tight mt-1 truncate">
                        {booking.eventName}
                    </h3>
                </div>

                {/* Poster Frame */}
                <div className="px-1 py-1">
                    <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                        <img
                            src={optimizeImage(primaryImage, { width: 600, quality: 75 }) || 'https://placehold.co/400x250/f0f0f5/999?text=Event'}
                            alt={booking.eventName}
                            className={`w-full h-full object-cover transition-transform duration-500 ${isCancelled ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
                        />
                        
                        {/* Cancelled Stamp */}
                        {isCancelled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-lg tracking-[0.2em] transform -rotate-12 border-2 border-white">
                                    CANCELLED
                                </span>
                            </div>
                        )}
                    </div>
                    {/* <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                        <img
                            src={optimizeImage(primaryImage, { width: 600, quality: 75 }) || 'https://placehold.co/400x250/f0f0f5/999?text=Event'}
                            alt={booking.eventName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div> */}
                </div>

                {/* Ticket Info Area */}
                <div className="flex flex-col gap-3 font-roboto">
                    {/* Row 1 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Class</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase mt-0.5 truncate">{ticketClass}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Row</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase mt-0.5">GEN</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Qty</p>
                            <p className="text-lg font-black text-primary dark:text-primary uppercase mt-0.5">{ticketCount}</p>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Total</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">
                                {currencySymbol}{Math.round(totalPrice || 0)?.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Date</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">{formatDate(booking.showDate)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Time</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">{booking.showTime || '18:00'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer / Divider Section (y: 348 to 372) */}
            <div className="h-6 relative z-10 pointer-events-none" />

            {/* Bottom Content Area (y: 372 to 500) */}
            <div className="relative z-10 px-6 pb-6 pt-1 h-[128px] flex flex-col justify-center items-center w-full">
                 <button
                    className={`w-full py-4 text-[10px] sm:text-[11px] font-black rounded-md transition-all duration-300 font-roboto tracking-widest uppercase flex items-center justify-center gap-2 ${
                        isCancelled 
                        ? 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' 
                        : 'bg-primary text-white shadow-md shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] group-hover:scale-[1.01] group-hover:bg-primary/95'
                    }`}
                >
                    {isCancelled ? 'View Details' : 'View Ticket'}
                </button>
                {/* <button
                    className="w-full py-4 bg-primary text-white text-[10px] sm:text-[11px] font-black rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 font-roboto tracking-widest hover:brightness-110 active:scale-[0.97] uppercase flex items-center justify-center gap-2 group-hover:scale-[1.01] group-hover:bg-primary/95"
                >
                    View Ticket
                </button> */}
            </div>
        </div>
    );
};

// ─────────────────────────────────────
// 3. Turf Ticket Card (Dribbble Vintage)
// ─────────────────────────────────────
const TurfTicketCard = ({ booking }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch { return dateStr; }
    };

    const firstSlot = booking.slots?.[0];
    const bookingDate = booking.snapshot?.date || firstSlot?.date || booking.showDate || booking.date;
    const startTime = booking.snapshot?.startTime || firstSlot?.startTime || booking.showTime;
    const turfName = booking.turf?.turfName || booking.turfName || booking.eventName || 'Sports Arena';
    const courtName = booking.court?.courtName || booking.courtName || booking.venue?.venueName || booking.venue?.name || 'Main Arena';
    const amount = booking.paymentInfo?.totalAmount || booking.paymentSummary?.totalAmount || booking.snapshot?.totalPriceWithFee || booking.payment?.amount || booking.totalPrice || booking.totalAmount || 0;
    const primaryImage = booking.turf?.primaryImage?.url || booking.turf?.images?.[0]?.url || booking.turfImage || booking.courtImage || booking.eventPoster || booking.eventDetails?.eventImages?.[0]?.url || booking.posterUrl;
    const paymentStatus = booking.paymentInfo?.paymentStatus || booking.paymentSummary?.paymentStatus || booking.payment?.status;
    const isCancelled = booking.status?.toLowerCase() === 'cancelled' || booking.slots?.every(slot => slot.status?.toLowerCase() === 'cancelled') || booking.cancellation?.isCancelled === true;

    return (
        <div
            onClick={() => navigate(booking.turf ? `/activities/bookings/${booking.bookingId || booking._id || booking.id}` : `/event-bookings/${booking.bookingId || booking._id || booking.id}`)}
            className="relative w-full max-w-[340px] h-[500px] mx-auto filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:drop-shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all duration-300 select-none cursor-pointer group flex flex-col justify-between bg-transparent"
        >
            {/* SVG Shaped Border and Background */}
            <TicketBackground />

            {/* Top Content Area (y: 0 to 348) */}
            <div className="relative z-10 pt-8 px-6 pb-2 h-[348px] flex flex-col justify-between">
                {/* Title Section */}
                <div className="text-center">
                    <p className="text-[10px] font-black tracking-widest text-primary uppercase truncate max-w-[280px] mx-auto">
                        {booking.turf?.turfName || booking.turfName || 'Xynema Arena'} Presents
                    </p>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase leading-tight font-roboto tracking-tight mt-1 truncate">
                        {turfName}
                    </h3>
                </div>

                {/* Poster Frame */}
                <div className="px-1 py-1">
                    <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                        <img
                            src={optimizeImage(primaryImage, { width: 600, quality: 75 }) || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600'}
                            alt={turfName}
                            className={`w-full h-full object-cover transition-transform duration-500 ${isCancelled ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
                        />
                        
                        {/* Cancelled Stamp */}
                        {isCancelled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-lg tracking-[0.2em] transform -rotate-12 border-2 border-white">
                                    CANCELLED
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket Info Area */}
                <div className="flex flex-col gap-3 font-roboto">
                    {/* Row 1 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Court</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase mt-0.5 truncate">{courtName}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Sport</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-200 uppercase mt-0.5 truncate">{booking.sportType || 'Sports'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Slots</p>
                            <p className="text-lg font-black text-primary dark:text-primary uppercase mt-0.5">{(booking.slots?.length) || 1}</p>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Price</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">₹{Math.round(amount || 0)?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Date</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">{formatDate(bookingDate)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Time</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">{startTime || 'All Day'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer / Divider Section (y: 348 to 372) */}
            <div className="h-6 relative z-10 pointer-events-none" />

            {/* Bottom Content Area (y: 372 to 500) */}
            <div className="relative z-10 px-6 pb-6 pt-1 h-[128px] flex justify-between items-center w-full gap-3">
                {paymentStatus && (paymentStatus.toLowerCase() === 'paid' || paymentStatus.toLowerCase() === 'partial') && (
                    <div className={`flex flex-col items-center justify-center px-4 h-12 rounded-md border select-none transition-all duration-300 ${
                        paymentStatus.toLowerCase() === 'paid'
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[0_2px_12px_rgba(16,185,129,0.08)]'
                            : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-[0_2px_12px_rgba(245,158,11,0.08)]'
                    }`}>
                        <span className="text-[7.5px] font-black tracking-widest uppercase opacity-80 leading-none">
                            {paymentStatus.toLowerCase() === 'paid' ? 'Paid' : 'Partial'}
                        </span>
                        <span className="text-[10px] font-black uppercase mt-0.5 font-mono">
                            {paymentStatus.toLowerCase() === 'paid' ? '100%' : '50%'}
                        </span>
                    </div>
                )}
                <button
                    className={`flex-grow py-4 text-[10px] sm:text-[11px] font-black rounded-md transition-all duration-300 font-roboto tracking-widest uppercase flex items-center justify-center gap-2 ${
                        isCancelled 
                        ? 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' 
                        : 'bg-primary text-white shadow-md shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] group-hover:scale-[1.01] group-hover:bg-primary/95'
                    }`}
                >
                    {isCancelled ? 'View Details' : 'View Ticket'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────
// 4. Park Ticket Card (Dribbble Vintage)
// ─────────────────────────────────────
const ParkTicketCard = ({ booking }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
        } catch { return dateStr; }
    };

    const parkName = booking.park?.parkName || booking.parkName || 'Amusement Park';
    const bookingDate = booking.date || booking.bookingDay?.date || booking.bookingDate;
    const amount = booking.pricing?.totalAmount || booking.amount || booking.totalPrice || booking.paidAmount || 0;
    const bookingRef = booking.bookingRef || booking.id || booking._id;
    const primaryImage = booking.park?.parkImage?.url || booking.parkImage?.url || 'https://images.unsplash.com/photo-1513889959013-c2845acbaf3d?auto=format&fit=crop&q=80&w=600';
    const isCancelled = booking.bookingStatus?.toLowerCase() === 'cancelled' || booking.status?.toLowerCase() === 'cancelled' || booking.slots?.every(slot => slot.status?.toLowerCase() === 'cancelled') || booking.cancellation?.isCancelled === true;


    return (
        <div
            onClick={() => navigate(`/activities/park-bookings/${bookingRef}`)}
            className="relative w-full max-w-[340px] h-[500px] mx-auto filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:drop-shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all duration-300 select-none cursor-pointer group flex flex-col justify-between bg-transparent"
        >
            {/* SVG Shaped Border and Background */}
            <TicketBackground />

            {/* Top Content Area (y: 0 to 348) */}
            <div className="relative z-10 pt-8 px-6 pb-2 h-[348px] flex flex-col justify-between">
                {/* Title Section */}
                <div className="text-center">
                    <p className="text-[10px] font-black tracking-widest text-primary uppercase truncate max-w-[280px] mx-auto">
                        {booking.park?.parkName || booking.parkName || 'Xynema Park'} Presents
                    </p>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase leading-tight font-roboto tracking-tight mt-1 truncate">
                        {parkName}
                    </h3>
                </div>

                {/* Poster Frame */}
                <div className="px-1 py-1">
                    <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                        <img
                            src={optimizeImage(primaryImage, { width: 600, quality: 75 }) || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600'}
                            alt={parkName}
                            className={`w-full h-full object-cover transition-transform duration-500 ${isCancelled ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
                        />
                        
                        {/* Cancelled Stamp */}
                        {isCancelled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-lg tracking-[0.2em] transform -rotate-12 border-2 border-white">
                                    CANCELLED
                                </span>
                            </div>
                        )}
                    </div>
                    {/* <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                        <img
                            src={optimizeImage(primaryImage, { width: 600, quality: 75 })}
                            alt={parkName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div> */}
                </div>

                {/* Ticket Info Area */}
                <div className="flex flex-col gap-3 font-roboto">
                    {/* Row 1 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Pass</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-250 uppercase mt-0.5">ENTRY</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Row</p>
                            <p className="text-lg font-black text-gray-800 dark:text-gray-250 uppercase mt-0.5">PARK</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Qty</p>
                            <p className="text-lg font-black text-primary dark:text-primary uppercase mt-0.5">{booking.quantity || 1}</p>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Total</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">₹{Math.round(amount || 0)?.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Date</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">{formatDate(bookingDate)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">Time</p>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-300 mt-0.5">09:00 AM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer / Divider Section (y: 348 to 372) */}
            <div className="h-6 relative z-10 pointer-events-none" />

            {/* Bottom Content Area (y: 372 to 500) */}
            <div className="relative z-10 px-6 pb-6 pt-1 h-[128px] flex flex-col justify-center items-center w-full">
                <button
                    className={`flex w-full py-4 text-[10px] sm:text-[11px] font-black rounded-md transition-all duration-300 font-roboto tracking-widest uppercase flex items-center justify-center gap-2 ${
                        isCancelled 
                        ? 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' 
                        : 'bg-primary text-white shadow-md shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] group-hover:scale-[1.01] group-hover:bg-primary/95'
                    }`}
                >
                    {isCancelled ? 'View Details' : 'View Ticket'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────
// Unified Compound Component Export
// ─────────────────────────────────────
const TicketListCard = ({ type, booking }) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
        case 'movie':
        case 'movies':
            return <MovieTicketCard booking={booking} />;
        case 'event':
        case 'events':
            return <EventTicketCard booking={booking} />;
        case 'sport':
        case 'sports':
        case 'turf':
            return <TurfTicketCard booking={booking} />;
        case 'park':
        case 'parks':
            return <ParkTicketCard booking={booking} />;
        default:
            return null;
    }
};

TicketListCard.Movie = MovieTicketCard;
TicketListCard.Event = EventTicketCard;
TicketListCard.Turf = TurfTicketCard;
TicketListCard.Park = ParkTicketCard;

export default TicketListCard;
