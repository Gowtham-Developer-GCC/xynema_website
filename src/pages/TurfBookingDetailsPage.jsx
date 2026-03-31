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
                    navigate('/bookings');
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

    // Helper: Convert an image URL to base64 via our server proxy
    const fetchImageAsBase64 = async (url) => {
        if (!url || url.startsWith('data:')) return url; // Already inline
        try {
            const proxyUrl = `/__image_proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
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

            // Force a stable desktop-width viewport for the capture engine
            element.style.width = '800px';

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

            // Record dimensions at 800px
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
            element.style.width = originalWidth;
            for (const { img, src } of originalSrcs) {
                img.src = src;
            }

            // Step 5: PDF construction
            const pdf = new jsPDF({
                orientation: 'portrait',
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

                    .rounded-3xl { 
                        border-radius: 20px !important; 
                        border: 1px solid #e5e7eb !important; 
                        box-shadow: none !important; 
                        margin: 0 auto !important;
                        max-width: 650px !important;
                        overflow: hidden !important;
                        background: white !important;
                    }

                    .opacity-80 { opacity: 1 !important; }
                }
            `}</style>
            <SEO
                title={`${turf.turfName || 'Booking'} Ticket - XYNEMA`}
                description="View your turf booking details and entry pass."
            />

            {/* Top Navigation */}
            <div className="bg-white dark:bg-[#1a1d24] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
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

            <main className="max-w-4xl mx-auto px-4 pt-8">
                {/* Status Banner - Only show on success redirect */}
                {location.state?.isNewBooking && (
                    <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Booking Confirmed!</h2>
                        <p className="text-gray-500 dark:text-gray-400">Your reservation at {turf.turfName} is secured.</p>
                    </div>
                )}

                {/* Main Ticket Card (Mockup Style) */}
                <div ref={ticketRef} className="bg-white dark:bg-[#1a1d24] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden relative">
                    {/* Decorative Top Accent */}
                    <div className="h-2 bg-primary w-full" />

                    <div className="p-6 md:p-10 space-y-8">
                        {/* Info Section */}
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-1.5 opacity-80">
                                    Venue Information
                                </p>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                                    {turf.turfName}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="text-sm md:text-base font-medium">
                                        {turf.city ? `${turf.city}, India` : 'India'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Date</p>
                                    <p className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                                        {formatDate(date)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Time Slot</p>
                                    <p className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                                        {startTime && endTime ? `${startTime} - ${endTime}` : '-'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Pitch Type</p>
                                    <p className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                                        {court.courtName || 'Standard'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Sport</p>
                                    <p className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                                        {booking.sportType || turf.sportType || 'Football'}
                                    </p>
                                </div>
                            </div>

                            {booking.notes && (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/50">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">Notes</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                        "{booking.notes}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Bottom QR Section */}
                        <div className="pt-6 border-t border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center">
                            <div className="bg-pink-50 dark:bg-pink-500/5 rounded-2xl p-6 border border-dashed border-pink-200 dark:border-pink-500/10 flex flex-col md:flex-row items-center gap-6 w-full max-w-3xl">
                                <div className="shrink-0">
                                    <BookingQr booking={{ ...booking, qrcode: booking.qrcode || booking.qrCode || firstSlot.qrcode || firstSlot.qrCode }} size={190} />
                                </div>
                                <div className="flex-1 text-center md:text-center space-y-1">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                        Scan for Entry Verification
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase">
                                        Booking ID: {booking.bookingId || (booking.id || booking._id)?.slice(-8).toUpperCase()}
                                    </p>
                                    <div className="mt-2 text-[9px] text-primary font-bold bg-primary/10 px-2 py-1 rounded inline-block">
                                        VALID FOR {slots.length} SLOT{slots.length > 1 ? 'S' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Meta Section */}
                    <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800/50 p-6 flex items-center justify-between gap-4">
                        <div className="flex-1 flex flex-wrap items-center gap-y-4 gap-x-8">
                            <div className="space-y-0.5">
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Amount Paid</p>
                                <p className="font-black text-primary text-lg leading-none">₹{(payment.amountPaid !== undefined ? payment.amountPaid : (payment.amount || 0)).toLocaleString()}</p>
                            </div>

                            {payment.paymentStatus === 'partial' && payment.remainingAtVenue > 0 && (
                                <div className="space-y-0.5 border-l border-gray-200 dark:border-gray-800 pl-8">
                                    <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Remaining at Venue</p>
                                    <p className="font-black text-orange-500 text-lg leading-none">₹{payment.remainingAtVenue.toLocaleString()}</p>
                                </div>
                            )}

                            <div className="space-y-0.5 border-l border-gray-200 dark:border-gray-800 pl-8">
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Payment Mode</p>
                                <p className="font-bold text-gray-700 dark:text-gray-300 capitalize text-base leading-none">{payment.paymentMethod || payment.method || 'Online'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 print:hidden download-exclude">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-70 disabled:cursor-wait"
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
