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
    Activity
} from 'lucide-react';
import { getTurfBookingDetails } from '../services/turfService';
import apiCacheManager from '../services/apiCacheManager';
import LoadingScreen from '../components/LoadingScreen';
import SEO from '../components/SEO';
import { toast } from 'react-hot-toast';
import BookingQr from '../components/BookingQr';

const TurfBookingDetailsPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

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
    if (!booking) return null;

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

                        {/* Centered QR code container */}
                        <div className="flex items-center justify-center py-2 select-none">
                            <div className="p-0.5 bg-white rounded-md shadow-md flex items-center justify-center select-none">
                                <BookingQr
                                    booking={{ ...booking, qrcode: booking.qrcode || booking.qrCode || firstSlot.qrcode || firstSlot.qrCode }}
                                    size={130}
                                />
                            </div>
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

                {/* Footer Details Wrapper */}
                <div className="bg-white dark:bg-[#1a1d24] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/80 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-6 print:hidden">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 md:flex md:flex-wrap md:items-center md:gap-y-4 md:gap-x-8">
                        <div className="space-y-0.5">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Amount Paid</p>
                            <p className="font-black text-[#ef5658] text-lg leading-none">₹{Math.round(payment.amountPaid !== undefined ? payment.amountPaid : (payment.amount || 0)).toLocaleString()}</p>
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
                            <p className="font-bold text-gray-700 dark:text-gray-300 capitalize text-base leading-none">{payment.paymentStatus || 'Success'}</p>
                        </div>
                        <div className="space-y-0.5 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-8">
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Total Amount</p>
                            <p className="font-bold text-gray-700 dark:text-gray-300 capitalize text-base leading-none">₹{payment.totalAmount || '0'}</p>
                        </div>
                    </div>

                    <div className="flex w-full md:w-auto print:hidden download-exclude">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 md:px-5 md:py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm md:text-xs hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download Pass
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Important Instructions */}
                <div className="mt-8 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 rounded-2xl p-6">
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
            </main>
        </div>
    );
};

export default TurfBookingDetailsPage;
