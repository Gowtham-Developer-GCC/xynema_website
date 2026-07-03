import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Shield, Info, Monitor, Calendar, MapPin, Armchair, ShoppingBag, Star, CheckCircle, Ticket, Clock, CheckCircle2, X, AlertTriangle, Ban, RefreshCcw, Check, FileText } from 'lucide-react';
import { getBookingDetails } from '../services/bookingService';
import { getCancellationPolicy, cancelBooking } from '../services/cancellationService';
import CancellationModal from '../components/CancellationModal';
import { useData } from '../context/DataContext';
import SEO from '../components/SEO';
import BookingQr from '../components/BookingQr';
import ErrorState from '../components/ErrorState';
import LoadingScreen from '../components/LoadingScreen';
import ReviewModal from '../components/ReviewModal';
import apiCacheManager from '../services/apiCacheManager';
import { optimizeImage } from '../utils/helpers';

const BookingDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userBookings } = useData();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [justReviewed, setJustReviewed] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Cancellation States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRefundBreakdown, setShowRefundBreakdown] = useState(false);

    const hasFetched = useRef(false);
    const ticketRef = useRef(null);

    useEffect(() => {
        // Avoid re-fetching if we already have this booking in state
        if (booking && (booking.bookingId === id || booking.id === id)) {
            return;
        }

        if (hasFetched.current && booking) return;
        hasFetched.current = true;

        const fetchBookingDetails = async () => {
            try {
                setLoading(true);
                const response = await apiCacheManager.getOrFetchBookingDetails(id, () => getBookingDetails(id));
                if (response) {
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
    }, [id]);

    if (loading) return <LoadingScreen message="Ticket Readying" />;
    if (error) return <ErrorState error={error} onRetry={() => navigate('/bookings', { state: { activeTab: 'movies' } })} title="Ticket Missing" buttonText="My Bookings" />;

    const bookingDateRaw = booking.showDate || booking.date;
    const bookingDate = bookingDateRaw ? new Date(bookingDateRaw).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : 'TBD';

    const bookingTime = booking.showTime || booking.time || '';

    // Status and Refund Variables (Fixed extraction logic)
    const isCancelled = booking.status?.toLowerCase() === 'cancelled' || booking.cancellation?.isCancelled === true;
    const refundData = booking.cancellation?.refund || booking.cancellation || {};
    const refundStatus = refundData.status || booking.payment?.status || 'PENDING';
    const isRefunded = ['refunded', 'success', 'completed'].includes(refundStatus?.toLowerCase());
    const paidAmount = booking.pricing?.total || booking.totalAmount || 0;
    
    // Accurately targets the refundAmount ensuring it grabs 704 and doesn't default to 0
    const refundAmount = refundData.refundAmount || refundData.totalRefundAmount || 0;

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

    // Helper: Convert an image URL to base64 via our server proxy or direct fetch
    const fetchImageAsBase64 = async (url) => {
        if (!url || url.startsWith('data:')) return url;
        
        // Determine if it's an external URL that needs proxying
        const isExternal = url.startsWith('http') && !url.includes(window.location.host);
        
        try {
            if (isExternal) {
                const proxyUrl = `/__image_proxy?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) return null;
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } else {
                // Local image - fetch directly to avoid proxy overhead/limitations
                const response = await fetch(url);
                if (!response.ok) return null;
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }
        } catch (err) {
            console.error('[fetchImageAsBase64] Failed:', url, err);
            return null;
        }
    };

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        
        try {
            setIsDownloading(true);
            
            const [htmlToImageModule, jsPDFModule] = await Promise.all([
                import('html-to-image'),
                import('jspdf')
            ]);
            
            const toPng = htmlToImageModule.toPng || htmlToImageModule.default?.toPng;
            const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

            if (!toPng || !jsPDF) throw new Error('Download libraries failed to load');
            
            const element = ticketRef.current;
            const originalWidth = element.style.width;
            
            // Force a stable width for capture to prevent responsive shifting
            if (window.innerWidth < 768) {
                element.style.width = '700px';
            }

            // Step 1: Pre-convert ALL images to inline base64
            const images = [...element.getElementsByTagName('img')];
            const originalSrcs = [];

            for (const img of images) {
                const originalSrc = img.src;
                originalSrcs.push({ img, src: originalSrc });
                
                if (originalSrc && !originalSrc.startsWith('data:')) {
                    const base64 = await fetchImageAsBase64(originalSrc);
                    if (base64) {
                        img.src = base64;
                    }
                }
            }

            // Step 1.5: Convert QR Canvas to static Image for reliable PDF capture
            const canvases = [...element.getElementsByTagName('canvas')];
            const canvasReplacements = [];
            for (const canvas of canvases) {
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.style.width = canvas.style.width || (canvas.width / 2) + 'px';
                    img.style.height = canvas.style.height || (canvas.height / 2) + 'px';
                    img.className = canvas.className;
                    canvas.parentNode.insertBefore(img, canvas);
                    canvas.style.display = 'none';
                    canvasReplacements.push({ canvas, img });
                } catch (e) {
                    console.warn("Canvas capture error", e);
                }
            }

            // Step 2: Wait for all swapped assets to settle in DOM
            await new Promise(resolve => setTimeout(resolve, 500));

            const captureWidth = element.offsetWidth;
            const captureHeight = element.offsetHeight;

            // Step 3: Capture the ticket with high-fidelity settings
            const dataUrl = await toPng(element, {
                pixelRatio: 3, // High resolution
                backgroundColor: '#ffffff',
                cacheBust: true,
                skipFonts: false,
                style: {
                    transform: 'none',
                    borderRadius: '0px'
                },
                filter: (node) => {
                    // Filter out elements that shouldn't be in the PDF
                    if (node.classList && node.classList.contains('print:hidden')) return false;
                    return true;
                }
            });

            // Step 4: Restore original state
            // Restore images
            for (const { img, src } of originalSrcs) {
                img.src = src;
            }
            // Restore canvases
            for (const { canvas, img } of canvasReplacements) {
                canvas.style.display = '';
                img.remove();
            }
            // Restore width
            element.style.width = originalWidth;
            
            // Step 5: Generate PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [captureWidth, captureHeight]
            });
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, captureWidth, captureHeight);
            pdf.save(`XYNEMA-Ticket-${booking.bookingId || booking.id}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleReviewSuccess = () => {
        setJustReviewed(true);
        setShowReviewModal(false);
    };

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 pb-20 transition-colors duration-300 print:bg-white print:p-0">
            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    
                    header, footer, nav, .print\\:hidden, button { 
                        display: none !important; 
                    }

                    main, #root, #root > div {
                        display: block !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .max-w-3xl {
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }

                    .rounded-\\[40px\\] { 
                        border-radius: 24px !important; 
                        border: 1px solid #e5e7eb !important; 
                        box-shadow: none !important; 
                        margin: 0 auto !important;
                        max-width: 650px !important;
                        overflow: hidden !important;
                        background: white !important;
                    }

                    .opacity-60 { opacity: 1 !important; }
                    img { display: block !important; max-width: 100%; border-radius: 0 !important; }
                }
            `}</style>
            <SEO title={`Ticket - ${booking.movieTitle || booking.movie?.MovieName} | XYNEMA`} description="View your movie ticket" />

            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 print:hidden transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/bookings', { state: { activeTab: 'movies' } })}
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

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Success Banner - Only show on direct redirect after booking */}
                {location.state?.isNewBooking && !isCancelled && (
                    <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Booking Confirmed!</h2>
                        <p className="text-gray-500 dark:text-gray-400 uppercase text-[10px] font-black tracking-widest">Your ticket is ready for scanning</p>
                    </div>
                )}

                {/* Main High-Fidelity Ticket Card */}
                <div ref={ticketRef} className="relative rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">

                    {/* Top Section: Hero Image & Movie Info */}
                    <div className="relative w-full h-56 bg-gray-900 overflow-hidden">
                        <img
                            src={optimizeImage(booking.movie?.landscapePosterUrl?.url || booking.landscapePosterUrl || booking.portraitPosterUrl || booking.posterUrl, { width: 1200, quality: 75 })}
                            className="absolute inset-0 w-full h-full object-cover scale-105 opacity-60 contrast-125 saturate-150"
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent flex flex-col justify-end p-8">
                            <div className="relative z-10 flex gap-6 items-end">
                                {/* Portrait Poster inset */}
                                <div className="w-32 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20 shrink-0 transform translate-y-4">
                                    <img
                                        src={optimizeImage(booking.movie?.portraitPosterUrl?.url || booking.portraitPosterUrl || booking.posterUrl, { width: 300, quality: 80 }) || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image'}
                                        className="w-full h-full object-cover shadow-inner"
                                        alt={booking.movieTitle || booking.movie?.MovieName}
                                    />
                                </div>
                                {/* Title and Tags */}
                                <div className="flex-1 pb-2">
                                    <h2 className="text-3xl font-black tracking-tighter uppercase text-white leading-none mb-3">
                                        {booking.movieTitle || booking.movie?.MovieName}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 bg-white/25 text-[9px] font-black text-white rounded uppercase tracking-widest">
                                            {booking.format || '2D'}
                                        </span>
                                        <span className="px-2.5 py-1 bg-white/25 text-[9px] font-black text-white rounded uppercase tracking-widest">
                                            {Array.isArray(booking.movieLanguage) ? booking.movieLanguage.join(', ') : booking.movieLanguage}
                                        </span>
                                        {(booking.movie?.certification || booking.certification) && (
                                            <span className="px-2.5 py-1 bg-white/25 text-[9px] font-black text-white rounded uppercase tracking-widest">
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
                                <p className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase line-clamp-2">{booking.theatre?.theatreName || booking.theatre?.theaterName || booking.theaterName}</p>
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
                        <div className="absolute left-0 w-8 h-8 -translate-x-1/2 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-800 shadow-[inset_-4px_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_-4px_0_8px_rgba(0,0,0,0.2)]" />
                        <div className="w-full border-t-2 border-dashed border-gray-200 dark:border-gray-800 mx-8" />
                        <div className="absolute right-0 w-8 h-8 translate-x-1/2 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-gray-100 dark:border-gray-800 shadow-[inset_4px_0_8px_rgba(0,0,0,0.02)] dark:shadow-[inset_4px_0_8px_rgba(0,0,0,0.2)]" />
                    </div>

                    {/* Bottom Section: QR, Pricing, & IDs */}
                    <div className="p-8 pt-6 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">

                            {/* Verification Block with Attractive Cancelled Stamp */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className={`relative bg-white p-3 rounded-2xl overflow-hidden transition-all ${isCancelled ? 'border border-red-200 dark:border-red-900/50 shadow-sm' : 'shadow-xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-gray-700'}`}>
                                    
                                    {/* QR Code Container (Blurred if cancelled) */}
                                    <div className={isCancelled ? 'blur-[3px] opacity-40 grayscale pointer-events-none transition-all duration-300' : ''}>
                                        <BookingQr booking={booking} size={140} />
                                    </div>
                                    
                                    {/* High Visual Cancelled Vector Stamp */}
                                    {isCancelled && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                            <div className="border-[4px] border-red-600 text-red-600 rounded-xl px-5 py-2 transform -rotate-[15deg] flex flex-col items-center justify-center shadow-2xl bg-white/95 dark:bg-gray-900/95 ring-4 ring-red-600/20 backdrop-blur-sm">
                                                <Ban className="w-8 h-8 mb-1 opacity-90" strokeWidth={3} />
                                                <span className="text-[15px] font-black tracking-[0.2em] uppercase leading-none">Cancelled</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Status Pill below QR */}
                                <div className={`mt-4 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full font-black uppercase tracking-widest text-[10px] ${isCancelled ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500' : 'text-primary dark:text-primary bg-primary/5 dark:bg-primary/10'}`}>
                                    {isCancelled ? <X size={12} strokeWidth={3} /> : <Shield size={12} />}
                                    <span>{isCancelled ? 'Cancelled' : booking.status}</span>
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
                                    {((booking.pricing?.foodSubtotal > 0) || !!booking.foodPrice) && (
                                        <ReceiptRow label="Food & Bev" value={booking.pricing?.foodSubtotal || booking.foodPrice} />
                                    )}
                                    <ReceiptRow label="Convenience Fee" value={booking.pricing?.convenienceFee || booking.convenienceFee} />
                                    <ReceiptRow label="Taxes" value={booking.pricing?.gst || booking.tax} />
                                    {(booking.pricing?.discount > 0 || booking.discount > 0) && (
                                        <ReceiptRow label="Discount" value={-(booking.pricing?.discount || booking.discount)} isDiscount />
                                    )}
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Total</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Paid via {(booking.payment?.method || booking.paymentMethod || 'Online')?.toUpperCase()}</p>
                                        </div>
                                        <span className={`text-3xl font-black tracking-tighter leading-none ${isCancelled ? 'text-gray-400 line-through' : 'text-primary dark:text-primary'}`}>
                                            ₹{paidAmount?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refund Process Timeline with Interactive Breakdown */}
                {isCancelled && paidAmount > 0 && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[13px] md:text-sm mb-8 flex items-center gap-2">
                            <RefreshCcw className="w-5 h-5 text-primary" /> Refund Tracking
                        </h4>
                        
                        <div className="relative pl-2 md:pl-4">
                            {/* Vertical connecting line */}
                            <div className="absolute left-[23px] md:left-[31px] top-4 bottom-8 w-[2px] bg-gray-100 dark:bg-gray-800">
                                {/* Green progress line fills up if refunded */}
                                {isRefunded && <div className="w-full h-full bg-green-400 dark:bg-green-500"></div>}
                            </div>

                            {/* Step 1: Booking Cancelled */}
                            <div className="relative flex items-start gap-5 mb-8">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center z-10 shrink-0 border-4 border-white dark:border-gray-900 shadow-sm">
                                    <X className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-500" strokeWidth={3} />
                                </div>
                                <div className="pt-1">
                                    <p className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Booking Cancelled</p>
                                    <p className="text-[11px] md:text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Ticket has been voided</p>
                                </div>
                            </div>

                            {/* Step 2: Refund Initiated with Breakdown */}
                            <div className="relative flex items-start gap-5 mb-8">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center z-10 shrink-0 border-4 border-white dark:border-gray-900 shadow-sm">
                                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-500" strokeWidth={3} />
                                </div>
                                <div className="pt-1 w-full">
                                    <div className="flex flex-wrap justify-between items-start gap-3">
                                        <div>
                                            <p className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Refund Initiated</p>
                                            <p className="text-[11px] md:text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                                ₹{refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} calculated for refund
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowRefundBreakdown(!showRefundBreakdown)}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <FileText size={12} />
                                            {showRefundBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
                                        </button>
                                    </div>

                                    {/* Breakdown Accordion Panel */}
                                    {showRefundBreakdown && (
                                        <div className="mt-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-3">
                                                <RefundRow label="Ticket Base Amount" value={refundData.seatAmount || booking.pricing?.subtotal || booking.ticketPrice || 0} />
                                                
                                                {refundData.cancellationCharge > 0 && (
                                                    <RefundRow 
                                                        label={`Cancellation Charge (${refundData.appliedSlab?.label || refundData.chargePercent + '%'})`} 
                                                        value={refundData.cancellationCharge} 
                                                        isCharge 
                                                    />
                                                )}
                                                
                                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700/50 my-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Non-Refundable Add-ons</p>
                                                
                                                <RefundRow label="Convenience Fee" value={refundData.convenienceFee || booking.pricing?.convenienceFee || booking.convenienceFee || 0} isCharge />
                                                <RefundRow label="GST & Taxes" value={refundData.gst || booking.pricing?.gst || booking.tax || 0} isCharge />
                                                
                                                {refundData.foodAmount > 0 && (
                                                    <RefundRow label="Food & Beverages" value={refundData.foodAmount} isCharge />
                                                )}

                                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700/50 my-2" />
                                                
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Net Refund Amount</span>
                                                    <span className="text-sm font-black text-green-600 dark:text-green-400">
                                                        ₹{refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Refund ID</p>
                                                    <p className="text-[10px] font-mono font-bold text-gray-900 dark:text-white truncate" title={refundData.refundId}>
                                                        {refundData.refundId || 'Processing...'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Initiated On</p>
                                                    <p className="text-[10px] font-bold text-gray-900 dark:text-white">
                                                        {refundData.initiatedAt 
                                                            ? new Date(refundData.initiatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {refundData.note && (
                                                <p className="mt-4 text-[9px] font-bold text-gray-400 leading-relaxed bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                                    * {refundData.note}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Refund Completed / Processing */}
                            <div className="relative flex items-start gap-5">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center z-10 shrink-0 border-4 border-white dark:border-gray-900 shadow-sm transition-colors ${isRefunded ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    {isRefunded ? (
                                        <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-500" strokeWidth={3} />
                                    ) : (
                                        <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-400" strokeWidth={2.5} />
                                    )}
                                </div>
                                <div className="pt-1">
                                    <p className={`text-sm md:text-base font-black uppercase tracking-tight ${isRefunded ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}`}>
                                        {isRefunded ? 'Refund Successful' : 'Refund In Progress'}
                                    </p>
                                    <p className="text-[11px] md:text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest leading-relaxed">
                                        {isRefunded 
                                            ? `Credited to ${(booking.payment?.method || booking.paymentMethod || 'account').toUpperCase()}` 
                                            : 'Usually takes 5-7 business days to reflect in your account'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Section (Conditional) */}
                {(() => {
                    if (isCancelled || !booking) return null; // Hide reviews if cancelled
                    
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

                {/* Footer Actions (Download & Cancel) */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 print:hidden flex flex-wrap justify-center gap-4">
                    
                    {/* Cancel Booking Button - Only visible if booking is NOT cancelled */}
                    {!isCancelled && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="w-full sm:flex-1 max-w-[200px] h-12 rounded-2xl bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={14} strokeWidth={3} /> Cancel Ticket
                        </button>
                    )}

                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`w-full sm:flex-1 max-w-[200px] h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait ${isCancelled ? 'max-w-xs' : ''}`}
                    >
                        {isDownloading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                <Download size={14} /> Download Pass
                            </>
                        )}
                    </button>
                </div>

                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    booking={booking}
                    onSuccess={handleReviewSuccess}
                />
                
                <CancellationModal 
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    bookingId={booking.bookingId || booking.id}
                    bookingType="movie"
                    totalAmount={paidAmount}
                    paymentMethod={booking.payment?.method || booking.paymentMethod || 'account'}
                />
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

// Standard Receipt Row
const ReceiptRow = ({ label, value, isDiscount }) => (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={isDiscount ? "text-green-500 dark:text-green-400" : "text-gray-900 dark:text-white"}>
            {isDiscount ? '-' : ''}₹{Math.abs(value || 0).toLocaleString()}
        </span>
    </div>
);

// Custom Refund Breakdown Row
const RefundRow = ({ label, value, isCharge }) => (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={isCharge ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white"}>
            {isCharge ? '-' : ''}₹{Math.abs(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
    </div>
);

export default BookingDetailsPage;