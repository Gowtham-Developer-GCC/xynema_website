import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ArrowLeft, Calendar, MapPin, Ticket, Share2, Star, ChevronLeft, ChevronRight, ShoppingBag, ExternalLink, X, Check, Shield, Info, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import StoreCard from '../components/StoreCard';
import SportCard from '../components/SportCard';
import { getTurfDetails, getSimilarTurfs } from '../services/turfService';
import apiCacheManager from '../services/apiCacheManager';

const SportDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, openLogin } = useAuth();
    const { turfs, loading: dataLoading, refreshData } = useData();

    // SWR Optimization: Use passed state, then check global cache, then fetch fresh
    const [sport, setSport] = useState(() => {
        if (location.state?.sport) return location.state.sport;
        const cached = turfs.find(t => String(t._id || t.id) === String(slug));
        return cached || null;
    });

    const [loading, setLoading] = useState(!sport);
    const [error, setError] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [similarSports, setSimilarSports] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);

    // Mock Explore More venues fallback
    const moreVenues = [
        { id: 'm1', name: "Elite Arena Pro", rating: 4.8, location: "Edapally, Kochi", tags: ["Football"], price: 800, imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018" },
        { id: 'm2', name: "Aqua Haven Court", rating: 4.8, location: "Edapally, Kochi", tags: ["Swimming"], price: 900, imageUrl: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e" }
    ];

    const fetchTurfDetails = async (targetId) => {
        const turfId = targetId || sport?._id || sport?.id || slug;
        const hasInitialData = !!targetId ? false : !!sport;

        try {
            if (!hasInitialData) setLoading(true);
            setError(null);
            const data = await apiCacheManager.getOrFetchTurfDetails(turfId, () => getTurfDetails(turfId));
            if (data) {
                setSport(data);
                fetchSimilarSports(turfId);
            }
        } catch (err) {
            console.error('Failed to fetch turf details:', err);
            if (!hasInitialData) setError('Failed to load venue details');
        } finally {
            setLoading(false);
        }
    };

    const fetchSimilarSports = async (turfId) => {
        try {
            setLoadingSimilar(true);
            const data = await apiCacheManager.getOrFetchSimilarTurfs(turfId, () => getSimilarTurfs(turfId));
            if (data && Array.isArray(data)) {
                setSimilarSports(data.filter(t => String(t._id || t.id) !== String(turfId)));
            }
        } catch (err) {
            console.error('Error fetching similar sports:', err);
        } finally {
            setLoadingSimilar(false);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        const handleScroll = () => setIsScrolled(window.scrollY > 300);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });

        const nextSport = location.state?.sport;
        if (nextSport && String(nextSport._id || nextSport.id) === String(slug)) {
            setSport(nextSport);
            fetchTurfDetails(slug);
        } else {
            setSport(null);
            setSimilarSports([]);
            fetchTurfDetails(slug);
        }
        
        window.scrollTo(0, 0);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [slug]);

    const handleGetDirections = () => {
        if (sport?.coordinates && sport.coordinates.length === 2) {
            const [lng, lat] = sport.coordinates;
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
        } else if (sport?.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sport.address)}`, '_blank');
        }
    };

    const handleCheckout = () => {
        if (!user) {
            openLogin(() => handleCheckout());
            return;
        }
        const turfId = sport?._id || sport?.id || slug;
        navigate(`/sports/book/${turfId}`, { state: { sport } });
    };

    const isSwimming = sport?.tags?.some(tag => tag.toLowerCase().includes('swimming') || tag.toLowerCase().includes('pool')) || 
                      sport?.name?.toLowerCase().includes('swimming') || sport?.name?.toLowerCase().includes('pool');

    const storeItems = isSwimming ? [
        { id: "swim1", name: "Decathlon Nabaiji Goggles", price: 599, sellers: 3, imageUrl: "https://contents.mediadecathlon.com/p1498634/k$f2f7ba51c1fce8d76d4352f52d0f0d2c/swimming-goggles-100-soft-clear-lenses-grey.jpg" },
        { id: "swim2", name: "Nabaiji Swimming Fins", price: 1299, sellers: 2, imageUrl: "https://contents.mediadecathlon.com/p2155554/k$6127e4e138ae348da07a0f670f5e7146/swimming-fins-top-swim-fins-black-blue.jpg" },
        { id: "swim3", name: "Nabaiji Mesh Bag", price: 499, sellers: 1, imageUrl: "https://contents.mediadecathlon.com/p1747833/k$7d6c6a8f1f7d6f5f9e9f7d6f5f9e9f7d/swimming-mesh-bag-black.jpg" },
        { id: "swim4", name: "Speedo Silicone Cap", price: 350, sellers: 5, imageUrl: "https://images.unsplash.com/photo-1599058917232-d750c1830028?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60" }
    ] : [
        { id: "s1", name: "Sports wear", price: 1500, sellers: 3, imageUrl: "https://www.jumpusa.in/cdn/shop/products/1_911774af-e103-482b-a637-1f10a2518420.jpg?v=1646462787" },
        { id: "s2", name: "Sports shoes", price: 2000, sellers: 3, imageUrl: "https://uspoloassn.in/cdn/shop/files/1_dddf6968-3bfe-48b1-986b-5ce9d7888f8b_500x.jpg?v=1763723178" },
        { id: "s3", name: "Badminton racket", price: 3200, sellers: 3, imageUrl: "https://t3.ftcdn.net/jpg/04/67/21/02/360_F_467210294_EZNVxSdoJSKeV2rsU0G49PEj00bjv5gW.jpg" },
        { id: "s4", name: "Football", price: 849, sellers: 3, imageUrl: "https://as1.ftcdn.net/jpg/01/59/01/16/1000_F_159011637_QFaJ5bZmyPKwurU8esvTqBP6iNvjbw4s.jpg" }
    ];

    if (loading && !sport) return <LoadingScreen message="Loading Sport Details" />;
    if (error && !sport) return <ErrorState error={error} onRetry={() => fetchTurfDetails()} title="Transmission Interrupted" />;
    if (!sport) return <ErrorState title="Venue not found" />;

    const images = (sport.allImages && sport.allImages.length > 0) ? sport.allImages : [sport.imageUrl || "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e"];

    return (
        <div className={`min-h-screen ${isSwimming ? 'bg-[#F5F5F5]' : 'bg-[#FDFDFD]'} dark:bg-[#0f1115] pb-24 transition-colors duration-300 overflow-x-hidden`}>
            <SEO title={`${sport.name} - XYNEMA Sports`} description={sport.description} />

            <svg style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <filter id="sharpen-filter">
                    <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" preserveAlpha="true" />
                </filter>
            </svg>

            {/* Sticky Minimal Nav */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'translate-y-0' : '-translate-y-full'} bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm px-4`}>
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-bold truncate max-w-[200px] uppercase tracking-tight">{sport.name}</h1>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* --- HERO SECTION --- */}
            <div className="relative w-full h-[350px] md:h-[500px] lg:h-[600px] overflow-hidden">
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full opacity-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-[90px] bg-[#F5F5F5] dark:bg-[#0f1115]" />
                    <div className="absolute bottom-0 left-0 w-full h-[85px] bg-[#F5F5F5] dark:bg-[#0f1115] shadow-[inset_0px_15px_15px_5px_rgba(0,0,0,0.1)] rounded-full translate-y-1/2" />
                </div>

                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
                    style={{ backgroundImage: `url(${images[0]})`, filter: isMobile ? 'blur(4px)' : 'none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            </div>

            {/* Floating Info Section Overlapping Hero */}
            <div className="relative z-30 -mt-20 md:-mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-1 w-full space-y-6">
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/40 dark:border-gray-800 p-8 md:p-10 rounded-[40px] shadow-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center gap-1 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-full">
                                    <Star className="w-3 h-3 fill-white" />
                                    {sport.rating > 0 ? sport.rating.toFixed(1) : 'New'}
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {sport.reviewCount > 0 ? `${sport.reviewCount.toLocaleString()} ratings` : 'Verified Venue'}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter uppercase mb-6">
                                {sport.name}
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Venue Location</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{sport.venue}, {sport.city}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <Calendar className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Availability</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{sport.startTime || 'Open 24/7'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Min. Slot', value: `${sport.defaultSlotDuration || 60} mins` },
                                { label: 'Payment', value: sport.paymentType || 'Online/Venue' },
                                { label: 'Type', value: sport.tags?.slice(0, 1).join('') || 'Sport' },
                                { label: 'Safety', value: 'High Standards' }
                            ].map((info, i) => (
                                <div key={i} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-6 rounded-[32px] border border-white/20 dark:border-gray-700">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{info.label}</p>
                                    <p className="text-xs font-black dark:text-white uppercase truncate">{info.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] shrink-0 sticky top-24">
                        <div className="relative group">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-[340px] bg-primary rounded-2xl p-6 shadow-2xl border border-white/30 z-20 flex items-center justify-between overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                <div>
                                    <h4 className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">Exclusive Pass</h4>
                                    <p className="text-lg font-black text-white leading-none uppercase">Xynema Crown</p>
                                </div>
                                <button className="px-4 py-2 bg-white text-primary text-[10px] font-black uppercase rounded-lg shadow-md hover:scale-105 transition-all">Upgrade</button>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-[40px] p-8 pt-20 border border-gray-100 dark:border-gray-800 shadow-2xl relative">
                                <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest mb-3">Starting from</p>
                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-5xl font-black text-gray-900 dark:text-white leading-none">₹{sport.price.toLocaleString()}</span>
                                    <span className="text-sm font-bold text-gray-400">/ hour</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-6 bg-primary hover:bg-[#ff3d5a] text-white text-base font-black rounded-3xl transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase tracking-widest"
                                >
                                    Instant Book
                                </button>
                                <p className="text-[10px] text-center text-gray-400 font-medium mt-6 uppercase">Free cancellation up to 6 hours before</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 space-y-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <section className="space-y-8">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">The Experience</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed font-medium">{sport.description}</p>
                        <div className="grid grid-cols-2 gap-6 pt-8">
                            {[
                                { key: 'isParkingAvailable', label: 'Spacious Parking' },
                                { key: 'isWashroomAvailable', label: 'Clean Washrooms' },
                                { key: 'isChangingRoomAvailable', label: 'Changing Rooms' },
                                { key: 'isFoodAndBeveragesAvailable', label: 'Cafe & Drinks' }
                            ].map((amenity) => (
                                sport.amenities?.[amenity.key] !== false && (
                                    <div key={amenity.key} className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-green-600" />
                                        </div>
                                        <span className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-wide">{amenity.label}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </section>
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Gallery</h2>
                            <div className="flex gap-2">
                                <button className="gallery-prev w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center dark:text-white hover:bg-primary transition-all bg-white dark:bg-gray-900"><ChevronLeft className="w-6 h-6" /></button>
                                <button className="gallery-next w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center dark:text-white hover:bg-primary transition-all bg-white dark:bg-gray-900"><ChevronRight className="w-6 h-6" /></button>
                            </div>
                        </div>
                        <div className="relative rounded-[40px] overflow-hidden">
                            <Swiper modules={[Navigation]} spaceBetween={20} slidesPerView={1} navigation={{ nextEl: '.gallery-next', prevEl: '.gallery-prev' }}>
                                {images.map((img, idx) => (
                                    <SwiperSlide key={idx}>
                                        <div onClick={() => setFullScreenImage(img)} className="aspect-[4/3] rounded-[40px] overflow-hidden cursor-zoom-in">
                                            <img src={img} alt="Venue" className="w-full h-full object-cover" />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </section>
                </div>

                <section className="space-y-12 py-20 px-8 rounded-[60px] bg-[#1E1E1E] text-white">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Exclusive Gear</p>
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Official Merchandise</h2>
                        </div>
                        <Link to="/store" className="px-8 py-3 bg-white text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-full">Visit Store</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {storeItems.map(item => (
                            <div key={item.id} className="group cursor-pointer">
                                <div className="aspect-[1/1] bg-white rounded-[32px] overflow-hidden mb-6 relative">
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute bottom-4 right-4 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <button className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white"><ShoppingBag className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight mb-1">{item.name}</h3>
                                <p className="text-primary font-black">₹{item.price}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-20 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8">
                            <h2 className="text-4xl font-black uppercase tracking-tighter">Explore Location</h2>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black opacity-80 uppercase">{sport.venue}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{sport.address}</p>
                            </div>
                            <button onClick={handleGetDirections} className="px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all shadow-2xl">
                                <MapPin className="w-4 h-4" /> Get Directions
                            </button>
                        </div>
                        <div className="w-full lg:w-[600px] h-[400px] rounded-[40px] overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-800 relative">
                            <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1" alt="Map" className="w-full h-full object-cover grayscale opacity-50" />
                            <div className="absolute inset-0 flex items-center justify-center"><MapPin className="w-12 h-12 text-primary animate-bounce" /></div>
                        </div>
                    </div>
                </section>

                <section className="pb-20">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-4xl font-black uppercase tracking-tighter">Recommended for you</h2>
                        <Link to="/sports" className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 group">
                            Explore More <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {similarSports.length > 0 ? (
                            similarSports.slice(0, 3).map(venue => (<SportCard key={venue._id || venue.id} event={venue} />))
                        ) : (
                            moreVenues.map(venue => (<SportCard key={venue.id} event={venue} />))
                        )}
                    </div>
                </section>
            </main>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 p-6 px-8 flex items-center justify-between safe-bottom">
                <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Starting at</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">₹{sport.price}</p>
                </div>
                <button onClick={handleCheckout} className="px-10 py-4 bg-primary text-white text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">Book Now</button>
            </div>

            {fullScreenImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
                    <button onClick={() => setFullScreenImage(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 z-[110]"><X className="w-6 h-6" /></button>
                    <img src={fullScreenImage} alt="Gallery" className="max-w-full max-h-full object-contain rounded-2xl animate-in zoom-in-95 duration-500 shadow-2xl" />
                </div>
            )}
        </div>
    );
};

export default SportDetailsPage;
