import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    CheckCircle, Calendar, MapPin, Ticket, 
    Home, Share2, Download, ChevronLeft,
    Mail, Info
} from 'lucide-react';
import { getParkBookingDetails } from '../services/parkService';
import LoadingScreen from '../components/LoadingScreen';
import SEO from '../components/SEO';
import BookingQr from '../components/BookingQr';

const ParkBookingDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(!location.state?.bookingData);
    const [booking, setBooking] = useState(location.state?.bookingData || null);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id && id !== 'undefined') {
            fetchBookingDetails();
        } else {
            setError("Invalid Booking ID");
        }
    }, [id]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const result = await getParkBookingDetails(id);
            if (result.success) {
                // If the backend returns details nested inside a 'booking' key, use that
                const bookingData = result.data?.booking || result.data;
                setBooking(bookingData);
            } else {
                setError(result.message || "Booking not found");
            }
        } catch (err) {
            console.error("Error fetching park booking:", err);
            setError("Failed to load ticket details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen message="Fetching your ticket..." />;
    
    if (error || !booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F5FA] dark:bg-gray-950">
                <div className="bg-white dark:bg-gray-900 p-12 rounded-[40px] shadow-2xl text-center max-w-md w-full border border-gray-100 dark:border-gray-800">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Info className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Ticket Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-10">{error || "The booking you're looking for doesn't exist."}</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0f1115] transition-colors duration-300 pb-20 font-sans">
            <SEO title={location.state?.isNewBooking ? "Booking Confirmed! - Xynema" : "Ticket Details - Xynema"} />

            {/* Simple Top Header */}
            <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                <button onClick={() => navigate('/bookings', { state: { activeTab: 'parks' } })} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-4">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Status Indicator */}
                {location.state?.isNewBooking ? (
                    <div className="text-center space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 border border-primary/10">
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Booking Confirmed!</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {booking.bookingRef || booking.bookingId || id}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-1 mb-6">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Ticket Details</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {booking.bookingRef || booking.bookingId || id}</p>
                    </div>
                )}

                {/* Digital Ticket Card */}
                <div className="bg-white dark:bg-[#16181d] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row">
                    {/* Ticket Details Side */}
                    <div className="flex-1 p-10 md:p-12 space-y-10">
                        <div>
                            <p className="text-[14px] font-medium text-[#7a869a] mb-4">Park Information</p>
                            <h2 className="text-2xl font-bold text-[#172b4d] dark:text-white mb-3">{booking.park?.parkName || booking.parkName || booking.park?.name || "Amusement Park"}</h2>
                            <div className="flex items-center gap-2 text-[#42526e] dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">{booking.park?.address || booking.park?.city || "Pallikkara, Kochi"}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[14px] font-medium text-[#7a869a]">Date</p>
                            <p className="text-lg font-bold text-[#172b4d] dark:text-gray-200">
                                {new Date(booking.date || booking.bookingDay?.date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: '2-digit',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-2">
                            <div>
                                <p className="text-[14px] font-medium text-[#7a869a] mb-3">Ticket</p>
                                <div className="space-y-1">
                                    {(booking.tickets || booking.ticketDetails || []).map((t, idx) => (
                                        <p key={idx} className="text-lg font-medium text-[#172b4d] dark:text-gray-200">
                                            {t.ticketName || t.label || t.ticketType || 'Entry'} x {t.quantity || t.count || 1}
                                        </p>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[14px] font-medium text-[#7a869a] mb-3">Amount paid</p>
                                <p className="text-2xl font-bold text-[#172b4d] dark:text-white">
                                    ₹ {Math.round(booking.pricing?.totalAmount || booking.amount || booking.totalPrice || booking.paidAmount || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Side - Pink Box Style */}
                    <div className="w-full md:w-[280px] bg-[#fff5f6] dark:bg-primary/5 flex flex-col items-center justify-center p-12 border-l border-gray-50 dark:border-gray-800">
                        <div className="mb-6">
                            <BookingQr booking={{ ...booking, qrCode: booking.qrCode || booking.qrcode || booking.bookingRef || booking.bookingId || id }} size={200} />
                        </div>
                        <p className="text-[13px] font-medium text-[#5e6c84] dark:text-gray-400 text-center">Scan for Entry</p>
                    </div>
                </div>

                {/* Email Confirmation Message */}
                <div className="bg-[#fff5f6] border border-primary/30 rounded-lg p-5 flex items-center justify-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <p className="text-sm font-medium text-primary">Booking confirmation has been sent to your email</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button 
                        onClick={() => navigate('/bookings', { state: { activeTab: 'parks' } })}
                        className="flex-1 py-4 bg-white dark:bg-gray-900 text-[#42526e] dark:text-gray-400 font-bold text-sm rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 transition-all"
                    >
                        View All Bookings
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="flex-1 py-4 bg-primary text-white font-bold text-sm rounded-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ParkBookingDetailsPage;
