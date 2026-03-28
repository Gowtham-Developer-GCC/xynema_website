import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, MapPin, ShieldCheck, CheckCircle, ChevronRight, Info, Ticket, Coffee, User, CreditCard, Building, Wallet, Smartphone } from 'lucide-react';
import SEO from '../components/SEO';
import { getFoodAndBeverages, confirmBooking } from '../services/bookingService';
import { initiatePayment } from '../services/paymentService';
import LoadingScreen from '../components/LoadingScreen';
import bookingSessionManager from '../utils/bookingSessionManager';
import TicketCard from '../components/TicketCard';
import { calculateBookingTotal } from '../utils/pricing';
import apiCacheManager from '../services/apiCacheManager';
import { optimizeImage } from '../utils/helpers';

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
    const hasFetchedData = useRef(false);

    // Validation
    const isFormValid = mobileNumber.length === 10 && /^\d{10}$/.test(mobileNumber);

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
        if (draftValidation.draft.show) {
            setShow(draftValidation.draft.show);
        }
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
        const fetchData = async () => {
            const theaterId = bookingState?.theaterId;
            if (!showId || !theaterId) return;
            if (hasFetchedData.current) return;
            hasFetchedData.current = true;

            try {
                setLoading(true);
                const [foodResponse] = await Promise.all([
                    apiCacheManager.getOrFetchFood(() => getFoodAndBeverages(theaterId))
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

                setFoodItems(foodItemsData);
                // We no longer need to setShowSeats(showResponse.seats) as we use bookingState.selectedSeats
                // The 'show' object is mostly for fallback metadata which we already have in draft
                if (bookingState.show) {
                    setShow(bookingState.show);
                }
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
        if (bookingState?.pricing?.ticketsTotal !== undefined) return bookingState.pricing.ticketsTotal;
        const selectedSeats = bookingState?.selectedSeats || [];
        if (!selectedSeats.length) return seats.length * (show?.basePrice || 250);
        return selectedSeats.reduce((total, seat) => {
            return total + (seat?.price || show?.basePrice || 0);
        }, 0);
    }, [bookingState?.pricing, bookingState?.selectedSeats, seats, show]);

    const snackTotal = useMemo(() => {
        if (bookingState?.pricing?.snackTotal !== undefined) return bookingState.pricing.snackTotal;
        return Object.entries(cartData).reduce((total, [id, qty]) => {
            const item = foodItems.find(f => String(f.id) === String(id));
            return total + (item?.price || 0) * qty;
        }, 0);
    }, [bookingState?.pricing, cartData, foodItems]);

    const pricingStatus = useMemo(() => {
        if (bookingState?.pricing) return bookingState.pricing;
        return calculateBookingTotal(ticketsTotal, snackTotal);
    }, [bookingState?.pricing, ticketsTotal, snackTotal]);

    const { convenienceFee, gstAmount, finalTotal: grandTotal } = pricingStatus;

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
    const localDisplayPoster = show?.movie?.backdropUrl ||
        show?.movie?.landscapePosterUrl?.url ||
        show?.movie?.landscapePosterUrl ||
        show?.movie?.landscape_poster?.url ||
        sessionStorage.getItem('booking_movie_landscape_poster') ||
        show?.movie?.posterUrl ||
        show?.posterUrl ||
        sessionStorage.getItem('booking_movie_poster') || '';
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
            <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="flex-1 text-center font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm md:text-base mr-8">Secure Checkout</h1>
                </div>
            </header>

            {/* Orange Timer Banner */}
            <div className="bg-[#fff7ed] dark:bg-orange-950/20 border-b border-[#ffedd5] dark:border-orange-900/10 w-full py-2.5 z-40 transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-center gap-2 text-[12px] md:text-[14px] text-gray-800 dark:text-orange-200">
                    <Clock className="w-4 h-4 text-[#ea580c] dark:text-orange-400" />
                    <span>Seats reserved for <span className="font-bold text-[#ea580c] dark:text-orange-400">{formatTime(timeLeft)}</span></span>
                </div>
            </div>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                    {/* Left Column: Flow */}
                    <div className="flex-1 w-full max-w-[700px] space-y-6 md:space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                                <Info className="w-5 h-5 text-red-500" />
                                <p className="text-sm font-bold text-red-900">{error}</p>
                            </div>
                        )}

                        {/* Contact Details Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[16px] md:text-[18px] font-black text-gray-900 dark:text-white mb-6 font-roboto uppercase tracking-wider">Contact Details</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[13px] text-gray-600 dark:text-gray-400 mb-2">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Enter 10 digit mobile number"
                                        maxLength={10}
                                        name="mobile"
                                        autoComplete="tel"
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
                                        name="email"
                                        autoComplete="email"
                                        className="w-full bg-[#f8f9fa] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-850 transition-colors font-sans"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Payment Method Section */}
                        <section className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <h2 className="text-[16px] md:text-[18px] font-black text-gray-900 dark:text-white mb-6 md:mb-8 font-roboto uppercase tracking-wider">Choose Payment Method</h2>

                            {/* UPI Quick Pay Box */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 md:p-6 bg-[#fafafa] dark:bg-gray-850/50 relative mb-8 md:mb-10 transition-colors duration-300">
                                <div className="absolute top-0 right-4 md:right-6 -translate-y-1/2 bg-[#dcfce7] dark:bg-green-950 text-[#166534] dark:text-green-400 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full border border-[#bbf7d0]/30 dark:border-green-800/20 uppercase tracking-widest">
                                    Recommended
                                </div>
                                <div className="flex items-center gap-3 mb-5 md:mb-6">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                    <h3 className="text-[14px] md:text-[15px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Quick Pay with UPI</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-3 md:gap-4">
                                    {/* Google Pay */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full border border-gray-50 dark:border-gray-800 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                                            <div className="flex -space-x-1 scale-90">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#4285F4]"></div>
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#EA4335]"></div>
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#FBBC05]"></div>
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#34A853]"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] md:text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest truncate w-full text-center">G Pay</span>
                                    </button>

                                    {/* PhonePe */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-8 h-8 bg-[#5f259f] rounded-full flex items-center justify-center text-white font-black italic shadow-sm text-sm">
                                            पे
                                        </div>
                                        <span className="text-[10px] md:text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest truncate w-full text-center">PhonePe</span>
                                    </button>

                                    {/* Paytm */}
                                    <button
                                        onClick={() => setSelectedMethod('upi')}
                                        className={`bg-white dark:bg-gray-900 border rounded-xl p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all ${selectedMethod === 'upi' ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="h-8 flex items-center justify-center px-1">
                                            <span className="text-[#002e6e] dark:text-blue-300 font-black text-[15px] tracking-tight">Pay</span><span className="text-[#00baf2] font-black text-[15px] tracking-tight">tm</span>
                                        </div>
                                        <span className="text-[10px] md:text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest truncate w-full text-center">Paytm</span>
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
                                    className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all text-left ${selectedMethod === 'card' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700"><CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[13px] md:text-[14px] uppercase tracking-wider">Credit / Debit Card</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[11px] md:text-[12px] font-medium">Visa, Mastercard, Amex, Rupay</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('wallet')}
                                    className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all text-left ${selectedMethod === 'wallet' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700"><Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[13px] md:text-[14px] uppercase tracking-wider">Wallets</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[11px] md:text-[12px] font-medium">Amazon Pay, Mobikwik, Freecharge</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('netbanking')}
                                    className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all text-left ${selectedMethod === 'netbanking' ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="p-2 bg-[#f8f9fa] dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700"><Building className="w-5 h-5 text-gray-500 dark:text-gray-400" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-800 dark:text-gray-200 text-[13px] md:text-[14px] uppercase tracking-wider">Net Banking</h3>
                                        <p className="text-gray-400 dark:text-gray-500 text-[11px] md:text-[12px] font-medium">All major banks supported</p>
                                    </div>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Redesigned Booking Summary */}
                    <aside className="w-full lg:w-[380px] shrink-0">
                        <div className="sticky top-28 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-colors duration-300">

                            {/* Full Width Top Poster */}
                            <div className="w-full h-36 md:h-40 relative group overflow-hidden bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                                <img
                                    src={optimizeImage(localDisplayPoster, { width: 600, quality: 80 }) || "/logo.png"}
                                    alt={localDisplayTitle}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-gray-950 to-transparent"></div>
                                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-roboto truncate flex-1 mr-4">{localDisplayTitle}</h2>
                                    <span className="text-[9px] md:text-[10px] text-white/90 border border-white/30 px-2 py-0.5 rounded-md backdrop-blur-md uppercase font-black tracking-widest bg-white/5">{localDisplayFormat}</span>
                                </div>
                            </div>

                            <div className="p-5 md:p-8 flex flex-col gap-5 md:gap-6">
                                {/* Cinema Details */}
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <h3 className="text-gray-900 dark:text-white font-black text-[14px] md:text-[15px] truncate tracking-tight">
                                                {localDisplayTheater}
                                            </h3>
                                            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{show?.theatre?.city || 'Kochi'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-[13px] md:text-[14px] text-gray-700 dark:text-gray-300 font-bold">
                                            {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} • {localDisplayTime}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                                {/* Seats */}
                                <div>
                                    <p className="text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-500 mb-3 uppercase tracking-[0.2em]">Selected Seats</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(bookingState?.selectedSeats || []).map(s => {
                                            const r = s.row || '';
                                            const n = s.seatNumber || s.number || s.seatLabel || s.label || s.seat_number || '';
                                            return (
                                                <span key={s.id || s._id} className="bg-primary text-white px-3 py-1.5 rounded-lg text-[11px] md:text-[12px] font-black tracking-widest shadow-lg shadow-primary/20">
                                                    {r}{n}
                                                </span>
                                            );
                                        })}
                                        {!bookingState?.selectedSeats && showSeats.filter(s => seats.includes(s.id || s._id)).map(s => {
                                            const r = s.row || '';
                                            const n = s.seatNumber || s.number || s.seatLabel || s.label || s.seat_number || '';
                                            return (
                                                <span key={s.id || s._id} className="bg-primary text-white px-3 py-1.5 rounded-lg text-[11px] md:text-[12px] font-black tracking-widest shadow-lg shadow-primary/20">
                                                    {r}{n}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] md:text-[11px] font-black text-gray-500 dark:text-gray-500 mb-3 uppercase tracking-[0.2em]">Order Summary</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[13px] text-gray-600 dark:text-gray-400">
                                            <span>Tickets Subtotal</span>
                                            <span className="font-bold text-gray-900 dark:text-white">₹{ticketsTotal.toLocaleString()}</span>
                                        </div>
                                        {snackTotal > 0 && (
                                            <div className="flex justify-between text-[13px] text-gray-600 dark:text-gray-400">
                                                <span>Food & Beverages</span>
                                                <span className="font-bold text-gray-900 dark:text-white">₹{snackTotal.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[13px] text-gray-600 dark:text-gray-400">
                                            <span>Convenience Fee</span>
                                            <span className="font-bold text-gray-900 dark:text-white">₹{convenienceFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[13px] text-gray-600 dark:text-gray-400">
                                            <span>GST</span>
                                            <span className="font-bold text-gray-900 dark:text-white">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                                {/* Total & Pay Button */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Total Amount</span>
                                            <span className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white font-roboto">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !isFormValid}
                                        className={`w-full py-4 rounded-xl font-black text-[14px] md:text-[16px] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl  uppercase tracking-[0.2em]
                                            ${!isFormValid
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                : isProcessing
                                                    ? 'bg-primary/50 text-white opacity-100 pointer-events-none'
                                                    : 'bg-primary hover:brightness-110 text-white'
                                            }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Securing...</span>
                                            </>
                                        ) : (
                                            <><span>Pay Now</span> <ChevronRight className="w-4 h-4" /></>
                                        )}
                                    </button>

                                    <div className="mt-5 text-center space-y-3">
                                        <div className="flex justify-center items-center gap-2 text-[11px] text-emerald-500 dark:text-emerald-400 font-black uppercase tracking-widest">
                                            <ShieldCheck className="w-4 h-4" /> Secure SSL Encrypted
                                        </div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed px-2">
                                            By completing this purchase you agree to our <span className="text-primary hover:underline cursor-pointer">Terms & Conditions</span> and Privacy Policy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Mobile Fixed Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-safe z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Amount</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white font-roboto">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                    </div>
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing || !isFormValid}
                        className={`flex-1 py-4 px-6 rounded-xl font-black text-[14px] transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-[0.15em]
                            ${!isFormValid
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : isProcessing
                                    ? 'bg-primary/50 text-white pointer-events-none'
                                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110'
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
            <div className="h-24 lg:hidden"></div>
        </div>
    );
};

const SuccessScreen = ({ booking }) => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                        Your tickets for <span className="text-slate-900 dark:text-white border-b-2 border-primary/20 pb-0.5">{booking?.movieTitle}</span> are ready.
                    </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                    <button
                        onClick={() => navigate(`/bookings/${booking?.id}`)}
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
};

export default PaymentPage;
