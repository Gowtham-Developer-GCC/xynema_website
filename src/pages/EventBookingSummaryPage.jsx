import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, Phone, ShieldCheck, CheckCircle, ChevronRight, Info, CreditCard, Coffee, Smartphone, Building, Wallet } from 'lucide-react';
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
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    const paymentMethods = [
        { id: 'upi', name: 'UPI / QR', icon: <Smartphone className="w-5 h-5" /> },
        { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'netbanking', name: 'Net Banking', icon: <Building className="w-5 h-5" /> },
        { id: 'wallet', name: 'Wallets', icon: <Wallet className="w-5 h-5" /> },
    ];

    const totalTickets = selectedTickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;

    useEffect(() => {
        if (!event || !reservationId) {
            navigate('/events');
        }
    }, [event, reservationId, navigate]);

    // Timer Countdown Logic
    useEffect(() => {
        if (timeLeft <= 0 || booked) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleExpiration();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, booked]);

    const handleExpiration = () => {
        alert("Session time is over. Please try booking again.");
        navigate('/events', { replace: true });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
            // Development/Testing Flow: Generate random transaction ID
            const randomTxnId = `EVT${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const bookingData = {
                paymentDetails: {
                    method: selectedMethod,
                    transactionId: randomTxnId,
                    gateway: 'manual'
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
                alert(result.message || 'Booking confirmation failed. Please contact support.');
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            alert('Could not process booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!event) return <LoadingScreen />;

    if (booked) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-10 text-center shadow-2xl dark:shadow-none space-y-8 animate-in zoom-in duration-500 border border-transparent dark:border-gray-800">
                    <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-100 dark:border-green-800/50">
                        <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">SUCCESS!</h1>
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium leading-relaxed">
                            Your tickets for <span className="text-indigo-600 dark:text-indigo-400 font-bold">{event.name}</span> are confirmed.
                            Check your email for details.
                        </p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <button onClick={() => navigate('/event-booking/bookings')} className="w-full bg-indigo-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-[0.98] transition-all">VIEW TICKETS</button>
                        <button onClick={() => navigate('/')} className="w-full text-slate-400 dark:text-gray-500 font-black text-xs uppercase tracking-widest py-2 hover:text-slate-600 dark:hover:text-gray-300 transition-colors">BACK TO HOME</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-black tracking-[0.2em] text-slate-900 dark:text-white uppercase">BOOKING SUMMARY</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1 h-1 rounded-full animate-pulse ${timeLeft < 60 ? 'bg-red-600' : 'bg-indigo-600'}`}></span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${timeLeft < 60 ? 'text-red-600' : 'text-slate-400 dark:text-gray-500'}`}>
                                Session Expires in {formatTime(timeLeft)}
                            </span>
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
                        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Attendee Details
                                </h3>
                            </div>

                            <div className="p-8 space-y-10">
                                {attendees.map((attendee, index) => (
                                    <div key={index} className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {index === 0 ? 'Primary Attendee' : `Attendee ${index + 1}`}
                                            </span>
                                            {index === 0 && (
                                                <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">MANDATORY</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="Enter attendee's full name"
                                                        value={attendee.name}
                                                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-gray-800/50 border-2 rounded-2xl text-sm font-bold transition-all outline-none ${errors[`${index}-name`] ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400' : 'border-transparent dark:border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-600 dark:focus:border-indigo-500 text-slate-900 dark:text-white'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-600 transition-colors" />
                                                    <input
                                                        type="email"
                                                        placeholder="name@email.com"
                                                        value={attendee.email}
                                                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-gray-800/50 border-2 rounded-2xl text-sm font-bold transition-all outline-none ${errors[`${index}-email`] ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400' : 'border-transparent dark:border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-600 dark:focus:border-indigo-500 text-slate-900 dark:text-white'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-600 transition-colors" />
                                                    <input
                                                        type="tel"
                                                        placeholder="10-digit mobile number"
                                                        maxLength={10}
                                                        value={attendee.phone}
                                                        onChange={(e) => updateAttendee(index, 'phone', e.target.value.replace(/\D/g, ''))}
                                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-gray-800/50 border-2 rounded-2xl text-sm font-bold transition-all outline-none ${errors[`${index}-phone`] ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400' : 'border-transparent dark:border-transparent focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-600 dark:focus:border-indigo-500 text-slate-900 dark:text-white'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Payment Selection Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Select Payment Method
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Dev Mode</span>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${selectedMethod === method.id ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-slate-200 dark:hover:border-gray-700'}`}
                                        >
                                            <div className={`p-3 rounded-xl ${selectedMethod === method.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500'}`}>
                                                {method.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{method.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 leading-none mt-1">Instant confirmation</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-tighter mb-1">Encrypted Checkout</h4>
                                        <p className="text-[10px] font-medium text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                                            Your payment details are encrypted and processed securely. We occupy zero knowledge of your private data.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Sidebar Summary */}
                    <aside className="w-full lg:w-[400px]">
                        <div className="sticky top-28 space-y-6">
                            {/* Main Summary Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
                                {/* Event Banner Mini */}
                                <div className="p-6 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 flex gap-4">
                                    <img
                                        src={event.imageUrl}
                                        alt={event.name}
                                        className="w-16 h-20 object-cover rounded-xl shadow-lg shadow-black/5"
                                    />
                                    <div className="flex-1 min-w-0 py-1">
                                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 truncate">{event.name}</h2>
                                        <div className="flex flex-col gap-1 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-indigo-500" /> {event.city}</div>
                                            <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-indigo-500" /> {new Date(selectedDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Details */}
                                <div className="p-8 space-y-6">
                                    <h3 className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Your Selection</h3>
                                    <div className="space-y-4">
                                        {selectedTickets?.map((ticket, idx) => (
                                            <div key={idx} className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-slate-800 dark:text-gray-200 uppercase tracking-tight">{ticket.className}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500">Qty: {ticket.quantity}</p>
                                                </div>
                                                <span className="text-xs font-black text-slate-900 dark:text-white">₹{ticket.totalPrice.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Billing */}
                                    <div className="pt-6 border-t border-slate-100 dark:border-gray-800 space-y-4">
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-gray-800/50 px-4 py-4 rounded-2xl">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Total to Pay</span>
                                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">₹{totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full relative group"
                                    >
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <div className={`relative w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-2xl transition-all ${isProcessing ? 'opacity-90' : 'hover:scale-[1.02] active:scale-98'}`}>
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
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tighter">100% SECURE TRANSACTION</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Alert */}
                            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                                <Info className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                                <p className="text-[10px] font-bold text-amber-900/60 dark:text-amber-400/60 leading-relaxed uppercase tracking-tight">
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
