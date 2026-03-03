import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Check, AlertCircle, Loader, Shield, Info, Zap, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { getFoodItems } from '../services/storeService';
import { getShowSeats, confirmBooking } from '../services/bookingService';
import TicketCard from '../components/TicketCard';
import BookingLoadingSkeleton from '../components/BookingLoadingSkeleton';
import bookingSessionManager from '../utils/bookingSessionManager';
import {
    sanitizeCardName,
    isValidCardNumber,
    isValidCVV,
    isValidExpiry,
    getCardType,
    getCardTypeName,
    validateBookingData,
    logSecurityEvent
} from '../utils/securityUtils';

const PaymentPage = () => {
    const { slug, theaterSlug } = useParams();
    const navigate = useNavigate();

    // Get showId from sessionStorage (secure)
    const showId = sessionStorage.getItem('booking_show_id');

    // Hydrate State from Session Storage
    const [bookingState, setBookingState] = useState(null);
    const isBookingConfirmedRef = useRef(false);

    useEffect(() => {
        if (isBookingConfirmedRef.current) {
            return;
        }

        const sessionValidation = bookingSessionManager.validateSession();
        if (!sessionValidation.valid) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
            return;
        }

        if (!showId || !theaterSlug) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
            return;
        }

        // Validate booking draft has required seats
        const draftValidation = bookingSessionManager.validateBookingDraft(['seats']);
        if (!draftValidation.valid) {
            navigate(`/movie/${slug}/${theaterSlug}/seats`, { replace: true });
            return;
        }

        setBookingState(draftValidation.draft);

        // Refresh session timestamp (keep alive)
        bookingSessionManager.refreshSession();
    }, [showId, theaterSlug, slug, navigate]);

    const movieId = bookingState?.movieId;
    const theaterId = bookingState?.theaterId;
    const sessionId = bookingState?.sessionId;
    const selectedDate = bookingState?.date;
    const seats = useMemo(() => bookingState?.seats || [], [bookingState]);
    const cartData = useMemo(() => bookingState?.cart || {}, [bookingState]);

    // State Hooks
    const [paymentMethod, setPaymentMethod] = useState('credit/debit card');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [confirmedBooking, setConfirmedBooking] = useState(null);
    const [show, setShow] = useState(null);
    const [showSeats, setShowSeats] = useState([]);

    const [cardData, setCardData] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: ''
    });

    const [cardType, setCardType] = useState('');
    const [foodPrice, setFoodPrice] = useState(0);

    const ticketsTotal = useMemo(() => {
        if (!seats.length) return 0;
        // Try to sum prices of actual selected seats
        const sum = seats.reduce((total, seatId) => {
            const seat = showSeats.find(s => (s.id || s._id) === seatId);
            return total + (seat?.price || 0);
        }, 0);

        // If sum is 0, fall back to seat count * basePrice (or 250)
        if (sum === 0) {
            return seats.length * (show?.basePrice || 250);
        }
        return sum;
    }, [showSeats, seats, show]);

    const totalAmount = ticketsTotal + foodPrice;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch authoritative show details for pricing
                const response = await getShowSeats(showId);
                setShow(response.show);
                setShowSeats(response.seats || []);

                if (cartData) {
                    const foodItems = await getFoodItems();
                    let total = 0;

                    if (typeof cartData === 'object') {
                        // Handle Object format from State
                        Object.entries(cartData).forEach(([id, qty]) => {
                            const item = foodItems.find(f => String(f.id) === String(id));
                            if (item) total += item.price * parseInt(qty);
                        });
                    } else if (typeof cartData === 'string') {
                        // Handle String format from URL with legacy parsing
                        const cartPairs = cartData.split(',').map(pair => pair.split(':'));
                        cartPairs.forEach(([id, qty]) => {
                            const item = foodItems.find(f => String(f.id) === String(id));
                            if (item) total += item.price * parseInt(qty);
                        });
                    }
                    setFoodPrice(total);
                }
            } catch (err) {
                console.error('Failed to fetch payment data:', err);
                setError({ message: 'Failed to load booking details. Please try again.' });
            } finally {
                setLoading(false);
            }
        };

        if (showId) fetchData();
    }, [showId, cartData]);

    const seatsRef = useRef(seats);

    // Keep seatsRef in sync
    useEffect(() => {
        seatsRef.current = seats;
    }, [seats]);

    const handleCardInputChange = (e) => {
        const { name, value } = e.target;

        // Security: Enhanced input sanitization and validation
        let sanitizedValue = value;

        if (name === 'cardNumber') {
            // Allow only numbers and limit to 19 digits (some cards are 19 digits)
            sanitizedValue = value.replace(/\D/g, '').slice(0, 19);

            // Detect card type in real-time (works with partial numbers)
            const detectedType = getCardType(sanitizedValue);
            setCardType(detectedType || '');
        } else if (name === 'expiryDate') {
            // Format: MM/YY, allow only numbers and /
            sanitizedValue = value.replace(/[^\d/]/g, '').slice(0, 5);
            // Auto-format: Add / after MM
            if (sanitizedValue.length === 2 && !sanitizedValue.includes('/')) {
                sanitizedValue += '/';
            }
        } else if (name === 'cvv') {
            // Allow only numbers, limit based on card type (Amex = 4 digits, others = 3)
            const maxLength = cardType === 'american-express' ? 4 : 3;
            sanitizedValue = value.replace(/\D/g, '').slice(0, maxLength);
        } else if (name === 'name') {
            // Use security utility for card name sanitization
            sanitizedValue = sanitizeCardName(value);
        }

        setCardData(prev => ({ ...prev, [name]: sanitizedValue }));
    };

    const validatePayment = () => {
        if (paymentMethod === 'credit/debit card') {
            // Enhanced validation using security utilities
            if (!cardData.name?.trim()) {
                setError({ message: 'Please enter cardholder name' });
                logSecurityEvent('PAYMENT_VALIDATION_FAILED', { reason: 'missing_name' });
                return false;
            }

            if (!isValidCardNumber(cardData.cardNumber)) {
                setError({ message: 'Please enter a valid card number' });
                logSecurityEvent('PAYMENT_VALIDATION_FAILED', { reason: 'invalid_card_number' });
                return false;
            }

            if (!isValidExpiry(cardData.expiryDate)) {
                setError({ message: 'Please enter a valid expiry date (MM/YY)' });
                logSecurityEvent('PAYMENT_VALIDATION_FAILED', { reason: 'invalid_expiry' });
                return false;
            }

            if (!isValidCVV(cardData.cvv, cardData.cardNumber)) {
                setError({ message: `Please enter a valid CVV (${cardType === 'american-express' ? '4' : '3'} digits)` });
                logSecurityEvent('PAYMENT_VALIDATION_FAILED', { reason: 'invalid_cvv' });
                return false;
            }
        }

        // Validate booking data integrity using security utility
        const bookingValidation = validateBookingData({
            seatIds: seats,
            sessionId: sessionId,
            paymentDetails: { method: paymentMethod }
        });

        if (!bookingValidation.valid) {
            setError({ message: bookingValidation.errors[0] || 'Invalid booking data' });
            logSecurityEvent('BOOKING_VALIDATION_FAILED', { errors: bookingValidation.errors });
            navigate(`/movie/${slug}/${theaterSlug}/seats`, { replace: true });
            return false;
        }

        return true;
    };

    const handlePayment = async () => {
        try {
            // Check rate limiting
            const rateLimitCheck = bookingSessionManager.isRateLimited();
            if (rateLimitCheck.limited) {
                setError({ message: rateLimitCheck.message });
                return;
            }

            if (!validatePayment()) return;
            setLoading(true);
            setError(null);

            const bookingPayload = {
                seatIds: seats,
                sessionId: sessionId,
                paymentDetails: {
                    method: paymentMethod.toLowerCase(),
                    transactionId: `TXN${Date.now()}`
                }
            };

            const successResult = await confirmBooking(showId, bookingPayload);

            if (successResult && successResult.success) {
                // Track successful booking
                bookingSessionManager.trackBookingAttempt(true);

                // Prioritize data from backend response if available
                const b = successResult.data?.booking || {};
                const realBookingId = b.bookingId || successResult.data?.bookingId || `BK${Date.now()}`;

                const localConfirmedBooking = {
                    id: realBookingId,
                    movieTitle: b.movieTitle || show?.movie?.title || 'Movie',
                    posterUrl: b.posterUrl || show?.movie?.posterUrl || '',
                    theaterName: b.theaterName || show?.theatre?.name || 'Theater',
                    city: b.city || show?.theatre?.city || 'N/A',
                    date: b.date || b.showDate || selectedDate,
                    time: b.time || b.showTime || show?.startTime || '',
                    screen: b.screen || show?.screen?.name || show?.screen?.screenName || '1',
                    seats: b.seats ? b.seats.map(s => typeof s === 'object' ? (s.seatLabel || s.seatNumber) : s) : showSeats.filter(s => seats.includes(s.id || s._id)).map(s => s.seatNumber),
                    backendSeatIds: seats,
                    showId: showId,
                    sessionId: sessionId,
                    paymentMethod: b.paymentMethod || paymentMethod.toLowerCase(),
                    transactionId: b.transactionId || bookingPayload.paymentDetails.transactionId,
                    status: b.status || 'confirmed',
                    ticketPrice: b.ticketPrice || ticketsTotal,
                    foodPrice: b.foodPrice || foodPrice,
                    tax: b.tax || 0,
                    totalAmount: b.totalAmount || totalAmount,
                    language: b.language || show?.movie?.language || '',
                    format: b.format || show?.format || ''
                };

                setConfirmedBooking(localConfirmedBooking);
                setBookingId(realBookingId);
                isBookingConfirmedRef.current = true;

                // Clear booking session (removes all session storage + releases any remaining locked seats)
                // No need to release seats here as they're already confirmed on backend
                await bookingSessionManager.clearSession([]);

                setSuccess(true);
            } else {
                // Track failed attempt
                bookingSessionManager.trackBookingAttempt(false);
                throw new Error('Payment Rejected or Session Conflict');
            }
        } catch (err) {
            // Track failed attempt
            bookingSessionManager.trackBookingAttempt(false);
            setError({ message: err.message || 'Payment failed. Please try again or use a different method.' });
            console.error('Payment failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (success) return <SuccessScreen booking={confirmedBooking} />;

    return (
        <div className="min-h-screen bg-whiteSmoke">
            <SEO title="Payment - XYNEMA" description="Complete your movie booking safely" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-xynemaRose transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-bold text-gray-900">Payment</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Secure Checkout</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Secure Session</span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-12 gap-8">
                {/* Payment Methods */}
                <div className="lg:col-span-8 space-y-8">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-600 font-medium">{error.message}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Payment Method</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                                {[
                                    { id: 'credit/debit card', label: 'Credit/Debit Card', icon: <CreditCard className="w-5 h-5" /> },
                                    { id: 'upi', label: 'UPI / GPay', icon: <Zap className="w-5 h-5" /> },
                                    { id: 'wallet', label: 'Wallets', icon: <Lock className="w-5 h-5" /> },
                                    { id: 'netbanking', label: 'Net Banking', icon: <Info className="w-5 h-5" /> }
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 text-center ${paymentMethod === method.id ? 'bg-xynemaRose/5 border-xynemaRose text-xynemaRose' : 'bg-white border-gray-100 text-gray-400'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${paymentMethod === method.id ? 'bg-xynemaRose/10' : 'bg-gray-50'}`}>{method.icon}</div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider">{method.label}</p>
                                    </button>
                                ))}
                            </div>

                            {paymentMethod === 'credit/debit card' ? (
                                <div className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cardholder Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={cardData.name}
                                                onChange={handleCardInputChange}
                                                placeholder="John Doe"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-sm font-bold focus:border-xynemaRose outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Card Number</label>
                                                {cardType && (
                                                    <span className="text-[10px] font-bold text-xynemaRose uppercase tracking-widest">
                                                        {getCardTypeName(cardData.cardNumber)}
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                name="cardNumber"
                                                value={cardData.cardNumber}
                                                onChange={handleCardInputChange}
                                                placeholder="XXXX XXXX XXXX XXXX"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-sm font-bold focus:border-xynemaRose outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                            <input
                                                type="text"
                                                name="expiryDate"
                                                value={cardData.expiryDate}
                                                onChange={handleCardInputChange}
                                                placeholder="MM/YY"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-sm font-bold focus:border-xynemaRose outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">CVV</label>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {cardType === 'american-express' ? '4 DIGITS' : '3 DIGITS'}
                                                </span>
                                            </div>
                                            <input
                                                type="password"
                                                name="cvv"
                                                value={cardData.cvv}
                                                onChange={handleCardInputChange}
                                                placeholder={cardType === 'american-express' ? '****' : '***'}
                                                maxLength={cardType === 'american-express' ? 4 : 3}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-sm font-bold focus:border-xynemaRose outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 font-bold uppercase text-[10px]">Payment will be processed via external secure link</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={loading || success}
                        className="w-full py-5 rounded-2xl bg-xynemaRose text-white font-bold text-sm shadow-md disabled:bg-gray-200 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 fill-current" />
                                <span className="uppercase tracking-widest">Pay Total: ₹{totalAmount.toLocaleString()}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Sidebar Summary */}
                <aside className="lg:col-span-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Order Summary</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-bold uppercase text-[10px]">Tickets ({seats.length})</span>
                                <span className="text-gray-900 font-bold">₹{ticketsTotal.toLocaleString()}</span>
                            </div>
                            {foodPrice > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold uppercase text-[10px]">Food & Snacks</span>
                                    <span className="text-gray-900 font-bold">₹{foodPrice.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-green-600">
                                <span>Discounts</span>
                                <span>- ₹0</span>
                            </div>
                            <div className="h-px bg-gray-100" />
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold uppercase text-gray-400">Amount Payable</span>
                                <span className="text-3xl font-bold text-xynemaRose">₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase">E-Tickets via Email/SMS</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Secure Payment Gateway</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

const SuccessScreen = ({ booking }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 sm:p-12">
            <SEO title="Booking Successful - XYNEMA" description="Your movie ticket is ready!" />

            <div className="max-w-md w-full text-center space-y-10">
                {/* Success Indicator */}
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100 ring-8 ring-emerald-50">
                        <Check className="w-10 h-10 text-white stroke-[3px]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Booking Confirmed!</h2>
                        <p className="text-gray-500 text-sm font-medium">Your ticket has been sent to your email.</p>
                    </div>
                </div>

                {/* Ticket Display */}
                {booking && (
                    <div className="space-y-6">
                        <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                            <TicketCard
                                ticket={booking}
                                onClick={() => navigate(`/bookings/${booking.id}`)}
                            />
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left space-y-4">
                            <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>Booking ID</span>
                                <span className="text-gray-900">{booking.id}</span>
                            </div>
                            <div className="h-px bg-gray-200/50" />
                            <div className="flex justify-between items-end">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Amount Paid</span>
                                <span className="text-2xl font-black text-xynemaRose">₹{booking.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 pt-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full h-14 rounded-2xl bg-xynemaRose text-white font-black text-xs uppercase tracking-[0.2em] shadow-md"
                    >
                        Back to Home
                    </button>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-full h-14 rounded-2xl bg-white border border-gray-200 text-gray-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50"
                    >
                        View My Bookings
                    </button>
                </div>

                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Shield size={12} className="text-emerald-500" />
                    Verified Transaction
                </p>
            </div>
        </div>
    );
};

export default PaymentPage;
