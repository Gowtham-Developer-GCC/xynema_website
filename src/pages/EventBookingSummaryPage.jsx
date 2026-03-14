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
    const [confirmedBooking, setConfirmedBooking] = useState(null);
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
                setConfirmedBooking(result.data?.booking || result.data);
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
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 font-sans">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-center shadow-2xl dark:shadow-none space-y-6 md:space-y-10 animate-in zoom-in duration-500 border border-gray-50 dark:border-gray-800">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20 dark:border-primary/30 shadow-xl shadow-primary/10 dark:shadow-none">
                        <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em] font-roboto">Booking Confirmed</h1>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight font-roboto">Successfully</h2>
                        </div>
                        <p className="text-[11px] md:text-xs text-slate-400 dark:text-gray-500 font-bold leading-relaxed px-2 uppercase tracking-wider">
                            Your tickets for <span className="text-slate-900 dark:text-white border-b-2 border-primary/20 pb-0.5">{event?.name}</span> are ready.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                        <button
                            onClick={() => navigate(`/event-bookings/${confirmedBooking?.bookingId || confirmedBooking?.id}`)}
                            className="w-full bg-primary text-white font-black text-[11px] md:text-xs uppercase tracking-[0.15em] py-4 rounded-xl md:rounded-2xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] font-roboto"
                        >
                            View Digital Ticket
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full text-slate-400 dark:text-gray-500 font-black text-[9px] md:text-[10px] uppercase tracking-widest py-2 hover:text-primary transition-colors font-roboto"
                        >
                            Back to Home
                        </button>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest font-roboto">Sent to your registered email</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300 text-slate-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-12 md:h-20 flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <h1 className="flex-1 text-center font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px] md:text-base mr-8">SECURE CHECKOUT</h1>
                </div>
            </header>

            {/* Orange Timer Banner */}
            <div className="bg-[#fff7ed] dark:bg-orange-950/20 border-b border-[#ffedd5] dark:border-orange-900/10 w-full py-2 z-40 transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-center gap-1.5 text-[11px] md:text-[14px] text-gray-800 dark:text-orange-200">
                    <Clock className="w-3.5 h-3.5 text-[#ea580c] dark:text-orange-400" />
                    <span>Booking session active for <span className="font-bold text-[#ea580c] dark:text-orange-400">{formatTime(timeLeft)}</span></span>
                </div>
            </div>

            <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 py-4 md:py-12">
                <div className="flex flex-col lg:flex-row gap-6 md:gap-12">
                    {/* Left Column: Forms */}
                    <div className="flex-1 w-full max-w-[700px] space-y-4 md:space-y-8">
                        {/* Attendee Info Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-3.5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[14px] md:text-lg font-black text-gray-900 dark:text-white mb-4 md:mb-6 font-roboto uppercase tracking-wider">Attendee Details</h2>

                            <div className="space-y-6 md:space-y-10">
                                {attendees.map((attendee, index) => (
                                    <div key={index} className="space-y-4 md:space-y-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {index === 0 ? 'Primary Attendee' : `Attendee ${index + 1}`}
                                            </span>
                                            {index === 0 && (
                                                <span className="bg-primary/10 text-primary text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">MANDATORY</span>
                                            )}
                                        </div>
 
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-6">
                                            <div className="md:col-span-2 space-y-1 md:space-y-2">
                                                <label className="block text-[11px] md:text-[13px] text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 dark:text-gray-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Enter attendee's full name"
                                                        name={`attendee-${index}-name`}
                                                        autoComplete="name"
                                                        value={attendee.name}
                                                        onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                        className={`w-full pl-10 md:pl-12 pr-4 py-2.5 bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[13px] md:text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans ${errors[`${index}-name`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1 md:space-y-2">
                                                <label className="block text-[11px] md:text-[13px] text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 dark:text-gray-500" />
                                                    <input
                                                        type="email"
                                                        placeholder="name@email.com"
                                                        name={`attendee-${index}-email`}
                                                        autoComplete="email"
                                                        value={attendee.email}
                                                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                        className={`w-full pl-10 md:pl-12 pr-4 py-2.5 bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[13px] md:text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans ${errors[`${index}-email`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1 md:space-y-2">
                                                <label className="block text-[11px] md:text-[13px] text-gray-600 dark:text-gray-400 mb-1">Phone Number</label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 dark:text-gray-500" />
                                                    <input
                                                        type="tel"
                                                        placeholder="10-digit mobile number"
                                                        maxLength={10}
                                                        name={`attendee-${index}-phone`}
                                                        autoComplete="tel"
                                                        value={attendee.phone}
                                                        onChange={(e) => updateAttendee(index, 'phone', e.target.value.replace(/\D/g, ''))}
                                                        className={`w-full pl-10 md:pl-12 pr-4 py-2.5 bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[13px] md:text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans ${errors[`${index}-phone`] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Payment Method Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-3.5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[14px] md:text-lg font-black text-gray-900 dark:text-white mb-4 md:mb-6 font-roboto uppercase tracking-wider">Choose Payment Method</h2>

                            {/* UPI Quick Pay Box */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 md:p-6 bg-[#fafafa] dark:bg-gray-850/50 relative mb-8 md:mb-10 transition-colors duration-300">
                                <div className="absolute top-0 right-4 md:right-6 -translate-y-1/2 bg-[#dcfce7] dark:bg-green-950 text-[#166534] dark:text-green-400 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full border border-[#bbf7d0]/30 dark:border-green-800/20 uppercase tracking-widest">
                                    Recommended
                                </div>
                                <div className="flex items-center gap-3 mb-5 md:mb-6">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                    <h3 className="text-[14px] md:text-[15px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Quick Pay with UPI</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-2 md:gap-4">
                                    {/* Google Pay */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-2 md:p-4 flex flex-col items-center justify-center gap-1.5 md:gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-50 dark:border-gray-800 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                                            <div className="flex -space-x-1 scale-[0.8] md:scale-90">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#4285F4]"></div>
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#EA4335]"></div>
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#FBBC05]"></div>
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#34A853]"></div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] md:text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest truncate w-full text-center">G Pay</span>
                                    </button>
 
                                    {/* PhonePe */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-2 md:p-4 flex flex-col items-center justify-center gap-1.5 md:gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-7 h-7 md:w-8 md:h-8 bg-[#5f259f] rounded-full flex items-center justify-center text-white font-black italic shadow-sm text-xs md:text-sm">
                                            पे
                                        </div>
                                        <span className="text-[9px] md:text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest truncate w-full text-center">PhonePe</span>
                                    </button>
 
                                    {/* Paytm */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-2 md:p-4 flex flex-col items-center justify-center gap-1.5 md:gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="h-7 md:h-8 flex items-center justify-center px-1">
                                            <span className="text-[#002e6e] dark:text-blue-300 font-black text-[12px] md:text-[15px] tracking-tight">Pay</span><span className="text-[#00baf2] font-black text-[12px] md:text-[15px] tracking-tight">tm</span>
                                        </div>
                                        <span className="text-[9px] md:text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest truncate w-full text-center">Paytm</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative flex py-4 md:py-5 items-center mb-5 md:mb-6">
                                <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em]">Or pay with</span>
                                <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                            </div>

                            {/* Other Methods */}
                            <div className="space-y-3 md:space-y-4">
                                <button
                                    onClick={() => setSelectedMethod('card')}
                                    className={`w-full flex items-center gap-3 md:gap-4 p-3.5 md:p-5 rounded-xl md:rounded-2xl border transition-all text-left ${selectedMethod === 'card' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-1.5 md:p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700"><CreditCard className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[12px] md:text-[14px] uppercase tracking-wider">Credit / Debit Card</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px] md:text-[12px] font-medium">Visa, Mastercard, Amex, Rupay</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('wallet')}
                                    className={`w-full flex items-center gap-3 md:gap-4 p-3.5 md:p-5 rounded-xl md:rounded-2xl border transition-all text-left ${selectedMethod === 'wallet' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-1.5 md:p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700"><Wallet className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[12px] md:text-[14px] uppercase tracking-wider">Wallets</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px] md:text-[12px] font-medium">Amazon Pay, Mobikwik, Freecharge</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('netbanking')}
                                    className={`w-full flex items-center gap-3 md:gap-4 p-3.5 md:p-5 rounded-xl md:rounded-2xl border transition-all text-left ${selectedMethod === 'netbanking' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-1.5 md:p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700"><Building className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[12px] md:text-[14px] uppercase tracking-wider">Net Banking</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px] md:text-[12px] font-medium">All major banks supported</p>
                                    </div>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Premium Summary Sidebar */}
                    <aside className="w-full lg:w-[380px] shrink-0">
                        <div className="sticky top-28 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-colors duration-300">

                            {/* Full Width Top Poster */}
                            <div className="w-full h-32 md:h-40 relative group overflow-hidden bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                <img
                                    src={event?.imageUrl || "/logo.png"}
                                    alt={event?.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-gray-950 to-transparent"></div>
                                <div className="absolute bottom-3 md:bottom-4 left-4 md:left-6 right-4 md:right-6 flex items-end justify-between">
                                    <h2 className="text-base md:text-[18px] font-black text-white uppercase tracking-wider font-roboto line-clamp-1 flex-1 mr-4">{event?.name}</h2>
                                    <span className="text-[8px] md:text-[9px] text-white/90 border border-white/30 px-2 py-0.5 rounded-md backdrop-blur-md uppercase font-black tracking-widest bg-white/5">EVENT</span>
                                </div>
                            </div>

                            <div className="p-4 md:p-8 flex flex-col gap-4 md:gap-6">
                                {/* Location Details */}
                                <div>
                                    <h3 className="text-gray-900 dark:text-white font-black text-[13px] md:text-[15px] flex items-center gap-2 mb-1.5 tracking-tight">
                                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />
                                        {event?.venue || event?.city || 'Venue'}
                                    </h3>
                                    <p className="text-[11px] md:text-[12px] text-gray-500 dark:text-gray-400 ml-5.5 font-medium">{event?.city}</p>
                                    <div className="flex items-center gap-2 text-[12px] md:text-[14px] text-gray-700 dark:text-gray-300 ml-5.5 mt-2 font-bold">
                                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />
                                        <span>{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} • {selectedTime}</span>
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
                                    <div className="flex items-center justify-between mb-4 md:mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Total Amount</span>
                                            <span className="text-xl md:text-3xl font-black text-gray-900 dark:text-white font-roboto leading-none">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                        </div>
                                    </div>
 
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className={`w-full py-3 md:py-4 rounded-xl font-black text-[13px] md:text-[16px] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl uppercase tracking-[0.2em]
                                            ${isProcessing
                                                ? 'bg-primary/50 text-white opacity-100 pointer-events-none shadow-none'
                                                : 'bg-primary hover:brightness-110 text-white'
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
 
            {/* Mobile Fixed Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe z-[60] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] transition-colors duration-300">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Final Amount</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white font-roboto tracking-tight">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className={`flex-1 h-11 rounded-xl font-black text-[13px] transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider
                            ${isProcessing
                                ? 'bg-primary/50 text-white pointer-events-none'
                                : 'bg-primary text-white shadow-lg shadow-primary/25 hover:brightness-110'
                            }`}
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <><span>Pay Now</span> <ChevronRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </div>
 
            {/* Spacer for mobile bottom bar */}
            <div className="h-20 lg:hidden"></div>
        </div>
    );
};

export default EventBookingSummaryPage;
