import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar,
    Clock,
    MapPin,
    ChevronLeft,
    QrCode,
    Share2,
    Download,
    Info,
    ArrowLeft,
    CheckCircle2,
    Activity,
    X,
    Ban,
    RefreshCcw,
    Check
} from 'lucide-react';
import { getTurfBookingDetails } from '../services/turfService';
import apiCacheManager from '../services/apiCacheManager';
import LoadingScreen from '../components/LoadingScreen';
import SEO from '../components/SEO';
import { toast } from 'react-hot-toast';
import BookingQr from '../components/BookingQr';
import CancellationModal from '../components/CancellationModal';


const TurfBookingDetailsPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    //cancellation 
    const [showCancelModal, setShowCancelModal] = useState(false);

    // SWR Cache Layer
    const [booking, setBooking] = useState(() => apiCacheManager.get(`turf_booking_details_${bookingId}`));
    const [loading, setLoading] = useState(!booking);
    const [isDownloading, setIsDownloading] = useState(false);
    const ticketRef = useRef(null);

    useEffect(() => {
        const fetchDetails = async () => {
            const hasInitialData = !!booking;
            try {
                if (!hasInitialData) setLoading(true);

                const data = await apiCacheManager.getOrFetchTurfBookingDetails(bookingId, () => getTurfBookingDetails(bookingId));

                if (data) {
                    setBooking(data);
                } else if (!hasInitialData) {
                    toast.error("Booking not found");
                    navigate('/bookings', { state: { activeTab: 'sports' } });
                }
            } catch (error) {
                console.error("Error fetching booking details:", error);
                if (!hasInitialData) toast.error("Failed to load booking details");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [bookingId]);

    if (loading && !booking) return <LoadingScreen message="Fetching your ticket..." />;
    if (!booking) return <div className="min-h-screen flex items-center justify-center text-gray-500">Booking not found</div>;
    
    const isCancelled = booking.slots?.every(slot => slot.status?.toLowerCase() === 'cancelled') || booking.status?.toLowerCase() === 'cancelled';
    const isRefunded = booking.paymentInfo?.paymentStatus?.toLowerCase() === 'refunded' || booking.payment?.paymentStatus?.toLowerCase() === 'refunded';

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
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
            const originalHeight = element.style.height;
            const originalPosition = element.style.position;
            const originalZIndex = element.style.zIndex;
            const originalTop = element.style.top;
            const originalLeft = element.style.left;

            // Force absolute fixed rendering to ignore responsive parent overflows
            element.classList.add('force-desktop');
            element.style.position = 'fixed';
            element.style.zIndex = '99999';
            element.style.top = '0';
            element.style.left = '0';
            element.style.width = '760px';
            element.style.height = '290px';

            // Step 1: Inline all images (CORS bypass via proxy)
            const images = [...element.getElementsByTagName('img')];
            const originalSrcs = [];
            for (const img of images) {
                const originalSrc = img.src;
                originalSrcs.push({ img, src: originalSrc });
                if (originalSrc && !originalSrc.startsWith('data:')) {
                    const base64 = await fetchImageAsBase64(originalSrc);
                    if (base64) img.src = base64;
                }
            }

            // Step 1.5: CRITICAL - Convert QR Canvas to static Image for PDF capture
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

            // Step 2: Settle layout and assets
            await new Promise(resolve => setTimeout(resolve, 600));

            // Record dimensions at forced 760px landscape state
            const captureWidth = element.offsetWidth;
            const captureHeight = element.offsetHeight;

            // Step 3: High-quality snapshot capture
            const dataUrl = await toPng(element, {
                pixelRatio: 3,
                backgroundColor: '#ffffff',
                cacheBust: true,
                skipFonts: false,
                // Exclude the download button from the final snapshot
                filter: (node) => {
                    if (node.classList && (node.classList.contains('print:hidden') || node.classList.contains('download-exclude'))) {
                        return false;
                    }
                    return true;
                },
                style: { transform: 'none' }
            });

            // Restore live DOM
            for (const { canvas, img } of canvasReplacements) {
                canvas.style.display = '';
                img.remove();
            }
            element.classList.remove('force-desktop');
            element.style.position = originalPosition;
            element.style.zIndex = originalZIndex;
            element.style.top = originalTop;
            element.style.left = originalLeft;
            element.style.width = originalWidth;
            element.style.height = originalHeight;
            for (const { img, src } of originalSrcs) {
                img.src = src;
            }

            // Step 5: PDF construction
            const orientation = captureWidth > captureHeight ? 'landscape' : 'portrait';
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'px',
                format: [captureWidth, captureHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, captureWidth, captureHeight);
            pdf.save(`XYNEMA-Turf-${booking.bookingId || (booking.id || booking._id)?.slice(-8).toUpperCase()}.pdf`);
            toast.success("Ticket downloaded successfully!");
        } catch (err) {
            console.error('PDF generation failed:', err);
            toast.error('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
            toast.success("Download initiated");
        }

    };

    const turf = booking.turf || {};
    const slots = booking.slots || [];
    const firstSlot = slots[0] || {};
    const lastSlot = slots[slots.length - 1] || {};

    // Support both old and new response structures for maximum compatibility
    const payment = booking.paymentInfo || booking.payment || {};
    const snapshot = booking.snapshot || firstSlot.snapshot || firstSlot.timeSlot || {};
    const court = booking.court || firstSlot.court || {};

    // Calculate comprehensive time range for multiple slots
    const startTime = snapshot.startTime || firstSlot.timeSlot?.startTime;
    const endTime = lastSlot.timeSlot?.endTime || snapshot.endTime;
    const date = snapshot.date || firstSlot.timeSlot?.date;
    const paidAmount = payment.amountPaid !== undefined ? payment.amountPaid : (payment.amount || 0);

    const handleShare = async () => {
        const shareData = {
            title: `XYNEMA - Entry Pass for ${turf.turfName || 'Turf'}`,
            text: `Hey! Check out my entry pass for ${turf.turfName} on ${formatDate(date)}.`,
            url: window.location.href,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                toast.success('Pass link copied to clipboard!', {
                    icon: '📋',
                    duration: 3000
                });
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Sharing failed:', err);
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    toast.success('Pass link copied! (Share API unavailable)');
                } catch (copyErr) {
                    toast.error('Could not copy link');
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f1115] transition-colors duration-300 pb-12">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap');

                .ticket-container {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    max-width: 760px;
                    margin: 0 auto;
                    font-family: 'Montserrat', sans-serif;
                    filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.08));
                    transition: all 0.3s ease;
                }

                .ticket-stub {
                    background: #ef5658;
                    height: 290px;
                    width: 260px;
                    color: white;
                    padding: 24px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-sizing: border-box;
                    z-index: 10;
                }

                .ticket-check {
                    background: #ffffff;
                    height: 290px;
                    width: 500px;
                    padding: 24px 32px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-sizing: border-box;
                    z-index: 10;
                }

                .dark .ticket-check {
                    background: #1a1d24;
                }

                /* Default clip-paths (horizontal landscape layout) */
                .ticket-stub {
                    clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
                }
                .ticket-check {
                    clip-path: polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px), 0 18px);
                }

                @media (max-width: 767px) {
                    .ticket-container:not(.force-desktop) {
                        flex-direction: column;
                        max-width: 360px;
                        filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.12));
                    }
                    .ticket-container:not(.force-desktop) .ticket-stub {
                        width: 100%;
                        height: auto;
                        min-height: 210px;
                        clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px));
                        margin-bottom: -1px;
                    }
                    .ticket-container:not(.force-desktop) .ticket-check {
                        width: 100%;
                        height: auto;
                        padding: 24px;
                        clip-path: polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%, 0 18px);
                    }
                }

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
                    
                    .max-w-4xl {
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }

                    .ticket-container {
                        filter: none !important;
                        max-width: 700px !important;
                    }

                    .ticket-stub {
                        clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%) !important;
                        background: #ef5658 !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .ticket-check {
                        clip-path: polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px), 0 18px) !important;
                        background: white !important;
                        color: black !important;
                        border: 1px solid #e5e7eb !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
            <SEO
                title={`${turf.turfName || 'Booking'} Ticket - XYNEMA`}
                description="View your turf booking details and entry pass."
            />

            {/* Top Navigation */}
            <div className="bg-white dark:bg-[#1a1d24] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 print:hidden">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/bookings', { state: { activeTab: 'sports' } })}
                        className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Booking Details</h1>
                    <button
                        onClick={handleShare}
                        className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
                        title="Share Ticket"
                    >
                        <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 pt-8">
                {/* Status Banner - Only show on success redirect */}
                {location.state?.isNewBooking && (
                    <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-700 print:hidden">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Booking Confirmed!</h2>
                        <p className="text-gray-500 dark:text-gray-400">Your reservation at {turf.turfName} is secured.</p>
                    </div>
                )}

                {/* Main Ticket Card (Dribbble Retro Shape Style) */}
                <div ref={ticketRef} className="ticket-container max-w-6xl">

                    {/* 1. Left Stub Section */}
                    <div className="ticket-stub">
                        {/* Top Area */}
                        <div className="flex items-center justify-between uppercase tracking-widest text-[9px] font-bold">
                            <span className="text-white font-black">Admit</span>
                            <span className="block bg-white/40 h-5 w-[2.5px] mx-3" />
                            <span className="flex flex-col text-[8px] leading-tight text-white/90">
                                Invitation
                                <span className="text-[7.5px] font-bold font-mono text-black bg-white px-1.5 py-0.5 rounded mt-0.5 select-all">
                                    {(booking.id || booking._id)?.slice(-8).toUpperCase()}
                                </span>
                            </span>
                        </div>

                        {/* Centered QR code container with Cancelled Stamp */}
                        <div className="relative flex items-center justify-center py-2 select-none">
                            <div className={`p-0.5 bg-white rounded-md shadow-md flex items-center justify-center select-none transition-all duration-300 ${isCancelled ? 'blur-[3px] opacity-40 grayscale' : ''}`}>
                                <BookingQr
                                    booking={{ ...booking, qrcode: booking.qrcode || booking.qrCode || firstSlot.qrcode || firstSlot.qrCode }}
                                    size={130}
                                />
                            </div>
                            
                            {/* High Visual Cancelled Vector Stamp */}
                            {isCancelled && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <div className="border-[4px] border-red-600 text-red-600 rounded-xl px-5 py-2 transform -rotate-[15deg] flex flex-col items-center justify-center shadow-2xl bg-white/95 ring-4 ring-red-600/20 backdrop-blur-sm">
                                        <Ban className="w-8 h-8 mb-1 opacity-90" strokeWidth={3} />
                                        <span className="text-[15px] font-black tracking-[0.2em] uppercase leading-none">Cancelled</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Invite message */}
                        <div className="flex flex-col items-start gap-1">
                            <span className="block bg-white h-[3px] w-10 mb-0.5" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-black/95 select-none leading-none max-w-[215px] truncate" title={booking.notes}>
                                Note: {booking.notes || 'Invite for you'}
                            </span>
                            <span className="text-[7.5px] font-bold text-white/90 uppercase tracking-widest leading-none mt-0.5 font-mono select-all">
                                ID: {booking.bookingId || bookingId || (booking.id || booking._id)?.slice(-8).toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* 2. Right Check Section */}
                    <div className="ticket-check border-l border-dashed border-gray-200 dark:border-gray-800 relative">
                        <div className="flex justify-between items-start gap-4 h-full w-full">
                            {/* Left Text / Info details */}
                            <div className="flex-1 flex flex-col justify-between h-full">
                                <div>
                                    {/* Category / Slots Tag (static on mobile, absolute on desktop) */}
                                    <div className="md:absolute md:top-6 md:right-8 text-[#ef5658] font-black text-sm md:text-3xl tracking-tight uppercase select-none z-20 mb-2 md:mb-0">
                                        {slots.length || 1} <span className="text-[10px] md:text-lg">Slot{slots.length > 1 ? 's' : ''}</span>
                                    </div>

                                    <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-[1.05em] uppercase tracking-tighter select-none max-w-[280px]">
                                        {(() => {
                                            const rawName = turf.turfName || booking.turfName || 'Olympus Arena';
                                            return turf.turfName || booking.turfName || 'Turf';
                                        })()}
                                    </h2>
                                    {turf.city && (
                                        <p className="text-xs md:text-sm font-black uppercase tracking-widest text-[#ef5658] mt-1 select-none">
                                            {turf.city}
                                        </p>
                                    )}
                                </div>

                                {/* Dynamic Responsive Details Grid (2x2 on mobile, flex row on desktop) */}
                                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-4 md:flex md:gap-6">
                                    <section className="flex flex-col">
                                        <span className="block bg-[#ef5658] h-[3px] w-8 mb-1" />
                                        <span className="text-[8.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</span>
                                        <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200 uppercase mt-0.5 whitespace-nowrap">
                                            {new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                        </span>
                                    </section>
                                    <section className="flex flex-col">
                                        <span className="block bg-[#ef5658] h-[3px] w-8 mb-1" />
                                        <span className="text-[8.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Time Slot</span>
                                        <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200 uppercase mt-0.5 whitespace-nowrap">
                                            {startTime && endTime ? `${startTime} - ${endTime}` : '-'}
                                        </span>
                                    </section>
                                    <section className="flex flex-col">
                                        <span className="block bg-[#ef5658] h-[3px] w-8 mb-1" />
                                        <span className="text-[8.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Pitch Type</span>
                                        <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200 uppercase mt-0.5 whitespace-nowrap">
                                            {court.courtName || 'Standard'}
                                        </span>
                                    </section>
                                    <section className="flex flex-col">
                                        <span className="block bg-[#ef5658] h-[3px] w-8 mb-1" />
                                        <span className="text-[8.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Sport</span>
                                        <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200 uppercase mt-0.5 whitespace-nowrap">
                                            {booking.sportType || turf.sportType || 'Football'}
                                        </span>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refund Process Timeline (Only visible if cancelled and user actually paid something) */}
                {isCancelled && paidAmount > 0 && (
                    <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-sm mt-6 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center z-10 shrink-0 border-4 border-white dark:border-[#1a1d24] shadow-sm">
                                    <X className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-500" strokeWidth={3} />
                                </div>
                                <div className="pt-1">
                                    <p className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Booking Cancelled</p>
                                    <p className="text-[11px] md:text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Pass has been voided</p>
                                </div>
                            </div>

                            {/* Step 2: Refund Initiated */}
                            <div className="relative flex items-start gap-5 mb-8">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center z-10 shrink-0 border-4 border-white dark:border-[#1a1d24] shadow-sm">
                                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-500" strokeWidth={3} />
                                </div>
                                <div className="pt-1">
                                    <p className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Refund Initiated</p>
                                    <p className="text-[11px] md:text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                        ₹{Math.round(paidAmount).toLocaleString()} calculated for refund
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Refund Completed / Processing */}
                            <div className="relative flex items-start gap-5">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center z-10 shrink-0 border-4 border-white dark:border-[#1a1d24] shadow-sm transition-colors ${isRefunded ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
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
                                            ? `Credited to ${payment.paymentMethod || payment.method || 'account'}` 
                                            : 'Usually takes 5-7 business days to reflect in your account'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Details Wrapper */}
                <div className="bg-white dark:bg-[#1a1d24] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-6 print:hidden">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 md:flex md:flex-wrap md:items-center md:gap-y-4 md:gap-x-8">
                        <div className="space-y-0.5">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Amount Paid</p>
                            <p className={`font-black text-lg leading-none ${isCancelled ? 'text-gray-400 line-through' : 'text-[#ef5658]'}`}>
                                ₹{Math.round(paidAmount).toLocaleString()}
                            </p>
                        </div>

                        {payment.paymentStatus === 'partial' && payment.remainingAtVenue > 0 && (
                            <div className="space-y-0.5 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-8">
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Remaining at Venue</p>
                                <p className="font-black text-orange-500 text-lg leading-none">₹{Math.round(payment.remainingAtVenue).toLocaleString()}</p>
                            </div>
                        )}

                        <div className="space-y-0.5 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-8">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Payment Mode</p>
                            <p className="font-bold text-gray-700 dark:text-gray-300 capitalize text-base leading-none">{payment.paymentMethod || payment.method || 'Online'}</p>
                        </div>
                        <div className="space-y-0.5 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-8">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Payment Status</p>
                            <p className={`font-bold capitalize text-base leading-none ${isRefunded ? 'text-green-500' : isCancelled ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {payment.paymentStatus || (isCancelled ? 'Cancelled' : 'Success')}
                            </p>
                        </div>
                        <div className="space-y-0.5 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-8">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Total Amount</p>
                            <p className={`font-bold capitalize text-base leading-none ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                ₹{payment.totalAmount || '0'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-8 md:mt-0 md:min-w-[320px]">
                        {!isCancelled && (
                            <button 
                                onClick={() => setShowCancelModal(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all shadow-sm"
                            >
                                <X className="w-4 h-4" strokeWidth={3} /> Cancel Booking
                            </button>
                        )}
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-70"
                        >
                            {isDownloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />} Download
                        </button>
                    </div>
                </div>

                {/* Important Instructions */}
                <div className="mt-6 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Entry Instructions</h4>
                            <ul className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                                <li>Show this digital pass at the venue reception 15 minutes prior to your slot.</li>
                                <li>Non-marking sports shoes are mandatory for turf entry.</li>
                                <li>The management is not responsible for any personal injury or loss of belongings.</li>
                                <li>Cancellations are subject to the venue's policy.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <CancellationModal 
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    bookingId={booking.bookingId || booking._id}
                    turfId={turf.id}
                    bookingType="turf"
                    totalAmount={booking.pricing?.total || booking.totalAmount}
                    paymentMethod={booking.payment?.method || booking.paymentMethod || 'account'}
                />
            </main>
        </div>
    );
};

export default TurfBookingDetailsPage;