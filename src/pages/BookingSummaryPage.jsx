import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import * as api from '../services/api';
import SEO from '../components/SEO';
import BookingLoadingSkeleton from '../components/BookingLoadingSkeleton';
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
    const hasProceededRef = useRef(false);
    const seatsRef = useRef(seats);

    // Keep seatsRef in sync
    useEffect(() => {
        seatsRef.current = seats;
    }, [seats]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [showResponse, foodResponse] = await Promise.all([
                    api.getShowSeats(showId),
                    api.getFoodItems()
                ]);
                setShow(showResponse.show);
                setShowSeats(showResponse.seats || []);
                setFoodItems(foodResponse || []);
            } catch (err) {
                setError('Failed to load booking summary');
            } finally {
                setLoading(false);
            }
        };

        if (showId) fetchData();
    }, [showId]); // Only depend on showId for unmount cleanup

    const priceGroups = useMemo(() => {
        if (!seats.length || !showSeats.length) return {};
        const groups = {};
        seats.forEach(seatId => {
            const seat = showSeats.find(s => (s.id || s._id) === seatId);
            const price = seat?.price || show?.basePrice;
            if (!groups[price]) groups[price] = [];
            groups[price].push(seat?.seatNumber || seatId);
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

    const convenienceFee = 0;
    const gst = 0;
    const grandTotal = ticketsTotal + snackTotal + convenienceFee + gst;

    if (loading) return <BookingLoadingSkeleton variant="summary" />;

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

    return (
        <div className="min-h-screen bg-whiteSmoke">
            <SEO title={`Order Summary - ${show?.movie?.title || 'Movie'}`} />

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Booking Summary</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 space-y-6">

                {/* Movie Card */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex gap-5">
                    <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                        <img
                            src={show?.movie?.posterUrl || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image'}
                            alt={show?.movie?.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">{show?.movie?.title}</h2>
                        <p className="text-gray-500 text-sm mb-2 font-medium">{show?.language || show?.movie?.language || 'Unknown'} • {show?.format || 'Unknown'}</p>
                        <div className="space-y-1">
                            <p className="text-gray-900 text-xs font-bold">
                                {(show?.theatre?.name || 'Unknown').includes(' - ') ? show.theatre.name.split(' - ')[0] : (show?.theatre?.name || 'Unknown')}
                            </p>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | {show?.startTime}
                            </p>
                            <p className="text-gray-400 text-[10px] font-bold">
                                {(show?.theatre?.name || '').includes(' - ') ? show?.theatre?.name.split(' - ')[1] : `Screen ${show?.screen?.name || (typeof show?.screen === 'string' ? show.screen : '1')}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section Title */}
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-display font-black text-gray-400 uppercase tracking-[0.2em]">ORDER SUMMARY</h3>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-gray-900 flex-shrink-0">Seats ({seats.length})</p>
                            <p className="text-sm font-bold text-gray-900 text-right max-w-[60%]">
                                {Object.values(priceGroups).flat().join(', ')}
                            </p>
                        </div>

                        {/* Ticket Breakdown */}
                        <div className="space-y-2 pt-1">
                            {Object.entries(priceGroups).sort((a, b) => b[0] - a[0]).map(([price, items]) => (
                                <div key={price} className="flex justify-between text-[13px] font-medium text-gray-600 pl-3">
                                    <p>₹{parseFloat(price).toLocaleString()} × {items.length} {items.length === 1 ? 'seat' : 'seats'}</p>
                                    <p className="text-gray-900 font-bold">₹{(parseFloat(price) * items.length).toLocaleString()}</p>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-gray-50">
                                <p className="text-gray-900">Tickets Subtotal</p>
                                <p className="text-gray-900">₹{ticketsTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Snacks */}
                        {snackTotal > 0 && (
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-gray-500">Food & Beverages</p>
                                    <p className="text-xs font-bold text-gray-900">₹{snackTotal.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1.5 pl-3">
                                    {Object.entries(cart).map(([id, qty]) => {
                                        const item = foodItems.find(f => String(f.id) === String(id));
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="flex justify-between text-[10px] font-medium">
                                                <p className="text-gray-400">{item.name} x {qty}</p>
                                                <p className="text-gray-400">₹{(item.price * qty).toLocaleString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="border-t-2 border-dashed border-gray-100 pt-2" />

                        {/* Fees & Taxes */}
                        <div className="space-y-2">
                            {convenienceFee > 0 && (
                                <div className="flex justify-between text-xs font-medium">
                                    <p className="text-gray-500">Convenience Fee</p>
                                    <p className="text-gray-900">₹{convenienceFee.toLocaleString()}</p>
                                </div>
                            )}
                            {gst > 0 && (
                                <div className="flex justify-between text-xs font-medium">
                                    <p className="text-gray-500">Taxes (GST 18%)</p>
                                    <p className="text-gray-900">₹{gst.toLocaleString()}</p>
                                </div>
                            )}
                        </div>

                        {/* Total Highlight */}
                        <div className="mt-4 bg-xynemaRose/10 p-4 rounded-xl flex justify-between items-center">
                            <p className="text-sm font-bold text-xynemaRose uppercase tracking-wider">Total Payable</p>
                            <p className="text-xl font-extrabold text-xynemaRose">₹{grandTotal.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                    <div className="font-display">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Grand Total</p>
                        <p className="text-2xl font-black text-gray-900">₹{grandTotal.toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => {
                            try {
                                hasProceededRef.current = true;
                                navigate(`/movie/${slug}/${theaterSlug}/payment`);
                            } catch (err) {
                                console.error('Payment navigation error:', err);
                            }
                        }}
                        className="flex-1 bg-xynemaRose text-white h-14 rounded-2xl font-display font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-xynemaRose/10 hover:brightness-110 active:scale-95 transition-all"
                    >
                        Make Payment <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSummaryPage;
