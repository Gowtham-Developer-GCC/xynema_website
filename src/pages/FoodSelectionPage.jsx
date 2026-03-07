import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Loader, Zap, Info } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import { animationStyles } from '../styles/components';
import { getFoodAndBeverages, getShowSeats } from '../services/bookingService';
import ErrorState from '../components/ErrorState';
import BookingLoadingSkeleton from '../components/BookingLoadingSkeleton';
import bookingSessionManager from '../utils/bookingSessionManager';
import BookingSummary from '../components/SeatSelection/BookingSummary';

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
            if (!showId || !theaterId) return;

            try {
                setLoading(true);
                const [foodResponse, showResponse] = await Promise.all([
                    getFoodAndBeverages(theaterId),
                    getShowSeats(showId)
                ]);
                
                // Transform API response to match component expectations
                let foodItemsData = [];
                if (foodResponse?.data?.items) {
                    try {
                        // Flatten the items object (categories as keys) into a single array
                        const itemsObject = foodResponse.data.items;
                        foodItemsData = Object.values(itemsObject).flat().map(item => ({
                            id: item._id || item.id,
                            name: item.item_name || item.name,
                            category: item.category,
                            price: item.selling_price || item.price,
                            image: item.foodImageUrl || item.image || '🍿', // fallback emoji if no image
                            description: item.description || '',
                            available: item.is_available !== false, // default to true if not specified
                            inventory: item.inventory_stock || 0,
                            isPopular: item.isMarkAsPopular || false
                        })).filter(item => item.available); // Only show available items
                    } catch (error) {
                        console.error('Error processing food items:', error);
                        foodItemsData = [];
                    }
                }
                
                setFoodItems(foodItemsData);
                setShow(showResponse.show);
                setShowSeats(showResponse.seats || []);
            } catch (err) {
                setError({ message: 'Failed to load menu items', type: 'DATA_FETCH_FAILED' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showId, theaterId]);

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
                <div className="w-[80%] max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-bold text-gray-900">Food & Beverages</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Optional • Add to your booking
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-20 justify-end">
                        <button
                            onClick={() => {
                                setCart({});
                                handleProceedToPayment();
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                            Skip
                        </button>
                    </div>
                </div>
            </header>

            <main className="w-[80%] max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                    {/* Categories */}
                    <div className="mb-8 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${selectedCategory === category ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
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

                {/* Cart Sidebar via BookingSummary */}
                <div className="w-full lg:w-[400px] h-auto lg:h-[calc(100vh-80px)] lg:sticky top-[80px] bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-30 shrink-0">
                    <BookingSummary
                        movie={{ // Mocking structure expected by BookingSummary from previous step
                            movie: { title: sessionStorage.getItem('booking_movie_title'), portraitPosterUrl: sessionStorage.getItem('booking_movie_poster') },
                            theatre: { name: sessionStorage.getItem('booking_theater_name') }
                        }}
                        show={{ // Mocking structure
                            time: sessionStorage.getItem('booking_show_time'),
                            basePrice: show?.basePrice || 150
                        }}
                        selectedSeats={showSeats.filter(s => seats.includes(s.id || s._id))}
                        buttonText={Object.keys(cart).length > 0 ? "Pay Now" : "Skip & Pay"}
                        buttonIcon={<Zap className="w-4 h-4" />}
                        onConfirm={handleProceedToPayment}
                        showSkip={true}
                        onSkip={() => {
                            setCart({}); // clear cart before proceeding
                            setTimeout(handleProceedToPayment, 50);
                        }}
                        snacksTotal={snackTotal}
                        snackDetails={Object.entries(cart).map(([id, qty]) => {
                            const item = foodItems.find(f => String(f.id) === String(id));
                            return {
                                name: item?.name,
                                image: item?.image,
                                qty: qty,
                                total: (item?.price || 0) * qty
                            };
                        })}
                    />
                </div>
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
                        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        Proceed to Payment
                    </button>
                </div>
            )}
        </div>
    );
};

const FoodCard = ({ item, quantity, onAdd, onRemove }) => {
    // Check if image is a URL or emoji
    const isImageUrl = item.image && (item.image.startsWith('http') || item.image.startsWith('https') || item.image.startsWith('/'));
    
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center mb-4 overflow-hidden">
                {isImageUrl ? (
                    <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                            // Fallback to emoji if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                ) : null}
                <span className={`text-4xl ${isImageUrl ? 'hidden' : ''}`}>
                    {item.image || '🍿'}
                </span>
            </div>

            <div className="space-y-1 mb-4">
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
            </div>

            <div className="text-xl font-bold text-indigo-600 mb-6">
                ₹{item.price}
            </div>

            <div className="h-10">
                {quantity === 0 ? (
                    <button
                        onClick={onAdd}
                        className="w-full h-full rounded-lg border border-gray-200 text-gray-600 font-bold text-[10px] uppercase tracking-wider hover:border-indigo-600 hover:text-indigo-600 transition-all"
                    >
                        Add to Cart
                    </button>
                ) : (
                    <div className="w-full h-full flex items-center justify-between bg-indigo-600 text-white rounded-lg px-3">
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
};

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
