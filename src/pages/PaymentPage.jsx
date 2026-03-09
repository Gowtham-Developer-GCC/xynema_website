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
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    const seats = useMemo(() => bookingState?.seats || [], [bookingState]);
    const cartData = useMemo(() => bookingState?.cart || {}, [bookingState]);
    const sessionId = bookingState?.sessionId;
    const selectedDate = bookingState?.date;

    const isBookingConfirmedRef = useRef(false);
    const seatsRef = useRef([]);

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
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
            <SEO title={`Payment - ${localDisplayTitle}`} />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-black tracking-[0.2em] text-slate-900 dark:text-white uppercase">SECURE CHECKOUT</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1 h-1 rounded-full animate-pulse ${timeLeft < 60 ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
                            <span className={`text-[10px] font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-slate-400'}`}>
                                {timeLeft > 0 ? `SESSION EXPIRES IN ${formatTime(timeLeft)}` : 'SESSION EXPIRED'}
                            </span>
                        </div>
                    </div>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Action & Info */}
                    <div className="flex-1 space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <Info className="w-5 h-5 text-red-500" />
                                <p className="text-sm font-bold text-red-900">{error}</p>
                            </div>
                        )}

                        <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Select Payment Method
                                </h3>
                                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Dev Mode</span>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${selectedMethod === method.id ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-slate-200 dark:hover:border-gray-700'}`}
                                        >
                                            <div className={`p-3 rounded-xl ${selectedMethod === method.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500'}`}>
                                                {method.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{method.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">Instant confirmation</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-slate-100 dark:border-gray-800">
                                    <div className="space-y-4 max-w-sm mx-auto text-center">
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Ready to Book?</h2>
                                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                            Generating random transaction ID for testing via {selectedMethod.toUpperCase()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full mt-8 relative group block"
                                    >
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <div className={`relative w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black text-sm uppercase tracking-[0.3em] py-5 rounded-2xl transition-all ${isProcessing ? 'opacity-90' : 'hover:scale-[1.02] active:scale-98'}`}>
                                            {isProcessing ? (
                                                <>
                                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>CONFIRMING...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>CONFIRM ₹{grandTotal.toLocaleString()}</span>
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> SSL SECURE</div>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                    <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-emerald-500" /> PCI COMPLIANT</div>
                                </div>
                            </div>
                        </section>

                        <div className="p-6 bg-slate-100/50 dark:bg-gray-900/50 rounded-2xl border border-slate-200 dark:border-gray-800 flex items-start gap-4">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                                <Info className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Cancellation Policy</h4>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-gray-400 leading-relaxed uppercase tracking-tight">
                                    Tickets once booked cannot be cancelled or exchanged. Please verify your selected showtime and seats before proceeding.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar Summary */}
                    <aside className="w-full lg:w-[400px]">
                        <div className="sticky top-28 space-y-6">
                            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
                                <div className="p-6 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-gray-800 flex gap-4">
                                    <img
                                        src={localDisplayPoster || "/logo.png"}
                                        alt={localDisplayTitle}
                                        className="w-20 h-28 object-cover rounded-xl shadow-lg shadow-black/5"
                                    />
                                    <div className="flex-1 min-w-0 py-1">
                                        <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 truncate">{localDisplayTitle}</h2>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <MapPin className="w-3 h-3 text-indigo-500" /> {localDisplayTheater}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar className="w-3 h-3 text-indigo-500" /> {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock className="w-3 h-3 text-indigo-500" /> {localDisplayTime}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Ticket className="w-3.5 h-3.5" /> Tickets ({seats.length})
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {showSeats.filter(s => seats.includes(s.id || s._id)).map(s => {
                                                        const r = s.row || '';
                                                        const n = s.seatNumber || s.number || s.seatLabel || s.label || s.seat_number || '';
                                                        return `${r}${n}`;
                                                    }).join(', ')}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 mt-0.5">₹{ticketsTotal.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {snackTotal > 0 && (
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                                                    <Coffee className="w-3.5 h-3.5" /> Food & Snacks
                                                </div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">₹{snackTotal.toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                            <span>Convenience Fee (10%)</span>
                                            <span>₹{convenienceFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-gray-800/50 px-5 py-5 rounded-2xl">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Total Amount</span>
                                            <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                                        </div>
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
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[40px] p-10 text-center shadow-2xl dark:shadow-none space-y-10 animate-in zoom-in duration-500 border border-transparent dark:border-gray-800">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto border-2 border-indigo-100 dark:border-indigo-800/30 shadow-xl shadow-indigo-100/50 dark:shadow-none">
                    <CheckCircle className="w-12 h-12 text-indigo-600" />
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <h1 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">BOOKING CONFIRMED</h1>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">YOU'RE ALL SET!</h2>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-bold leading-relaxed px-4 uppercase tracking-wider">
                        Your tickets for <span className="text-slate-900 dark:text-white border-b-2 border-indigo-600/20 pb-0.5">{booking?.movieTitle}</span> are ready.
                    </p>
                </div>

                <div className="space-y-4 pt-6">
                    <button
                        onClick={() => navigate(`/bookings/${booking?.id}`)}
                        className="w-full bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        VIEW DIGITAL TICKET
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] py-2 hover:text-slate-900 transition-colors"
                    >
                        BACK TO HOME
                    </button>
                </div>

                <div className="pt-4 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sent to your registered email</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
