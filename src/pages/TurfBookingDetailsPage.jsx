import React, { useState, useEffect } from 'react';
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

    const turf = booking.turf || {};
    const snapshot = booking.snapshot || {};
    const payment = booking.payment || {};

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f1115] transition-colors duration-300 pb-12">
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
                    <button className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
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
                <div className="bg-white dark:bg-[#1a1d24] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden relative">
                    {/* Decorative Top Accent */}
                    <div className="h-2 bg-primary w-full" />

                    <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8">
                        {/* Info Section */}
                        <div className="flex-1 space-y-8">
                            <div>
                                <p className="text-[10px] md:text-[12px] uppercase tracking-[0.2em] font-bold text-primary mb-2 opacity-80">
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
                                        {formatDate(snapshot.date)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Time Slot</p>
                                    <p className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                                        {snapshot.startTime} - {snapshot.endTime}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Pitch Type</p>
                                    <p className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                                        {booking.court?.courtName || 'Standard'}
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

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center bg-pink-50 dark:bg-pink-500/5 rounded-2xl p-8 border border-dashed border-pink-200 dark:border-pink-500/10 md:w-64">
                            <div className="mb-4">
                                <BookingQr booking={booking} size={220} />
                            </div>
                            <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                Scan for Entry
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono uppercase">
                                ID: {booking.bookingId || (booking.id || booking._id)?.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {/* Footer / Meta Section */}
                    <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800/50 p-6 flex flex-wrap gap-6 items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className="space-y-0.5">
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Amount Paid</p>
                                <p className="font-black text-primary text-lg">₹{(payment.amount || 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-0.5 border-l border-gray-200 dark:border-gray-800 pl-4">
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Payment Mode</p>
                                <p className="font-bold text-gray-700 dark:text-gray-300 capitalize">{payment.method || 'Online'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <Download className="w-4 h-4" />
                                Download Pass
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
