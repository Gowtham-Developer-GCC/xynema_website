import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, Phone, ShieldCheck, CheckCircle, ChevronRight, Info, CreditCard, Smartphone, Building, Wallet, Ticket, Scissors, Percent, Tag } from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import { getTurfDetails, getAvailableSlots, reserveSlots, confirmTurfBooking, cancelTurfReservation } from "../services/turfService";

// Fallback for toast notifications if react-hot-toast is not available
const toast = {
    error: (msg) => alert(`Error: ${msg}`),
    success: (msg) => alert(`Success: ${msg}`)
};

const TurfPaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reservation, turf, court, sport, date } = location.state || {};

    const [isProcessing, setIsProcessing] = useState(false);
    const [booked, setBooked] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [notes, setNotes] = useState('Keep lights on');
    const [isAdvancePayment, setIsAdvancePayment] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [timeLeft, setTimeLeft] = useState(reservation?.expiresInSeconds || 300);

    const bookedRef = useRef(false);
    const cancelledRef = useRef(false);

    useEffect(() => {
        if (!reservation) {
            navigate('/sports');
        }
    }, [reservation, navigate]);

    useEffect(() => {
        bookedRef.current = booked;
    }, [booked]);

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

    const handleExpiration = async () => {
        if (reservation?.slotIds && !cancelledRef.current) {
            cancelledRef.current = true;
            // Formal cancellation request
            await cancelTurfReservation(reservation.slotIds);
            
            toast.error("Session expired. Please reserve your slots again.");
            
            // Short delay to let the user see the toast before navigating back
            setTimeout(() => {
                navigate(-1);
            }, 1500);
        }
    };

    const handleBack = async () => {
        if (reservation?.slotIds && !cancelledRef.current) {
            cancelledRef.current = true;
            await cancelTurfReservation(reservation.slotIds);
        }
        navigate(-1);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePayment = async () => {
        if (mobileNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsProcessing(true);
        try {
            // Generate a random transaction ID for demo/online payment
            const txnId = `TXN_TURF_${Date.now()}`;
            
            const bookingData = {
                slotIds: reservation.slotIds,
                isAdvancePayment: isAdvancePayment,
                paymentMethod: "online",
                transactionId: txnId,
                notes: notes,
                phone: mobileNumber,
                email: email,
                couponCode: couponCode
            };

            const result = await confirmTurfBooking(bookingData);
            
            if (result) {
                setBookingResult(result);
                setBooked(true);
                window.scrollTo({ top: 0, behavior: 'instant' });
            } else {
                toast.error('Could not confirm booking. Please contact support.');
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            toast.error('Could not process booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!reservation) return <LoadingScreen message="Securing Session..." />;

    const turfFee = reservation.totalPrice;
    const convenienceFee = Math.round((turfFee * (turf?.convenienceFeePercent || 0)) / 100);
    const finalDisplayAmount = isAdvancePayment ? (turfFee / 2) + convenienceFee : turfFee + convenienceFee;

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
                            Your reservation at <span className="text-slate-900 dark:text-white border-b-2 border-primary/20 pb-0.5">{turf?.venueName}</span> is complete.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                        <button
                            onClick={() => {
                                const bId = bookingResult?.bookings?.[0]?.bookingId || bookingResult?.bookingId || bookingResult?._id || bookingResult?.id;
                                navigate(`/sports/bookings/${bId}`, { state: { isNewBooking: true } });
                            }}
                            className="w-full bg-primary text-white font-black text-[11px] md:text-xs uppercase tracking-[0.15em] py-4 rounded-xl md:rounded-2xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] font-roboto"
                        >
                            View Ticket
                        </button>
                        <button
                            onClick={() => navigate(`/sports`)}
                            className="w-full bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500 font-black text-[10px] md:text-[11px] uppercase tracking-widest py-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-gray-700 transition-all hover:bg-slate-100 dark:hover:bg-gray-750 font-roboto"
                        >
                            Back to Sports
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300 text-slate-900 dark:text-gray-100">
            <SEO title={`Secure Checkout - ${turf?.venueName}`} />
            
            <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300 sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-12 md:h-20 flex items-center">
                    <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <h1 className="flex-1 text-center font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px] md:text-base mr-8">Secure Checkout</h1>
                </div>
            </header>

            {/* Timer Banner */}
            <div className="bg-[#fff7ed] dark:bg-orange-950/20 border-b border-[#ffedd5] dark:border-orange-900/10 w-full py-2 z-40 transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-center gap-1.5 text-[11px] md:text-[14px] text-gray-800 dark:text-orange-200">
                    <Clock className="w-3.5 h-3.5 text-[#ea580c] dark:text-orange-400" />
                    <span>slot reserved for <span className="font-bold text-[#ea580c] dark:text-orange-400">{formatTime(timeLeft)}</span></span>
                </div>
            </div>

            <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 py-4 md:py-12">
                <div className="flex flex-col lg:flex-row gap-6 md:gap-12">
                    {/* Left Column: Forms */}
                    <div className="flex-1 w-full max-w-[700px] space-y-4 md:space-y-8">
                        {/* Contact Details Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[14px] md:text-lg font-black text-gray-900 dark:text-white mb-6 font-roboto uppercase tracking-wider">Contact Details</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] md:text-[13px] text-gray-600 dark:text-gray-400 mb-2 font-bold uppercase tracking-tight">Mobile Number <span className="text-primary">*</span></label>
                                    <input
                                        type="tel"
                                        placeholder="Enter 10 digit mobile number"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="w-full bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-[13px] md:text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans"
                                    />
                                    <p className="text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">Tickets will be sent to this number via SMS</p>
                                </div>
                                <div>
                                    <label className="block text-[11px] md:text-[13px] text-gray-600 dark:text-gray-400 mb-2 font-bold uppercase tracking-tight">Email Address <span className="opacity-40">(Optional)</span></label>
                                    <input
                                        type="email"
                                        placeholder="Enter email for ticket confirmation"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-[13px] md:text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] md:text-[13px] text-gray-600 dark:text-gray-400 mb-2 font-bold uppercase tracking-tight">Special Notes <span className="opacity-40">(Optional)</span></label>
                                    <textarea
                                        placeholder="Anything else we should know? (e.g., equipment needs, lighting)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-[13px] md:text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Apply Coupons Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[14px] md:text-lg font-black text-gray-900 dark:text-white mb-6 font-roboto uppercase tracking-wider">Apply coupons</h2>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-[13px] md:text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans"
                                    />
                                    <button className="px-6 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all">Apply</button>
                                </div>
                                
                                <div className="pt-2">
                                    <button className="flex items-center justify-between w-full text-[11px] font-bold text-gray-500 uppercase tracking-widest border border-gray-100 dark:border-gray-800 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-500">
                                        <span>Available coupons</span>
                                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Choose Payment Method Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[14px] md:text-lg font-black text-gray-900 dark:text-white mb-6 md:mb-8 font-roboto uppercase tracking-wider">Choose Payment Method</h2>

                            {/* UPI Quick Pay Box */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 md:p-6 bg-[#fafafa] dark:bg-gray-800 relative mb-8 transition-colors duration-300">
                                <div className="absolute top-0 right-4 md:right-6 -translate-y-1/2 bg-[#dcfce7] dark:bg-green-950 text-[#166534] dark:text-green-400 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full border border-[#bbf7d0]/30 dark:border-green-800/20 uppercase tracking-widest">
                                    Recommended
                                </div>
                                <div className="flex items-center gap-3 mb-5 md:mb-6">
                                    <Smartphone className="w-4 h-4 text-primary" />
                                    <h3 className="text-[12px] md:text-[14px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Quick Pay with UPI</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-2 md:gap-4">
                                    <button onClick={() => setSelectedMethod('upi')} className={`bg-white dark:bg-gray-900 border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm overflow-hidden border border-gray-50 p-1">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/960px-Google_Pay_Logo.svg.png?_=20221017164555" alt="GPay" className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-[0.1em]">Google Pay</span>
                                    </button>
                                    <button onClick={() => setSelectedMethod('upi')} className={`bg-white dark:bg-gray-900 border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#5f259f] shadow-sm overflow-hidden p-1">
                                            <span className="text-white text-[10px] font-black italic">पे</span>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-[0.1em]">PhonePe</span>
                                    </button>
                                    <button onClick={() => setSelectedMethod('upi')} className={`bg-white dark:bg-gray-900 border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                                        <div className="h-8 flex items-center justify-center px-1">
                                            <span className="text-[#002e6e] font-black text-[12px] tracking-tight">Pay</span><span className="text-[#00baf2] font-black text-[12px] tracking-tight">tm</span>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-[0.1em]">Paytm</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative flex py-4 md:py-6 items-center">
                                <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em]">Or pay with</span>
                                <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                            </div>

                            {/* Standard Methods */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setSelectedMethod('card')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedMethod === 'card' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg"><CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[12px] md:text-[14px] uppercase tracking-wider">Credit / Debit Card</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px] md:text-[11px] font-medium">Visa, Mastercard, Amex, Rupay</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setSelectedMethod('wallet')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedMethod === 'wallet' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg"><Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[12px] md:text-[14px] uppercase tracking-wider">Wallets</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px] md:text-[11px] font-medium">Amazon Pay, Mobikwik, Freecharge</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setSelectedMethod('netbanking')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedMethod === 'netbanking' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg"><Building className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[12px] md:text-[14px] uppercase tracking-wider">Net Banking</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px] md:text-[11px] font-medium">All major banks supported</p>
                                    </div>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Premium Summary Sidebar */}
                    <aside className="w-full lg:w-[380px] shrink-0">
                        <div className="sticky top-28 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-colors duration-300">
                            <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8">
                                <h2 className="text-[14px] md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest font-roboto">Booking Summary</h2>

                                {/* Date Selection */}
                                <div>
                                    <p className="text-[10px] md:text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Selected Date</p>
                                    <div className="bg-[#fff1f2] dark:bg-pink-950/20 border border-primary/10 rounded-xl p-4 flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <span className="text-[13px] md:text-[14px] font-black text-slate-800 dark:text-gray-100">
                                            {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Slot Selection */}
                                <div>
                                    <p className="text-[10px] md:text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Selected Slot</p>
                                    <div className="bg-[#fff1f2] dark:bg-pink-950/20 border border-primary/10 rounded-xl p-4 flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-[13px] md:text-[14px] font-black text-slate-800 dark:text-gray-100 uppercase">
                                                {reservation.slots?.map(s => `${s.startTime} - ${s.endTime}`).join(', ')}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 capitalize">{sport} • {court?.courtName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Summary Box */}
                                <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-gray-500 font-bold uppercase tracking-tight">Turf Fee (₹{turfFee})</span>
                                        <span className="font-black text-gray-900 dark:text-white">₹{turfFee}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[13px]">
                                        <span className="text-gray-500 font-bold uppercase tracking-tight">Convenience Fee</span>
                                        <span className="font-black text-gray-900 dark:text-white">₹{convenienceFee}</span>
                                    </div>
                                    
                                    <div className="bg-[#fff1f2] dark:bg-pink-950/20 border border-primary/5 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">Pay 50% Advance</span>
                                            <span className="text-[10px] font-bold text-gray-400">Secure booking with ₹{turfFee / 2} + Fixed Fee</span>
                                        </div>
                                        <button 
                                            onClick={() => setIsAdvancePayment(!isAdvancePayment)}
                                            className={`relative w-12 h-6 transition-colors rounded-full ${isAdvancePayment ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-gray-200 dark:bg-gray-800'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAdvancePayment ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                </div>

                                {/* Final Total */}
                                <div className="pt-6 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                                    <h3 className="text-[14px] md:text-[16px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Total Amount</h3>
                                    <span className="text-xl md:text-3xl font-black text-primary font-roboto">₹{finalDisplayAmount}</span>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className={`w-full py-4 md:py-5 rounded-2xl font-black text-[14px] md:text-[16px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-primary/20
                                        ${isProcessing ? 'bg-primary/50 text-white cursor-not-allowed' : 'bg-primary hover:brightness-110 text-white'}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        `Pay ₹${finalDisplayAmount}`
                                    )}
                                </button>

                                <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-wider">Cancellation policy applies • Secure checkout</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 py-4 pb-safe z-50 flex items-center justify-between gap-6 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">To Pay</span>
                    <span className="text-2xl font-black text-primary font-roboto tracking-tight">₹{finalDisplayAmount}</span>
                </div>
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`flex-1 h-14 rounded-2xl font-black text-[14px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2
                        ${isProcessing ? 'bg-primary/50 text-white' : 'bg-primary text-white shadow-xl shadow-primary/20 hover:brightness-110'}`}
                >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>Pay Now <ChevronRight className="w-5 h-5" /></>
                    )}
                </button>
            </div>
            <div className="lg:hidden h-24"></div>
        </div>
    );
};

export default TurfPaymentPage;
