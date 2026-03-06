import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, Phone, ShieldCheck, CheckCircle, ChevronRight, Info } from 'lucide-react';
import { confirmEventBooking } from '../services/eventService';
import { initiatePayment } from '../services/paymentService';
import LoadingScreen from '../components/LoadingScreen';

const EventBookingSummaryPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { event, reservationId, selectedTickets, totalAmount, selectedDate, selectedTime } = location.state || {};

    const [attendees, setAttendees] = useState([{
        name: '',
        email: '',
        phone: '',
        ticketClassId: selectedTickets?.[0]?.ticketClassId || '',
        className: selectedTickets?.[0]?.className || ''
    }]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [booked, setBooked] = useState(false);
    const [errors, setErrors] = useState({});

    const totalTickets = selectedTickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;

    useEffect(() => {
        if (!event || !reservationId) {
            navigate('/events');
        }
    }, [event, reservationId, navigate]);

    const updateAttendee = (index, field, value) => {
        const updated = [...attendees];
        updated[index][field] = value;
        setAttendees(updated);

        if (errors[`${index}-${field}`]) {
            const newErrors = { ...errors };
            delete newErrors[`${index}-${field}`];
            setErrors(newErrors);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        attendees.forEach((attendee, index) => {
            if (!attendee.name.trim()) newErrors[`${index}-name`] = 'Name is required';
            if (!attendee.email.trim()) {
                newErrors[`${index}-email`] = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)) {
                newErrors[`${index}-email`] = 'Invalid email';
            }
            if (!attendee.phone.trim()) {
                newErrors[`${index}-phone`] = 'Phone is required';
            } else if (!/^[6-9]\d{9}$/.test(attendee.phone)) {
                newErrors[`${index}-phone`] = 'Invalid phone';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePayment = async () => {
        if (!validateForm()) return;

        setIsProcessing(true);
        try {
            // 1. Initiate Payment with Backend to get Razorpay Order
            const paymentData = {
                amount: totalAmount,
                currency: 'INR',
                receipt: `receipt_${reservationId}`,
                notes: { reservationId, eventName: event.name }
            };

            const rzpOrder = await initiatePayment(paymentData);

            // 2. Open Razorpay Checkout
            const options = {
                key: rzpOrder.key || 'rzp_test_placeholder', // Usually provided by backend or env
                amount: rzpOrder.amount, // in paise
                currency: "INR",
                name: "XYNEMA",
                description: `Booking for ${event.name}`,
                image: event.imageUrl || "/logo.png",
                order_id: rzpOrder.id,
                handler: async (response) => {
                    // 3. Confirm Booking on Success
                    const bookingData = {
                        paymentDetails: {
                            method: 'razorpay',
                            transactionId: response.razorpay_payment_id,
                            gateway: 'razorpay',
                            details: {
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature
                            }
                        },
                        attendees: attendees.map(a => ({
                            name: a.name.trim(),
                            email: a.email.trim(),
                            phone: a.phone.trim(),
                            ticketClassId: a.ticketClassId
                        })),
                        source: 'web'
                    };

                    const result = await confirmEventBooking(reservationId, bookingData);
                    if (result.success) {
                        setBooked(true);
                    } else {
                        alert('Payment verified but booking confirmation failed. Please contact support.');
                    }
                },
                prefill: {
                    name: attendees[0].name,
                    email: attendees[0].email,
                    contact: attendees[0].phone
                },
                theme: { color: "#E11D48" }, // xynemaRose color
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert("Payment Failed: " + response.error.description);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (error) {
            console.error('Payment preparation error:', error);
            alert('Could not initiate payment. Please try again.');
            setIsProcessing(false);
        }
    };

    if (!event) return <LoadingScreen />;

    if (booked) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-2xl space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto border-2 border-green-100">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">SUCCESS!</h1>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Your tickets for <span className="text-rose-600 font-bold">{event.name}</span> are confirmed.
                            Check your email for details.
                        </p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <button onClick={() => navigate('/event-booking/bookings')} className="w-full bg-rose-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-rose-200">VIEW TICKETS</button>
                        <button onClick={() => navigate('/')} className="w-full text-slate-400 font-black text-xs uppercase tracking-widest py-2">BACK TO HOME</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-3 rounded-full hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-black tracking-[0.2em] text-slate-900 uppercase">BOOKING SUMMARY</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1 h-1 bg-rose-600 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-400">Order Locked for 10:00</span>
                        </div>
                    </div>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Forms */}
                    <div className="flex-1 space-y-8">
                        {/* Attendee Info Section */}
                        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Attendee Details
                                </h3>
                            </div>

                            <div className="p-8 space-y-10">
                                {attendees.map((attendee, index) => (
                                    <div key={index} className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                {index === 0 ? 'Primary Attendee' : `Attendee ${index + 1}`}
                                            </span>
                                            {index === 0 && (
                                                <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">MANDATORY</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="Enter attendee's full name"
                                                        value={attendee.name}
                                                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold transition-all outline-none ${errors[`${index}-name`] ? 'border-red-200 bg-red-50 text-red-900' : 'border-transparent focus:bg-white focus:border-rose-600'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                                                    <input
                                                        type="email"
                                                        placeholder="name@email.com"
                                                        value={attendee.email}
                                                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold transition-all outline-none ${errors[`${index}-email`] ? 'border-red-200 bg-red-50 text-red-900' : 'border-transparent focus:bg-white focus:border-rose-600'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                                                    <input
                                                        type="tel"
                                                        placeholder="10-digit mobile number"
                                                        maxLength={10}
                                                        value={attendee.phone}
                                                        onChange={(e) => updateAttendee(index, 'phone', e.target.value.replace(/\D/g, ''))}
                                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold transition-all outline-none ${errors[`${index}-phone`] ? 'border-red-200 bg-red-50 text-red-900' : 'border-transparent focus:bg-white focus:border-rose-600'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Security Badge */}
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-blue-900 uppercase tracking-tighter mb-1">Secure Checkout</h4>
                                <p className="text-[10px] font-medium text-blue-700/70 leading-relaxed">
                                    Your payment details are encrypted and processed securely by Razorpay. We do not store your card or bank details.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar Summary */}
                    <aside className="w-full lg:w-[400px]">
                        <div className="sticky top-28 space-y-6">
                            {/* Main Summary Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* Event Banner Mini */}
                                <div className="p-6 bg-slate-50 border-b border-slate-100 flex gap-4">
                                    <img
                                        src={event.imageUrl}
                                        alt={event.name}
                                        className="w-16 h-20 object-cover rounded-xl shadow-lg shadow-black/5"
                                    />
                                    <div className="flex-1 min-w-0 py-1">
                                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2 truncate">{event.name}</h2>
                                        <div className="flex flex-col gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-rose-500" /> {event.city}</div>
                                            <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-rose-500" /> {new Date(selectedDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Details */}
                                <div className="p-8 space-y-6">
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Your Selection</h3>
                                    <div className="space-y-4">
                                        {selectedTickets?.map((ticket, idx) => (
                                            <div key={idx} className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{ticket.className}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">Qty: {ticket.quantity}</p>
                                                </div>
                                                <span className="text-xs font-black text-slate-900">₹{ticket.totalPrice.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Billing */}
                                    <div className="pt-6 border-t border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center bg-slate-50 px-4 py-4 rounded-2xl">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total to Pay</span>
                                            <span className="text-2xl font-black text-rose-600 tracking-tighter">₹{totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full relative group"
                                    >
                                        <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-rose-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <div className={`relative w-full flex items-center justify-center gap-3 bg-rose-600 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-2xl transition-all ${isProcessing ? 'opacity-90' : 'hover:scale-[1.02] active:scale-98'}`}>
                                            {isProcessing ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>In Progress...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Pay ₹{totalAmount.toFixed(2)}</span>
                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </button>

                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">100% SECURE TRANSACTION</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Alert */}
                            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                                <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed uppercase tracking-tight">
                                    Tickets are non-refundable once the booking is confirmed. Please review your details carefully.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default EventBookingSummaryPage;
