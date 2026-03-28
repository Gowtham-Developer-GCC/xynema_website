import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Loader, Zap, Info, AlertCircle, X } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import { animationStyles } from '../styles/components';
import { getFoodAndBeverages, getShowSeats } from '../services/bookingService';
import ErrorState from '../components/ErrorState';
import LoadingScreen from '../components/LoadingScreen';
import bookingSessionManager from '../utils/bookingSessionManager';
import BookingSummary from '../components/SeatSelection/BookingSummary';
import apiCacheManager from '../services/apiCacheManager';
import { optimizeImage } from '../utils/helpers';

const Toast = ({ message, type, onClose }) => (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-500 ${type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
        {type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        <span className="text-xs font-black tracking-wider">{message}</span>
        <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
    </div>
);

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

    const movieId = bookingState?.movieId || sessionStorage.getItem('booking_movie_id');
    const theaterId = bookingState?.theaterId || sessionStorage.getItem('booking_theater_id');
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
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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
                const foodResponse = await apiCacheManager.getOrFetchFood(theaterId, () => getFoodAndBeverages(theaterId));

                // Transform API response to match component expectations
                let foodItemsData = [];
                const rawItems = foodResponse?.data?.items || foodResponse?.items || foodResponse?.data || [];

                if (rawItems) {
                    try {
                        const itemsToProcess = Array.isArray(rawItems) ? rawItems : (typeof rawItems === 'object' ? Object.values(rawItems).flat() : []);

                        foodItemsData = itemsToProcess.map(item => ({
                            id: item._id || item.id,
                            name: item.item_name || item.name,
                            category: item.category || 'Snacks',
                            price: item.selling_price || item.price || 0,
                            image: item.foodImageUrl || item.image || '🍿',
                            description: item.description || '',
                            available: item.is_available !== false && item.status !== 'UNAVAILABLE',
                            inventory: item.inventory_stock || 0,
                            isPopular: item.isMarkAsPopular || false
                        })).filter(item => item.available);
                    } catch (error) {
                        console.error('Error processing food items:', error);
                        foodItemsData = [];
                    }
                }

                setFoodItems(foodItemsData);
                setShow(null);
                setShowSeats([]);
            } catch (err) {
                console.error('Data fetch error in food selection:', err);
                setError({ message: 'Failed to load menu items', type: 'DATA_FETCH_FAILED' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showId, theaterId]);

    const addToCart = (item) => {
        try {
            const currentTotalItems = Object.values(cart).reduce((acc, qty) => acc + qty, 0);
            if (currentTotalItems >= 10) {
                showToast("Maximum 10 items allowed per order", "warning");
                return;
            }
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
        const draftSeats = bookingState?.selectedSeats || [];
        if (!draftSeats.length) return 0;
        return draftSeats.reduce((total, seat) => total + (seat.price || seat.basePrice || 0), 0);
    }, [bookingState]);

    const summaryRef = useRef(null);
    const scrollToSummary = () => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <LoadingScreen message="Preparing Menu" />;
    if (error) return <ErrorState error={error} title="Oops!" buttonText="Try Again" />;

    const categories = ['All', ...new Set(foodItems.map(item => item.category))];
    const filteredItems = selectedCategory === 'All' ? foodItems : foodItems.filter(item => item.category === selectedCategory);
    const snackTotal = Object.entries(cart).reduce((total, [id, qty]) => {
        const item = foodItems.find(f => String(f.id) === String(id));
        return total + (item?.price || 0) * qty;
    }, 0);

    const totalAmount = ticketsTotal + snackTotal;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col transition-colors duration-300 font-sans">
            <SEO title="Food & Snacks - XYNEMA" description="Add snacks and drinks to your movie experience" />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header: Global Navigation - Simplified for Mobile */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm py-4 md:py-6 transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 md:p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-roboto truncate">
                                Pre-Order Snacks
                            </h1>
                            <p className="text-[11px] md:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                Optional • Save time at the counter
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleProceedToPayment}
                        className="text-[12px] md:text-[14px] font-bold text-primary dark:text-primary hover:underline font-roboto tracking-wider whitespace-nowrap px-2"
                    >
                        Skip
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 p-6 lg:p-10 bg-[#f9fafb] dark:bg-gray-950 transition-colors duration-300">
                <div className="flex-1 min-w-0">
                    {/* Category Pills */}
                    <div className="mb-6 md:mb-10 flex gap-2 md:gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[11px] md:text-[13px] font-bold transition-all whitespace-nowrap border font-roboto tracking-wide ${selectedCategory === category
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:text-primary'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Menu Grid - 2 Column for all devices as requested */}
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-8">
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

                {/* Sticky Summary Sidebar */}
                <div ref={summaryRef} className="w-full lg:w-[380px] bg-white dark:bg-gray-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col h-fit lg:sticky top-10 shrink-0 transition-colors duration-300 mb-20 lg:mb-0">
                    <BookingSummary
                        movie={{
                            movie: {
                                title: sessionStorage.getItem('booking_movie_title') || show?.movie?.title,
                                portraitPosterUrl: sessionStorage.getItem('booking_movie_poster') || show?.movie?.portraitPosterUrl
                            },
                            theatre: { name: sessionStorage.getItem('booking_theater_name') || show?.theatre?.name }
                        }}
                        show={{
                            time: sessionStorage.getItem('booking_show_time') || show?.startTime,
                            date: selectedDate,
                            basePrice: show?.basePrice || 150
                        }}
                        selectedSeats={bookingState?.selectedSeats || []}
                        buttonText="Continue to Checkout"
                        onConfirm={handleProceedToPayment}
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
                        onSkip={() => {
                            setCart({});
                            setTimeout(handleProceedToPayment, 50);
                        }}
                    />
                    <div className="p-6 pt-0 text-center">
                        <button
                            onClick={() => {
                                setCart({});
                                setTimeout(handleProceedToPayment, 50);
                            }}
                            className="text-[13px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 font-roboto"
                        >
                            Skip snacks
                        </button>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-800 pt-4">
                            You can modify your snack order at the counter
                        </p>
                    </div>
                </div>
            </main>

            {/* Mobile Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 p-4 transition-all animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Total Amount</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">₹{(totalAmount * 1.18 + (seats.length * 30)).toFixed(2)}</span>
                            <button
                                onClick={scrollToSummary}
                                className="text-[10px] font-bold text-primary dark:text-primary/80 uppercase tracking-wide hover:underline underline-offset-2"
                            >
                                View Details
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleProceedToPayment}
                        className="flex-1 max-w-[160px] py-3 rounded-xl bg-primary text-white font-bold text-[13px] uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:shadow-none"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

const FoodCard = ({ item, quantity, onAdd, onRemove }) => {
    const imageUrl = (typeof item.image === 'object' && item.image !== null) ? item.image.url : item.image;
    const isImageUrl = imageUrl && (typeof imageUrl === 'string') && (imageUrl.startsWith('http') || imageUrl.startsWith('https') || imageUrl.startsWith('/'));

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
            {/* Top Large Image Section */}
            <div className="aspect-square md:aspect-[4/3] bg-[#fdfdfd] dark:bg-gray-800/50 flex items-center justify-center relative p-4 md:p-8 group transition-colors duration-300">
                {isImageUrl ? (
                    <img
                        src={optimizeImage(imageUrl, { width: 400, quality: 80 })}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <span className="text-4xl md:text-7xl">{item.image || '🍿'}</span>
                )}
            </div>

            {/* Bottom Content Section */}
            <div className="p-3 md:p-6 flex flex-col flex-1 gap-2 md:gap-4">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5 md:gap-1 min-w-0 w-full">
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white text-[13px] md:text-[16px] leading-tight font-roboto truncate flex-2">{item.name}</h3>
                            {item.isPopular && (
                                <span className="bg-[#fff7ed] dark:bg-orange-900/20 text-[#ea580c] dark:text-orange-400 text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded border border-[#ffedd5] dark:border-orange-800/30 uppercase tracking-wider shrink-0">

                                </span>
                            )}
                        </div>
                        <p className="text-[11px] md:text-[13px] text-gray-400 dark:text-gray-500 line-clamp-2">{item.description || 'Delicious snack'}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-auto gap-3">
                    <span className="text-[15px] md:text-[18px] font-black text-gray-900 dark:text-white font-roboto">₹{item.price}</span>

                    {quantity === 0 ? (
                        <button
                            onClick={onAdd}
                            className="w-full md:w-auto px-4 md:px-8 py-1.5 md:py-2 rounded-lg border border-primary/30 dark:border-primary/20 text-primary font-bold text-[11px] md:text-[13px] hover:bg-primary hover:text-white transition-all active:scale-95 font-roboto tracking-wider"
                        >
                            Add
                        </button>
                    ) : (
                        <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-3 md:gap-4 bg-primary text-white rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 shadow-sm font-roboto">
                            <button onClick={onRemove} className="hover:bg-white/20 rounded p-0.5 transition-colors">
                                <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <span className="font-bold text-[13px] md:text-[15px] min-w-[15px] md:min-w-[20px] text-center">{quantity}</span>
                            <button onClick={onAdd} className="hover:bg-white/20 rounded p-0.5 transition-colors">
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ErrorState removed - imported from components

export default FoodSelectionPage;
