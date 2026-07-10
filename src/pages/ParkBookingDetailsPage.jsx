import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    CheckCircle, Calendar, MapPin, Ticket, 
    Home, Share2, Download, ChevronLeft,
    Mail, Info, X , RefreshCcw, Clock, Ban, Check, FileText
} from 'lucide-react';
import { getParkBookingDetails } from '../services/parkService';
import CancellationModal from '../components/CancellationModal';
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
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRefundBreakdown, setShowRefundBreakdown] = useState(false);

    

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

    const isCancelled = booking.status?.toLowerCase() === 'cancelled' || booking.cancellation?.isCancelled === true;
    const refundData = booking.cancellation?.refund || booking.cancellation || {};
    const refundStatus = refundData.status || booking.paymentInfo?.paymentStatus || 'PENDING';
    const isRefunded = ['refunded', 'success', 'completed'].includes(refundStatus?.toLowerCase());
    const totalAmount = booking.pricing?.totalAmount || booking.amount || booking.paidAmount || 0;
    const refundAmount = refundData.refundAmount || refundData.totalRefundAmount || 0;

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
                    <div className="w-full md:w-[280px] bg-[#fff5f6] dark:bg-primary/5 flex flex-col items-center justify-center p-12 border-l border-gray-50 dark:border-gray-800 relative overflow-hidden">
                        
                        {/* QR Code (Blurs if cancelled) */}
                        <div className={`mb-6 relative z-0 ${isCancelled ? 'blur-[4px] opacity-40 grayscale pointer-events-none transition-all duration-300' : ''}`}>
                            <BookingQr booking={{ ...booking, qrCode: booking.qrCode || booking.qrcode || booking.bookingRef || booking.bookingId || id }} size={200} />
                        </div>
                        
                        {/* The Cancelled Stamp */}
                        {isCancelled && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                <div className="border-[4px] border-red-600 text-red-600 rounded-xl px-5 py-2 transform -rotate-[15deg] flex flex-col items-center justify-center shadow-2xl bg-white/95 dark:bg-gray-900/95 ring-4 ring-red-600/20 backdrop-blur-sm">
                                    <Ban className="w-8 h-8 mb-1 opacity-90" strokeWidth={3} />
                                    <span className="text-[15px] font-black tracking-[0.2em] uppercase leading-none">Cancelled</span>
                                </div>
                            </div>
                        )}

                        <p className="text-[13px] font-medium text-[#5e6c84] dark:text-gray-400 text-center relative z-0">
                            {isCancelled ? 'Ticket Voided' : 'Scan for Entry'}
                        </p>
                    </div>
                </div>

                {/* Email Confirmation Message */}
                <div className="bg-[#fff5f6] border border-primary/30 rounded-lg p-5 flex items-center justify-center gap-3 dark:text-white dark:bg-[#16181d]">
                    <Mail className="w-5 h-5 text-primary" />
                    <p className="text-sm font-medium text-primary">Booking confirmation has been sent to your email</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    {!isCancelled && (
                        <button 
                            onClick={() => setShowCancelModal(true)}
                            className="flex-1 py-4 bg-white dark:bg-gray-900 text-[#42526e] dark:text-gray-400 font-bold text-sm rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                        <X size={14} strokeWidth={3} /> Cancel Ticket
                        </button> 
                    )}
                    <button 
                        onClick={() => navigate('/')}
                        className="flex-1 py-4 bg-primary text-white font-bold text-sm rounded-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                    >
                        Back to Home
                    </button>
                </div>
                {/* 1. Refund Tracking Timeline */}
                {isCancelled && totalAmount > 0 && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[13px] md:text-sm mb-8 flex items-center gap-2">
                            <RefreshCcw className="w-5 h-5 text-primary" /> Refund Tracking
                        </h4>
                        
                        <div className="relative pl-2 md:pl-4">
                            <div className="absolute left-[23px] md:left-[31px] top-4 bottom-8 w-[2px] bg-gray-100 dark:bg-gray-800">
                                {isRefunded && <div className="w-full h-full bg-green-400 dark:bg-green-500"></div>}
                            </div>

                            <div className="relative flex items-start gap-5 mb-8">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center z-10 shrink-0 border-4 border-white dark:border-gray-900 shadow-sm">
                                    <X className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-500" strokeWidth={3} />
                                </div>
                                <div className="pt-1">
                                    <p className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Booking Cancelled</p>
                                    <p className="text-[11px] md:text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Ticket has been voided</p>
                                </div>
                            </div>

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

                                    {showRefundBreakdown && (
                                        <div className="mt-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-3">
                                                <RefundRow label="Park Base Amount" value={refundData.seatAmount || booking.pricing?.subtotal || booking.amount || totalAmount || 0} />
                                                
                                                <div className="h-px w-full bg-gray-200 dark:bg-gray-700/50 my-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Deductions</p>
                                                
                                                <RefundRow 
                                                    label={`Cancellation Charge (${refundData.appliedSlab?.label || (refundData.chargePercent || 0) + '%'})`} 
                                                    value={refundData.cancellationCharge || 0} 
                                                    isCharge 
                                                />
                                                
                                                <RefundRow label="Convenience Fee" value={refundData.convenienceFee || booking.pricing?.convenienceFee || 0} isCharge />
                                                
                                                <RefundRow label="GST & Taxes" value={refundData.gst || booking.pricing?.tax || booking.pricing?.gst || 0} isCharge />

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

                {/* 3. The Modal */}
                <CancellationModal 
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    bookingId={booking.bookingRef || booking.id || id}
                    parkId={booking.park?.parkId || booking.park?._id || booking.park?.id}
                    bookingType="park"
                    totalAmount={totalAmount}
                    paymentMethod={booking.payment?.method || 'account'}
                />
            </main>
        </div>
    );
};
// Custom Refund Breakdown Row
const RefundRow = ({ label, value, isCharge }) => (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={isCharge ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white"}>
            {isCharge ? '-' : ''}₹{Math.abs(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
    </div>
);

export default ParkBookingDetailsPage;
