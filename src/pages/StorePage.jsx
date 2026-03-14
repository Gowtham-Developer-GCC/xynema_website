import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Filter, ArrowLeft, Loader } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import ErrorState from '../components/ErrorState';
import LoadingScreen from '../components/LoadingScreen';
import { designSystem } from '../config/design-system';
import { animationStyles } from '../styles/components';
import { getMerchandise } from '../services/storeService';

const StorePage = () => {
    const navigate = useNavigate();
    const { user, openLogin } = useAuth();
    const [cart, setCart] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [storeItems, setStoreItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStoreData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMerchandise();
            setStoreItems(data || []);
        } catch (err) {
            console.error('Store fetch failed:', err);
            setError(err.message || 'Failed to load store products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStoreData();
    }, []);

    const categories = ['All', ...new Set(storeItems.map(item => item.category))];
    const filteredItems = storeItems.filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const itemName = (item.title || item.name || '').toLowerCase();
        const matchesSearch = itemName.includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
        const item = storeItems.find(i => i.id === id || i.id === parseInt(id));
        const price = typeof item?.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : (item?.price || 0);
        return total + price * qty;
    }, 0);

    const handleAddToCart = (item) => {
        setCart(prev => ({
            ...prev,
            [item.id]: (prev[item.id] || 0) + 1
        }));
    };

    const handleCheckout = (injectedUser = null) => {
        // Ensure injectedUser is actually a user object, not a React event
        const validInjectedUser = (injectedUser && typeof injectedUser === 'object' && !injectedUser.nativeEvent) ? injectedUser : null;
        const currentUser = validInjectedUser || user;

        if (!currentUser || !currentUser.token) {
            openLogin((userFromLogin) => handleCheckout(userFromLogin));
            return;
        }
        // Proceed to payment logic here (or next page)
        console.log('Proceeding to payment for cart total:', cartTotal);
    };

    if (error) return <ErrorState error={error} onRetry={fetchStoreData} title="Order Interrupted" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA]">
            <SEO title="XYNEMA Store - Movie Merchandise & Snacks" description="Order your favorite snacks and movie gear online" />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-xynemaRose transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <h1 className="text-sm font-bold text-gray-900">Official Store</h1>
                    <div className="relative">
                        <ShoppingCart className="w-5 h-5 text-gray-900" />
                        {Object.keys(cart).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-xynemaRose text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {Object.values(cart).reduce((a, b) => a + b, 0)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Store Main Content */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <LoadingScreen message="Syncing Catalog" />
                        ) : (
                            <>
                                {/* Controls */}
                                <div className="mb-10 space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="What are you looking for?"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-xynemaRose transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Categories Scroll */}
                                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-xynemaRose text-white border-xynemaRose' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Items Grid - Two items per row on mobile */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col"
                                        >
                                            <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center aspect-square md:h-100">
                                                {item.imageUrl || item.image ? (
                                                    <img
                                                        src={item.imageUrl || item.image}
                                                        alt={item.title || item.name}
                                                        className="w-full h-full object-contain transition-transform group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="text-4xl md:text-6xl">🍿</div>
                                                )}
                                            </div>
                                            <div className="p-3 md:p-6 flex flex-col flex-1">
                                                <h3 className="font-bold text-gray-900 text-[10px] md:text-sm mb-1 line-clamp-1">{item.title || item.name}</h3>
                                                <p className="text-xs md:text-lg font-display font-black text-xynemaRose mb-3">
                                                    {typeof item.price === 'number' ? `₹${item.price}` : item.price}
                                                </p>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    className="mt-auto w-full py-2.5 md:py-3 rounded-lg font-black text-white text-[9px] md:text-xs bg-xynemaRose transition-all shadow-md active:scale-95 uppercase tracking-wider"
                                                >
                                                    Add to Order
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Cart Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="font-display font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-xynemaRose" />
                                Your Order
                            </h3>

                            {Object.keys(cart).length > 0 ? (
                                <>
                                    <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                                        {Object.entries(cart).map(([id, qty]) => {
                                            const item = storeItems.find(i => i.id === id || i.id === parseInt(id));
                                            const price = typeof item?.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : (item?.price || 0);
                                            return (
                                                <div key={id} className="flex justify-between items-start text-xs border-b border-gray-50 pb-3 h-auto">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900 mb-0.5 line-clamp-1 h-auto">{item?.title || item?.name}</p>
                                                        <p className="text-gray-400">Qty: {qty}</p>
                                                    </div>
                                                    <span className="font-bold text-gray-900 ml-2">₹{price * qty}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Subtotal</span>
                                            <span className="text-2xl font-bold text-gray-900">₹{cartTotal}</span>
                                        </div>

                                        <button 
                                            onClick={() => handleCheckout()}
                                            className="w-full py-4 rounded-lg font-display font-bold text-white text-sm bg-xynemaRose transition-all shadow-lg active:scale-98"
                                        >
                                            Proceed to Payment
                                        </button>
                                        <p className="text-[10px] text-gray-400 text-center mt-3 font-medium font-sans">Safe & Secure Transactions</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingCart className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 text-sm font-medium">Your cart is feeling light</p>
                                    <p className="text-[10px] text-gray-300 mt-1">Add some favorites to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            {/* Mobile Sticky Cart Footer */}
            {Object.keys(cart).length > 0 && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-8 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{Object.keys(cart).length} Items</p>
                            <p className="text-xl font-bold text-gray-900">₹{cartTotal.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => {
                                const cartElement = document.querySelector('.lg\\:col-span-1');
                                if (cartElement) cartElement.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-xs font-bold text-xynemaRose uppercase tracking-wider underline opacity-0 hidden"
                        >
                            View Cart
                        </button>
                    </div>
                    <button 
                        onClick={() => handleCheckout()}
                        className="w-full py-3.5 rounded-xl bg-xynemaRose text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-xynemaRose/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Proceed to Payment
                    </button>
                </div>
            )}
        </div>
    );
};

export default StorePage;
