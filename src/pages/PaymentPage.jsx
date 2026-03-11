import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, MapPin, ShieldCheck, CheckCircle, ChevronRight, Info, Ticket, Coffee, User, CreditCard, Building, Wallet, Smartphone } from 'lucide-react';
import SEO from '../components/SEO';
import { getShowSeats, getFoodAndBeverages, confirmBooking } from '../services/bookingService';
import { initiatePayment } from '../services/paymentService';
import LoadingScreen from '../components/LoadingScreen';
import bookingSessionManager from '../utils/bookingSessionManager';
import TicketCard from '../components/TicketCard';

const PaymentPage = () => {
    const { slug, theaterSlug } = useParams();
    const navigate = useNavigate();
    const showId = sessionStorage.getItem('booking_show_id');

    const [bookingState, setBookingState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState(null);
    const [show, setShow] = useState(null);
    const [showSeats, setShowSeats] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [timeLeft, setTimeLeft] = useState(600);
    const [mobileNumber, setMobileNumber] = useState('');
    const [emailDetails, setEmailDetails] = useState('');

    const seats = useMemo(() => bookingState?.seats || [], [bookingState]);
    const cartData = useMemo(() => bookingState?.cart || {}, [bookingState]);
    const sessionId = bookingState?.sessionId;
    const selectedDate = bookingState?.date;

    const isBookingConfirmedRef = useRef(false);
    const seatsRef = useRef([]);

    // Validation
    const isFormValid = mobileNumber.trim().length >= 10;

    // Keep seats ref in sync for cleanup closure
    useEffect(() => {
        seatsRef.current = seats;
    }, [seats]);

    const paymentMethods = [
        { id: 'upi', name: 'UPI / QR', icon: <Smartphone className="w-5 h-5" /> },
        { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'netbanking', name: 'Net Banking', icon: <Building className="w-5 h-5" /> },
        { id: 'wallet', name: 'Wallets', icon: <Wallet className="w-5 h-5" /> },
    ];

    useEffect(() => {
        if (isBookingConfirmedRef.current) return;

        const sessionValidation = bookingSessionManager.validateSession();
        if (!sessionValidation.valid) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
            return;
        }

        const draftValidation = bookingSessionManager.validateBookingDraft(['seats']);
        if (!draftValidation.valid) {
            navigate(`/movie/${slug}/${theaterSlug}/seats`, { replace: true });
            return;
        }

        setBookingState(draftValidation.draft);
        bookingSessionManager.refreshSession();

        // Calculate initial time left based on session start
        const sessionStart = sessionStorage.getItem('booking_session_start');
        if (sessionStart) {
            const elapsed = Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
            const remaining = Math.max(0, 600 - elapsed);
            setTimeLeft(remaining);
        }
    }, [showId, theaterSlug, slug, navigate]);

    // Timer Countdown Logic
    useEffect(() => {
        if (timeLeft <= 0 || success) return;

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
    }, [timeLeft, success]);

    // Handle Unmount/Navigation Cleanup (Auto-release seats)
    useEffect(() => {
        return () => {
            if (!isBookingConfirmedRef.current && seatsRef.current.length > 0) {
                console.log('[PaymentPage] Navigated away, releasing seats:', seatsRef.current);
                bookingSessionManager.clearSession(seatsRef.current);
            }
        };
    }, []);

    const handleExpiration = async () => {
        if (isBookingConfirmedRef.current) return;

        setIsProcessing(true);
        setError("Session expired. Releasing seats...");

        try {
            await bookingSessionManager.clearSession(seatsRef.current);
            setTimeout(() => {
                navigate(`/movie/${slug}/theaters`, { replace: true });
            }, 2000);
        } catch (err) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };


    useEffect(() => {
        const loadRazorpay = () => {
            return new Promise((resolve) => {
                if (window.Razorpay) {
                    resolve(true);
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
        };

        const fetchData = async () => {
            const theaterId = bookingState?.theaterId;
            if (!showId || !theaterId) return;

            try {
                setLoading(true);
                const [showResponse, foodResponse] = await Promise.all([
                    getShowSeats(showId),
                    getFoodAndBeverages(theaterId),
                    loadRazorpay()
                ]);

                // Transform API response to match component expectations
                let foodItemsData = [];
                if (foodResponse?.data?.items) {
                    try {
                        const itemsObject = foodResponse.data.items;
                        foodItemsData = Object.values(itemsObject).flat().map(item => ({
                            id: item._id || item.id,
                            name: item.item_name || item.name,
                            category: item.category,
                            price: item.selling_price || item.price,
                            image: item.foodImageUrl || item.image || '🍿',
                            description: item.description || '',
                            available: item.is_available !== false
                        })).filter(item => item.available);
                    } catch (error) {
                        console.error('Error processing food items:', error);
                        foodItemsData = [];
                    }
                }

                setShow(showResponse.show);
                setShowSeats(showResponse.seats || []);
                setFoodItems(foodItemsData);
            } catch (err) {
                console.error('Failed to fetch payment data:', err);
                setError('Failed to load booking details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (showId && bookingState) fetchData();
    }, [showId, bookingState]);

    const ticketsTotal = useMemo(() => {
        if (!seats.length || !showSeats.length) return seats.length * (show?.basePrice || 250);
        return seats.reduce((total, seatId) => {
            const seat = showSeats.find(s => (s.id || s._id) === seatId);
            return total + (seat?.price || show?.basePrice || 0);
        }, 0);
    }, [showSeats, seats, show]);

    const snackTotal = useMemo(() => {
        return Object.entries(cartData).reduce((total, [id, qty]) => {
            const item = foodItems.find(f => String(f.id) === String(id));
            return total + (item?.price || 0) * qty;
        }, 0);
    }, [cartData, foodItems]);

    const subTotal = ticketsTotal + snackTotal;
    const convenienceFee = subTotal * 0.1; // 10% Convenience Fee
    const grandTotal = subTotal + convenienceFee;

    const handlePayment = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Development/Testing Flow: Generate random transaction ID
            const randomTxnId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const bookingPayload = {
                seatIds: seats,
                sessionId: sessionId,
                paymentDetails: {
                    method: selectedMethod,
                    transactionId: randomTxnId
                }
            };

            const result = await confirmBooking(showId, bookingPayload);
            handleBookingSuccess(result);

        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'Could not process booking. Please try again.');
            setIsProcessing(false);
        }
    };

    const localDisplayTitle = show?.movie?.title || show?.movie?.MovieName || show?.movieName || sessionStorage.getItem('booking_movie_title') || 'Movie';
    const localDisplayPoster = show?.movie?.portraitPosterUrl || show?.movie?.posterUrl || show?.posterUrl || sessionStorage.getItem('booking_movie_poster') || '';
    const localDisplayTheater = sessionStorage.getItem('booking_theater_name') || show?.theatre?.name || show?.theaterName || 'Theater';
    const localDisplayTime = show?.startTime || show?.showTime || sessionStorage.getItem('booking_show_time') || '';
    const localDisplayLanguage = sessionStorage.getItem('booking_movie_language') || show?.movieLanguage || 'English';
    const localDisplayFormat = sessionStorage.getItem('booking_movie_format') || show?.format || '2D';
    const rawScreen = sessionStorage.getItem('booking_screen_name') || show?.screen?.name || (typeof show?.screen === 'string' ? show.screen : '1');
    const localDisplayScreen = rawScreen.toLowerCase().includes('screen') ? rawScreen : `Screen ${rawScreen}`;

    const handleBookingSuccess = async (successResult) => {
        if (successResult && successResult.success) {
            const b = successResult.data?.booking || successResult.data || {};
            const localConfirmedBooking = {
                id: b.bookingId || b.id || b._id || `BK${Date.now()}`,
                movieTitle: b.movieTitle || localDisplayTitle,
                posterUrl: b.posterUrl || localDisplayPoster,
                theaterName: b.theaterName || localDisplayTheater,
                city: b.city || show?.theatre?.city || 'N/A',
                date: b.date || b.showDate || selectedDate,
                time: b.time || b.showTime || localDisplayTime,
                screen: b.screen || localDisplayScreen,
                seats: b.seats ? b.seats.map(s => {
                    if (typeof s === 'object' && s !== null) {
                        const r = s.row || '';
                        const n = s.seatNumber || s.number || s.seatLabel || s.label || s.seat_number || '';
                        return `${r}${n}`;
                    }
                    return s;
                }) : showSeats.filter(s => seats.includes(s.id || s._id)).map(s => `${s.row || ''}${s.seatNumber || s.number || s.seatLabel || s.label || s.seat_number || ''}`),
                totalAmount: b.totalAmount || grandTotal,
                status: 'confirmed'
            };

            setConfirmedBooking(localConfirmedBooking);
            isBookingConfirmedRef.current = true;
            await bookingSessionManager.clearSession([]);
            setSuccess(true);
        } else {
            setError(successResult?.message || 'Payment verified but booking confirmation failed. Please contact support.');
            setIsProcessing(false);
        }
    };

    if (loading) return <LoadingScreen message="Securing Connection" />;
    if (success) return <SuccessScreen booking={confirmedBooking} />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300 text-text dark:text-darkText">
            <SEO title={`Payment - ${localDisplayTitle}`} />

            {/* Standard Header */}
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
                    <span>Seats reserved for <span className="font-bold text-[#ea580c] dark:text-orange-400">{formatTime(timeLeft)}</span></span>
                </div>
            </div>

            <main className="flex-1 w-[80%] max-w-[1800px] mx-auto px-4 sm:px-6 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                    {/* Left Column: Flow */}
                    <div className="flex-1 max-w-[700px] space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                                <Info className="w-5 h-5 text-red-500" />
                                <p className="text-sm font-bold text-red-900">{error}</p>
                            </div>
                        )}

                        {/* Contact Details Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[18px] font-black text-gray-900 dark:text-white mb-6 font-display uppercase italic">Contact Details</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[13px] text-gray-600 dark:text-gray-400 mb-2">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        placeholder="Enter 10 digit mobile number"
                                        className="w-full bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans"
                                    />
                                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-2">Tickets will be sent to this number via SMS</p>
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-600 dark:text-gray-400 mb-2">
                                        Email Address <span className="text-gray-400 dark:text-gray-500 text-[11px]">(Optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={emailDetails}
                                        onChange={(e) => setEmailDetails(e.target.value)}
                                        placeholder="Enter email for ticket confirmation"
                                        className="w-full bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Payment Method Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[18px] font-black text-gray-900 dark:text-white mb-8 font-display uppercase italic">Choose Payment Method</h2>

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
                                        {/* Simplified generic representation since we lack specific SVG files */}
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
                                            <span className="text-[#FD4960] dark:text-blue-200 font-black text-lg tracking-tighter">Pay</span><span className="text-[#00baf2] font-black text-lg tracking-tighter">tm</span>
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

                    {/* Right Column: Redesigned Booking Summary */}
                    <aside className="w-full lg:w-[380px] shrink-0">
                        <div className="sticky top-28 bg-white dark:bg-gray-900 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-colors duration-300">

                            {/* Full Width Top Poster */}
                            <div className="w-full h-40 relative group overflow-hidden bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                <img
                                    src={localDisplayPoster || "/logo.png"}
                                    alt={localDisplayTitle}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 to-transparent"></div>
                                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-wider font-display">{localDisplayTitle}</h2>
                                    <span className="text-[10px] text-white/70 border border-white/20 px-2 py-0.5 rounded backdrop-blur-sm uppercase font-display">{localDisplayFormat}</span>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 flex flex-col gap-6">
                                {/* Cinema Details */}
                                <div>
                                    <h3 className="text-gray-700 dark:text-gray-200 font-medium text-[15px] flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        {localDisplayTheater}
                                    </h3>
                                    <p className="text-[13px] text-gray-400 dark:text-gray-500 ml-6 mb-3">{show?.theatre?.city || 'Kochi'}</p>
                                    <div className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-gray-400 ml-6">
                                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        <span>{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} • {localDisplayTime}</span>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                                {/* Seats */}
                                <div>
                                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">Selected Seats</p>
                                    <div className="flex flex-wrap gap-2">
                                        {showSeats.filter(s => seats.includes(s.id || s._id)).map(s => {
                                            const r = s.row || '';
                                            const n = s.seatNumber || s.number || s.seatLabel || s.label || s.seat_number || '';
                                            return (
                                                <span key={s.id || s._id} className="bg-primary text-white px-3 py-1 rounded-full text-[12px] font-black font-display shadow-sm shadow-primary/20">
                                                    {r}{n}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                                {/* Price Breakdown Wrapper (if we wanted to show details) */}

                                {/* Total & Pay Button */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-black text-gray-800 dark:text-gray-200 flex items-center gap-1 cursor-pointer hover:text-primary dark:hover:text-primary font-display uppercase tracking-wider">
                                            Total Amount
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </span>
                                        <span className="text-2xl font-black text-primary font-display">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !isFormValid}
                                        className={`w-full py-4 rounded-xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 
                                            ${!isFormValid
                                                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                : isProcessing
                                                    ? 'bg-primary/50 text-white opacity-100 pointer-events-none'
                                                    : 'bg-primary hover:brightness-110 text-white active:scale-95 shadow-xl shadow-primary/20 uppercase tracking-widest font-display'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            `Pay ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                                        )}
                                    </button>

                                    <div className="mt-4 text-center space-y-2">
                                        <div className="flex justify-center items-center gap-2 text-[11px] text-[#22c55e] font-medium">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Secure Payment
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium px-4">
                                            By completing this purchase you agree to our <span className="underline cursor-pointer">Terms & Conditions</span>
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

const SuccessScreen = ({ booking }) => {
    const navigate = useNavigate();

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
                        Your tickets for <span className="text-slate-900 dark:text-white border-b-2 border-primary/20 pb-0.5">{booking?.movieTitle}</span> are ready.
                    </p>
                </div>

                <div className="space-y-4 pt-6">
                    <button
                        onClick={() => navigate(`/bookings/${booking?.id}`)}
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
};

export default PaymentPage;
