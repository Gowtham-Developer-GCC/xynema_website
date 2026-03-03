import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Shield, Info, MapPin, Ticket, Calendar, Clock, ShoppingBag } from 'lucide-react';
import { getEventBookingDetails } from '../services/eventService';
import SEO from '../components/SEO';
import ErrorState from '../components/ErrorState';
import BookingQr from '../components/BookingQr';

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



    if (loading) return <LoadingState />;
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

    const bookingDate = getDisplayDate(booking.event?.showDate);

    return (
        <div className="min-h-screen bg-whiteSmoke pb-20 print:bg-white print:pb-0">
            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                }
            `}</style>
            <SEO title={`Event Ticket - ${booking.event?.eventName} | XYNEMA`} description="View your event ticket" />

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
                        <h1 className="text-xs font-black text-gray-900 uppercase tracking-widest">Event Pass</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Main Ticket Pass Card */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 translate-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700 print:shadow-none print:border-none">

                    {/* Event Header Section */}
                    <div className="p-8 pb-0">
                        <div className="space-y-4 mb-2">
                            <h2 className="text-3xl font-black tracking-tighter uppercase text-gray-900 leading-tight">
                                {booking.event?.eventName}
                            </h2>
                        </div>

                        {/* QR Code Section */}
                        <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center border border-gray-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <Shield size={16} className="text-green-500/20" />
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 ring-1 ring-gray-100 transition-transform group-hover:scale-105 duration-500">
                                <BookingQr booking={booking} size={160} />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-[14px] font-black text-charcoalSlate font-mono uppercase tracking-tight bg-white px-3 py-1 rounded-lg ring-1 ring-gray-100 inline-block shadow-sm">
                                    {booking.bookingId}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Perforation Line */}
                    <div className="relative h-10 flex items-center justify-between pointer-events-none">
                        <div className="w-6 h-10 bg-whiteSmoke rounded-r-full border-y border-r border-gray-100 -ml-1 print:bg-white" />
                        <div className="flex-1 border-t-2 border-dashed border-gray-100 mx-4" />
                        <div className="w-6 h-10 bg-whiteSmoke rounded-l-full border-y border-l border-gray-100 -mr-1 print:bg-white" />
                    </div>

                    {/* Details Section */}
                    <div className="p-8 pt-0 space-y-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                            {/* Venue - Full Width */}
                            <DetailItem className="col-span-2" icon={<MapPin size={12} />} label="Venue" value={booking.event?.venue?.venueName} subValue={`${booking.event?.venue?.venueAddress}, ${booking.event?.venue?.city}`} />

                            {/* Date & Time - Split */}
                            <DetailItem icon={<Calendar size={12} />} label="Date" value={bookingDate} />
                            <DetailItem icon={<Clock size={12} />} label="Time" value={booking.event?.showTime} />

                            {/* Ticket Summary */}
                            <DetailItem icon={<Ticket size={12} />} label="Tickets" value={`${booking.tickets?.reduce((acc, t) => acc + t.quantity, 0) || 0} Units`} subValue="Confirmed" />
                            <DetailItem icon={<Shield size={12} />} label="Status" value={booking.status} subValue="Verified" />

                            {/* User Info - Full Width */}
                            {booking.user && (
                                <div className="col-span-2 pt-4 border-t border-dashed border-gray-100">
                                    <DetailItem icon={<ShoppingBag size={12} />} label="Booked By" value={booking.user.name} subValue={booking.user.email} />
                                </div>
                            )}
                        </div>

                        {/* Attendees Section */}
                        {booking.attendees && booking.attendees.length > 0 && (
                            <div className="pt-8 border-t border-gray-50 space-y-4">
                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                                        {booking.attendees.length}
                                    </span>
                                    Attendees
                                </h3>
                                <div className="space-y-3">
                                    {booking.attendees.map((attendee, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-black text-gray-400">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{attendee.name}</p>
                                                <p className="text-[10px] text-gray-500 font-medium truncate">{attendee.email}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{attendee.phone}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Details Section */}
                        {booking.payment && (
                            <div className="pt-8 border-t border-gray-50 space-y-3">
                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Payment Details</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Method</p>
                                        <p className="text-xs font-black text-gray-900 uppercase">{booking.payment.method}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Transaction ID</p>
                                        <p className="text-xs font-bold text-gray-900 font-mono truncate">{booking.payment.transactionId}</p>
                                    </div>
                                    {booking.payment.paymentGateway && (
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Gateway</p>
                                            <p className="text-xs font-black text-gray-900 uppercase">{booking.payment.paymentGateway}</p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                                        <p className="text-xs font-black text-green-600 uppercase flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            {booking.payment.status || 'Completed'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detailed Receipt View */}
                        <div className="pt-8 border-t border-gray-50 space-y-4">
                            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Pricing Breakdown</h3>

                            {/* Ticket Classes */}
                            {booking.tickets?.map((ticket, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-bold text-gray-900">{ticket.ticketClass}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{ticket.quantity} x {booking.pricing?.currency || 'INR'} {ticket.pricePerTicket}</p>
                                    </div>
                                    <p className="font-black text-gray-900 tracking-tighter">{booking.pricing?.currency || 'INR'} {ticket.totalPrice.toLocaleString()}</p>
                                </div>
                            ))}

                            <div className="border-t border-dashed border-gray-100 my-2" />

                            <div className="space-y-2">
                                <ReceiptRow label="Subtotal" value={booking.pricing?.subtotal} />
                                <ReceiptRow label="Convenience Fee" value={booking.pricing?.convenienceFee} />
                                <ReceiptRow label="Tax" value={booking.pricing?.tax} />
                            </div>

                            <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                                        TXN ID: <span className="text-gray-400">{booking.payment?.transactionId || 'N/A'}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-xynemaRose tracking-tighter">
                                        {booking.pricing?.currency || 'INR'} {booking.pricing?.totalAmount?.toLocaleString()}
                                    </span>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        Paid via {(booking.payment?.method || 'Card').toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 print:hidden">
                    <button
                        onClick={handleDownload}
                        className="w-full h-14 rounded-2xl bg-xynemaRose text-white text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-xynemaRose/10 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Download size={14} /> Download Pass
                    </button>
                </div>

                {/* <div className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 print:hidden">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                        <Info size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-wide">
                        <span className="text-gray-900 font-black">Entry Rule:</span> This pass is only valid for a single entry. Please have it ready for scanning at the venue gate.
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
            {subValue && <p className="text-[10px] font-bold text-xynemaRose uppercase mt-0.5 truncate">{subValue}</p>}
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
            <p className="text-xynemaRose font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Loading Pass</p>
        </div>
    </div>
);

export default EventBookingDetailsPage;
