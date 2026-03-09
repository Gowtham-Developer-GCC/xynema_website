import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Info, ShieldCheck, ChevronRight, MapPin, Calendar, Clock, MonitorPlay } from 'lucide-react';
import * as api from '../services/api';
import { getShowSeats, getFoodAndBeverages, lockSeats } from '../services/bookingService';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import bookingSessionManager from '../utils/bookingSessionManager';

const BookingSummaryPage = () => {
    const { slug, theaterSlug } = useParams();
    const navigate = useNavigate();

    // Get showId from sessionStorage (secure)
    const showId = sessionStorage.getItem('booking_show_id');

    // Hydrate State from Session Storage
    const [bookingState, setBookingState] = useState(null);

    useEffect(() => {
        // Validate session first
        const sessionValidation = bookingSessionManager.validateSession();
        if (!sessionValidation.valid) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
            return;
        }

        if (!showId || !theaterSlug) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
            return;
        }

        // Validate booking draft has required fields
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
    const cart = useMemo(() => bookingState?.cart || {}, [bookingState]);

    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(null);
    const [showSeats, setShowSeats] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [error, setError] = useState(null);
    const [isLocking, setIsLocking] = useState(false);
    const hasProceededRef = useRef(false);
    const seatsRef = useRef(seats);

    // Keep seatsRef in sync
    useEffect(() => {
        seatsRef.current = seats;
    }, [seats]);

    useEffect(() => {
        const fetchData = async () => {
            if (!showId || !theaterId) return;

            try {
                setLoading(true);
                const [showResponse, foodResponse] = await Promise.all([
                    getShowSeats(showId),
                    getFoodAndBeverages(theaterId)
                ]);

                // Transform API response to match component expectations (same logic as FoodSelectionPage)
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
                setError('Failed to load booking summary');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showId, theaterId]);

    const priceGroups = useMemo(() => {
        if (!seats.length || !showSeats.length) return {};
        const groups = {};
        seats.forEach(seatId => {
            const seat = showSeats.find(s => (s.id || s._id) === seatId);
            const price = seat?.price || show?.basePrice;
            if (!groups[price]) groups[price] = [];
            const seatRow = seat?.row ? `${seat.row}` : '';
            const seatNum = seat?.number || seat?.seatNumber || seat?.seatLabel || seat?.label || seat?.seat_number || seatId;
            const label = seatRow ? `${seatRow}${seatNum}` : seatNum;
            groups[price].push(label);
        });
        return groups;
    }, [seats, showSeats, show]);

    const ticketsTotal = useMemo(() => {
        return Object.entries(priceGroups).reduce((total, [price, items]) => {
            return total + (parseFloat(price) * items.length);
        }, 0);
    }, [priceGroups]);

    const snackTotal = useMemo(() => {
        return Object.entries(cart).reduce((total, [id, qty]) => {
            const item = foodItems.find(f => String(f.id) === String(id));
            return total + (item?.price || 0) * qty;
        }, 0);
    }, [cart, foodItems]);

    const subTotal = ticketsTotal + snackTotal;
    const convenienceFee = subTotal * 0.1; // 10% convenience fee to match sidebar
    const gst = 0; // GST is omitted for now as per user screenshot/sidebar logic
    const grandTotal = subTotal + convenienceFee + gst;
    const handleProceedToPayment = async () => {
        if (isLocking) return;
        setIsLocking(true);
        setError(null);

        try {
            // Format payload as exactly requested
            const payload = {
                seatIds: seats,
                foodItems: Object.entries(cart).map(([id, quantity]) => ({
                    foodItemId: id,
                    quantity: quantity
                }))
            };

            const newSessionId = await lockSeats(showId, payload);

            if (newSessionId) {
                // Save true sessionId returned from server
                bookingSessionManager.startSession(showId, displayTheater, null); // Replaces temp session start logic
                const updatedDraft = { ...bookingState, sessionId: newSessionId };
                sessionStorage.setItem(`booking_draft_${showId}`, JSON.stringify(updatedDraft));

                hasProceededRef.current = true;
                navigate(`/movie/${slug}/${theaterSlug}/payment`);
            }
        } catch (err) {
            console.error('Lock seats error:', err);
            setError(err.message || 'Could not lock seats. They might have been taken.');

            // Re-fetch seats to show updated availability or kick user back if needed
            setTimeout(() => {
                navigate(`/movie/${slug}/${theaterSlug}/seats`);
            }, 3000);
        } finally {
            setIsLocking(false);
        }
    };

    if (loading) return <LoadingScreen message="Preparing Summary" />;

    if (error) return (
        <div className="min-h-screen bg-whiteSmoke flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-red-50 p-6 rounded-2xl mb-4">
                <Info className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-900 font-display font-bold">{error}</p>
            </div>
            <button
                onClick={() => navigate(-1)}
                className="text-xynemaRose font-display font-bold flex items-center gap-2"
            >
                <ArrowLeft size={18} /> Go Back
            </button>
        </div>
    );

    const displayTitle = show?.movie?.title || show?.movie?.MovieName || show?.movieName || sessionStorage.getItem('booking_movie_title') || 'Unknown Title';
    const displayPoster = show?.movie?.portraitPosterUrl || show?.movie?.posterUrl || show?.posterUrl || sessionStorage.getItem('booking_movie_poster') || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image';
    const displayTheater = sessionStorage.getItem('booking_theater_name') || show?.theatre?.name || show?.theaterName || 'Theater';
    const displayTime = show?.startTime || show?.showTime || sessionStorage.getItem('booking_show_time') || '';
    const displayLanguage = sessionStorage.getItem('booking_movie_language') || show?.movieLanguage || 'English';
    const displayFormat = sessionStorage.getItem('booking_movie_format') || show?.format || '2D';
    const rawScreen = sessionStorage.getItem('booking_screen_name') || show?.screen?.name || (typeof show?.screen === 'string' ? show.screen : '1');
    const displayScreen = rawScreen.toLowerCase().includes('screen') ? rawScreen : `Screen ${rawScreen}`;

    return (
        <div className="min-h-screen bg-whiteSmoke dark:bg-gray-950 transition-colors duration-300">
            <SEO title={`Order Summary - ${displayTitle}`} />

            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-900 dark:text-gray-100" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Booking Summary</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 space-y-6">

                {/* Movie Card */}
                <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                    {/* Decorative gradient blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                    <div className="w-28 h-40 sm:w-32 sm:h-44 rounded-2xl overflow-hidden shadow-xl shadow-black/5 flex-shrink-0 relative group">
                        <img
                            src={displayPoster}
                            alt={displayTitle}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 pb-3 pt-12 bg-gradient-to-t from-black/80 to-transparent px-3 text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest shadow-sm">{displayFormat}</p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center flex-1 py-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest w-fit mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            {displayLanguage}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-5 tracking-tight">{displayTitle}</h2>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 sm:gap-x-8">
                            <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 truncate">Cinema</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">
                                        {displayTheater.includes(' - ') ? displayTheater.split(' - ')[0] : displayTheater}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400">
                                    <MonitorPlay className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 truncate">Screen</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">
                                        {displayTheater.includes(' - ') ? (displayTheater.split(' - ')[1] || displayScreen) : displayScreen}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 truncate">Date</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">
                                        {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5 truncate">Time</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">
                                        {displayTime}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Title */}
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-display font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">ORDER SUMMARY</h3>
                </div>

                {/* Order Summary */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">Seats ({seats.length})</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-300 text-right max-w-[60%]">
                                {Object.values(priceGroups).flat().join(', ')}
                            </p>
                        </div>

                        {/* Ticket Breakdown */}
                        <div className="space-y-2 pt-1">
                            {Object.entries(priceGroups).sort((a, b) => b[0] - a[0]).map(([price, items]) => (
                                <div key={price} className="flex justify-between text-[13px] font-medium text-gray-600 dark:text-gray-400 pl-3">
                                    <p>₹{parseFloat(price).toLocaleString()} × {items.length} {items.length === 1 ? 'seat' : 'seats'}</p>
                                    <p className="text-gray-900 dark:text-gray-200 font-bold">₹{(parseFloat(price) * items.length).toLocaleString()}</p>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-gray-50 dark:border-gray-800">
                                <p className="text-gray-900 dark:text-white">Tickets Subtotal</p>
                                <p className="text-gray-900 dark:text-white">₹{ticketsTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Snacks */}
                        {snackTotal > 0 && (
                            <div className="space-y-2 pt-2">
                                <div className="lex justify-between text-sm font-bold pt-2 mt-1 border-t border-gray-50 dark:border-gray-800">
                                    <p className="text-gray-900 dark:text-white">Food & Beverages</p>
                                </div>
                                <div className="space-y-1.5 pl-3">
                                    {Object.entries(cart).map(([id, qty]) => {
                                        const item = foodItems.find(f => String(f.id) === String(id));
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="flex justify-between text-[11px] font-medium">
                                                <p className="text-gray-500 dark:text-gray-400">{item.name} x {qty}</p>
                                                <p className="text-gray-900 dark:text-gray-300 font-bold">₹{(item.price * qty).toLocaleString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-gray-50 dark:border-gray-800">
                                    <p className="text-gray-900 dark:text-white">Food & Beverages Subtotal</p>
                                    <p className="text-gray-900 dark:text-white">₹{snackTotal.toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        <div className="border-t-2 border-dashed border-gray-100 dark:border-gray-800 pt-2" />

                        {/* Fees & Taxes */}
                        <div className="space-y-2">
                            {convenienceFee > 0 && (
                                <div className="flex justify-between text-xs font-medium">
                                    <p className="text-gray-500 dark:text-gray-400">Convenience Fee (10%)</p>
                                    <p className="text-gray-900 dark:text-white font-bold">₹{convenienceFee.toLocaleString()}</p>
                                </div>
                            )}
                            {gst > 0 && (
                                <div className="flex justify-between text-xs font-medium">
                                    <p className="text-gray-500 dark:text-gray-400">Taxes (GST 18%)</p>
                                    <p className="text-gray-900 dark:text-white">₹{gst.toLocaleString()}</p>
                                </div>
                            )}
                        </div>

                        {/* Total Highlight */}
                        <div className="mt-4 bg-xynemaRose/10 dark:bg-rose-950/30 p-4 rounded-xl flex justify-between items-center">
                            <p className="text-sm font-bold text-xynemaRose dark:text-rose-400 uppercase tracking-wider">Total Payable</p>
                            <p className="text-xl font-extrabold text-xynemaRose dark:text-rose-400">₹{grandTotal.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-none z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                    <div className="font-display">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Grand Total</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">₹{grandTotal.toLocaleString()}</p>
                    </div>
                    <button
                        onClick={handleProceedToPayment}
                        disabled={isLocking}
                        className={`flex-1 text-white h-14 rounded-2xl font-display font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:brightness-110 active:scale-95 transition-all ${isLocking ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-xynemaRose shadow-xynemaRose/10'}`}
                    >
                        {isLocking ? 'Securing Tickets...' : 'Make Payment'} <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSummaryPage;
