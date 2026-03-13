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
            } else if (!/^\d{10}$/.test(attendee.phone)) {
                newErrors[`${index}-phone`] = 'Invalid phone (enter 10 digits)';
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
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300 font-sans">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[40px] p-10 text-center shadow-2xl dark:shadow-none space-y-10 animate-in zoom-in duration-500 border border-transparent dark:border-gray-800">
                    <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20 dark:border-primary/30 shadow-xl shadow-primary/10 dark:shadow-none">
                        <CheckCircle className="w-12 h-12 text-primary" />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] font-display">BOOKING CONFIRMED</h1>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight font-display italic">YOU'RE ALL SET!</h2>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-gray-500 font-bold leading-relaxed px-4 uppercase tracking-wider">
                            Your tickets for <span className="text-slate-900 dark:text-white border-b-2 border-primary/20 pb-0.5">{event?.name}</span> are ready.
                        </p>
                    </div>

                    <div className="space-y-4 pt-6">
                        <button
                            onClick={() => navigate('/events-bookings')}
                            className="w-full bg-primary text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-display"
                        >
                            VIEW DIGITAL TICKET
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] py-2 hover:text-primary transition-colors font-display"
                        >
                            BACK TO HOME
                        </button>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest font-display">Sent to your registered email</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300 text-slate-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-900 shadow-sm z-50 relative transition-colors duration-300">
                <div className="w-[80%] max-w-[1800px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Orange Timer Banner */}
            <div className="bg-[#fff7ed] dark:bg-orange-950/20 border-b border-[#ffedd5] dark:border-orange-900/10 w-full py-2.5 z-40 transition-colors duration-300">
                <div className="w-[80%] max-w-[1800px] mx-auto px-4 flex items-center justify-center gap-2 text-[14px] text-gray-800 dark:text-orange-200">
                    <Clock className="w-4 h-4 text-[#ea580c] dark:text-orange-400" />
                    <span>Booking session active for <span className="font-bold text-[#ea580c] dark:text-orange-400">{formatTime(timeLeft)}</span></span>
                </div>
            </div>

            <main className="flex-1 w-[80%] max-w-[1800px] mx-auto px-4 sm:px-6 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Left Column: Forms */}
                    <div className="flex-1 max-w-[700px] space-y-8">
                        {/* Attendee Info Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[18px] font-black text-gray-900 dark:text-white mb-6 font-roboto uppercase text-center sm:text-left">Attendee Details</h2>

                            <div className="space-y-10">
                                {attendees.map((attendee, index) => (
                                    <div key={index} className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {index === 0 ? 'Primary Attendee' : `Attendee ${index + 1}`}
                                            </span>
                                            {index === 0 && (
                                                <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase ">MANDATORY</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="block text-[13px] text-gray-600 dark:text-gray-400 mb-2">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Enter attendee's full name"
                                                        name={`attendee-${index}-name`}
                                                        autoComplete="name"
                                                        value={attendee.name}
                                                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                        className={`w-full pl-12 pr-4 py-3.5 bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans ${errors[`${index}-name`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[13px] text-gray-600 dark:text-gray-400 mb-2">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                                                    <input
                                                        type="email"
                                                        placeholder="name@email.com"
                                                        name={`attendee-${index}-email`}
                                                        autoComplete="email"
                                                        value={attendee.email}
                                                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                        className={`w-full pl-12 pr-4 py-3.5 bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans ${errors[`${index}-email`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[13px] text-gray-600 dark:text-gray-400 mb-2">Phone Number</label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                                                    <input
                                                        type="tel"
                                                        placeholder="10-digit mobile number"
                                                        maxLength={10}
                                                        name={`attendee-${index}-phone`}
                                                        autoComplete="tel"
                                                        value={attendee.phone}
                                                        onChange={(e) => updateAttendee(index, 'phone', e.target.value.replace(/\D/g, ''))}
                                                        className={`w-full pl-12 pr-4 py-3.5 bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans ${errors[`${index}-phone`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Payment Method Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[18px] font-black text-gray-900 dark:text-white mb-8 font-roboto uppercase text-center sm:text-left">Choose Payment Method</h2>

                            {/* UPI Quick Pay Box */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-[#fafafa] dark:bg-gray-800/30 relative mb-10 transition-colors duration-300">
                                <div className="absolute top-0 right-6 -translate-y-1/2 bg-[#dcfce7] dark:bg-green-900/30 text-[#166534] dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-full border border-[#bbf7d0] dark:border-green-800/30">
                                    Recommended
                                </div>
                                <div className="flex items-center gap-3 mb-6 mix-blend-multiply dark:mix-blend-normal">
                                    <Smartphone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-200">Quick Pay with UPI</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {/* Google Pay */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                            <div className="flex -space-x-1">
                                                <div className="w-3 h-3 rounded-full bg-[#4285F4]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#EA4335]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#FBBC05]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#34A853]"></div>
                                            </div>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Google Pay</span>
                                    </button>

                                    {/* PhonePe */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-8 h-8 bg-[#5f259f] rounded-full flex items-center justify-center text-white font-bold italic shadow-sm">
                                            पे
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">PhonePe</span>
                                    </button>

                                    {/* Paytm */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="h-8 flex items-center px-1">
                                            <span className="text-primary dark:text-blue-200 font-black text-lg tracking-tighter">Pay</span><span className="text-[#00baf2] font-black text-lg tracking-tighter">tm</span>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Paytm</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative flex py-5 items-center mb-6">
                                <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-[12px]">Or pay with</span>
                                <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                            </div>

                            {/* Other Methods */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setSelectedMethod('card')}
                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${selectedMethod === 'card' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"><CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[14px]">Credit / Debit Card</h3>
                                        <p className="text-gray-400 text-[12px]">Visa, Mastercard, Amex, Rupay</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('wallet')}
                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${selectedMethod === 'wallet' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"><Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[14px]">Wallets</h3>
                                        <p className="text-gray-400 text-[12px]">Amazon Pay, Mobikwik, Freecharge</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('netbanking')}
                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${selectedMethod === 'netbanking' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"><Building className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[14px]">Net Banking</h3>
                                        <p className="text-gray-400 text-[12px]">All major banks supported</p>
                                    </div>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Premium Summary Sidebar */}
                    <aside className="w-full lg:w-[380px] shrink-0">
                        <div className="sticky top-28 bg-white dark:bg-gray-900 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-colors duration-300">

                            {/* Full Width Top Poster */}
                            <div className="w-full h-40 relative group overflow-hidden bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                <img
                                    src={event?.imageUrl || "/logo.png"}
                                    alt={event?.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 to-transparent"></div>
                                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                                    <h2 className="text-[18px] font-black text-white uppercase tracking-wider font-display line-clamp-2">{event?.name}</h2>
                                    <span className="text-[9px] text-white/70 border border-white/20 px-2 py-0.5 rounded backdrop-blur-sm uppercase font-display">EVENT</span>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 flex flex-col gap-6">
                                {/* Location Details */}
                                <div>
                                    <h3 className="text-gray-700 dark:text-gray-200 font-medium text-[15px] flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        {event?.venue || event?.city || 'Venue'}
                                    </h3>
                                    <p className="text-[13px] text-gray-400 dark:text-gray-500 ml-6 mb-3">{event?.city}</p>
                                    <div className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-gray-400 ml-6">
                                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        <span>{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} • {selectedTime}</span>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                                {/* Selection Summary */}
                                <div>
                                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">Your Selection</p>
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
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                                {/* Total & Pay Button */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-black text-gray-800 dark:text-gray-200 flex items-center gap-1 cursor-pointer hover:text-primary dark:hover:text-primary font-roboto uppercase tracking-wider">
                                            Total Amount
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </span>
                                        <span className="text-2xl font-black text-primary font-roboto">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className={`w-full py-4 rounded-xl font-black text-[16px] transition-all flex items-center justify-center gap-2 
                                            ${isProcessing
                                                ? 'bg-primary/50 text-white opacity-100 pointer-events-none'
                                                : 'bg-primary hover:brightness-110 text-white active:scale-95 shadow-xl shadow-primary/20 uppercase tracking-widest font-roboto font-black'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            `Pay ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                                        )}
                                    </button>

                                    <div className="mt-4 text-center space-y-2">
                                        <div className="flex justify-center items-center gap-2 text-[11px] text-[#22c55e] font-medium">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Secure Transaction
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium px-4">
                                            By completing this purchase you agree to our <span className="underline cursor-pointer">Terms & Conditions</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Alert */}
                        <div className="mt-6 p-5 bg-[#fff7ed] dark:bg-orange-950/20 rounded-2xl border border-[#ffedd5] dark:border-orange-900/10 flex items-start gap-3">
                            <Info className="w-4 h-4 text-[#ea580c] dark:text-orange-400 shrink-0" />
                            <p className="text-[10px] font-bold text-[#9a3412] dark:text-orange-400/60 leading-relaxed uppercase tracking-tight">
                                Tickets are non-refundable once the booking is confirmed. Please review your details carefully.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default EventBookingSummaryPage;
