import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Loader, Zap, Info } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import { animationStyles } from '../styles/components';
import { getFoodItems } from '../services/storeService';
import { getShowSeats } from '../services/bookingService';
import ErrorState from '../components/ErrorState';
import BookingLoadingSkeleton from '../components/BookingLoadingSkeleton';
import bookingSessionManager from '../utils/bookingSessionManager';

const FoodSelectionPage = () => {
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
    const seats = useMemo(() => bookingState?.seats || [], [bookingState]);
    const sessionId = bookingState?.sessionId;
    const selectedDate = bookingState?.date;

    const [foodItems, setFoodItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [show, setShow] = useState(null);
    const [showSeats, setShowSeats] = useState([]);

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
                const [foodResponse, showResponse] = await Promise.all([
                    getFoodItems(),
                    getShowSeats(showId)
                ]);
                setFoodItems(foodResponse || []);
                setShow(showResponse.show);
                setShowSeats(showResponse.seats || []);
            } catch (err) {
                setError({ message: 'Failed to load menu items', type: 'DATA_FETCH_FAILED' });
            } finally {
                setLoading(false);
            }
        };

        if (showId) fetchData();
    }, [showId]);

    const addToCart = (item) => {
        try {
            setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
        } catch (err) {
            console.error('Add to cart error:', err);
        }
    };

    const removeFromCart = (itemId) => {
        try {
            setCart(prev => {
                const newCart = { ...prev };
                if (newCart[itemId] > 1) newCart[itemId]--;
                else delete newCart[itemId];
                return newCart;
            });
        } catch (err) {
            console.error('Remove from cart error:', err);
        }
    };

    const handleProceedToPayment = () => {
        try {
            hasProceededRef.current = true;
            const cartData = Object.entries(cart).map(([id, qty]) => `${id}:${qty}`).join(',');
            // Update draft with cart
            const updatedDraft = {
                ...bookingState,
                cart: cart
            };
            sessionStorage.setItem(`booking_draft_${showId}`, JSON.stringify(updatedDraft));

            navigate(`/movie/${slug}/${theaterSlug}/summary`);
        } catch (err) {
            console.error('Proceed to payment error:', err);
        }
    };

    const ticketsTotal = useMemo(() => {
        if (!seats.length) return 0;
        // Try to sum prices of actual selected seats
        const sum = seats.reduce((total, seatId) => {
            const seat = showSeats.find(s => (s.id || s._id) === seatId);
            return total + (seat?.price || 0);
        }, 0);

        // If sum is 0, fall back to seat count * basePrice
        if (sum === 0) {
            return seats.length * (show?.basePrice || 0);
        }
        return sum;
    }, [showSeats, seats, show]);

    if (loading) return <BookingLoadingSkeleton variant="food" />;
    if (error) return <ErrorState error={error} title="Oops!" buttonText="Try Again" />;

    const categories = ['All', ...new Set(foodItems.map(item => item.category))];
    const filteredItems = selectedCategory === 'All' ? foodItems : foodItems.filter(item => item.category === selectedCategory);
    const snackTotal = Object.entries(cart).reduce((total, [id, qty]) => {
        const item = foodItems.find(f => String(f.id) === String(id));
        return total + (item?.price || 0) * qty;
    }, 0);

    const totalAmount = ticketsTotal + snackTotal;

    return (
        <div className="min-h-screen bg-[#F5F5FA]">
            <SEO title="Food & Snacks - XYNEMA" description="Add snacks and drinks to your movie experience" />

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
                        <h1 className="text-sm font-bold text-gray-900">Food & Drinks</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {seats.length} Seats | Selected
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center relative">
                            <ShoppingCart className="w-4 h-4 text-gray-400" />
                            {Object.keys(cart).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-xynemaRose text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {Object.keys(cart).length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                    {/* Categories */}
                    <div className="mb-8 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${selectedCategory === category ? 'bg-xynemaRose text-white border-xynemaRose shadow-lg shadow-red-100' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Menu Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <FoodCard
                                key={item.id}
                                item={item}
                                quantity={cart[item.id] || 0}
                                onAdd={() => addToCart(item)}
                                onRemove={() => removeFromCart(item.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Cart Sidebar */}
                <aside className="lg:w-96 shrink-0">
                    <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-xynemaRose" />
                                Your Order
                            </h2>

                            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto no-scrollbar">
                                {Object.entries(cart).length > 0 ? (
                                    Object.entries(cart).map(([id, qty]) => {
                                        const item = foodItems.find(f => String(f.id) === String(id));
                                        return (
                                            <div key={id} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-xl">{item?.image || '🍿'}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{item?.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Qty: {qty}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">₹{((item?.price || 0) * qty).toLocaleString()}</p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold uppercase text-[10px]">No snacks added yet</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                <div className="flex justify-between items-center text-gray-400">
                                    <span className="text-[10px] font-bold uppercase">Tickets Total ({seats.length})</span>
                                    <span className="text-sm font-bold">₹{ticketsTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-400">
                                    <span className="text-[10px] font-bold uppercase">Snacks Total</span>
                                    <span className="text-sm font-bold">₹{snackTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-900">Total Payable</span>
                                    <span className="text-2xl font-bold text-xynemaRose">₹{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleProceedToPayment}
                                className="w-full mt-8 py-4 rounded-xl bg-xynemaRose text-white font-bold text-sm transition-all hover:bg-charcoalSlate active:scale-95 disabled:bg-gray-200 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                </aside>
            </main>
            {/* Mobile Sticky Cart Footer */}
            {Object.keys(cart).length > 0 && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-8 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{Object.keys(cart).length} Items</p>
                            <p className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => {
                                const cartElement = document.querySelector('aside');
                                if (cartElement) cartElement.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-xs font-bold text-xynemaRose uppercase tracking-wider underline opacity-0 hidden" // Hidden for now, just auto proceed
                        >
                            View Cart
                        </button>
                    </div>
                    <button
                        onClick={handleProceedToPayment}
                        className="w-full py-3.5 rounded-xl bg-xynemaRose text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-xynemaRose/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        Proceed to Payment
                    </button>
                </div>
            )}
        </div>
    );
};

const FoodCard = ({ item, quantity, onAdd, onRemove }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center mb-4 text-4xl">
            {item.image}
        </div>

        <div className="space-y-1 mb-4">
            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
        </div>

        <div className="text-xl font-bold text-xynemaRose mb-6">
            ₹{item.price}
        </div>

        <div className="h-10">
            {quantity === 0 ? (
                <button
                    onClick={onAdd}
                    className="w-full h-full rounded-lg border border-gray-200 text-gray-600 font-bold text-[10px] uppercase tracking-wider hover:border-xynemaRose hover:text-xynemaRose transition-all"
                >
                    Add to Cart
                </button>
            ) : (
                <div className="w-full h-full flex items-center justify-between bg-xynemaRose text-white rounded-lg px-3">
                    <button onClick={onRemove} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded">
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-sm">{quantity}</span>
                    <button onClick={onAdd} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    </div>
);

const LoadingState = () => (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col items-center justify-center space-y-6 p-8">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--xynemaRose, #00296b)' }} />
        <div className="text-center">
            <p className="text-xynemaRose font-bold text-xs uppercase tracking-widest mb-1 animate-pulse">Loading Menu</p>
            <h2 className="text-xl font-bold text-gray-400">XYNEMA</h2>
        </div>
    </div>
);

// ErrorState removed - imported from components

export default FoodSelectionPage;
