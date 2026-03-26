import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ArrowLeft, Calendar, MapPin, Ticket, Share2, Star, ChevronLeft, ChevronRight, ShoppingBag, ExternalLink, X, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import StoreCard from '../components/StoreCard';
import SportCard from '../components/SportCard';
import { getTurfDetails } from '../services/turfService';
import apiCacheManager from '../services/apiCacheManager';

const SportDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, openLogin } = useAuth();

    const [sport, setSport] = useState(location.state?.sport || null);
    const [loading, setLoading] = useState(!sport);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    // Mock Store Data from Figma
    const storeItems = [
        {
            id: "s1",
            name: "KBFC Jersy",
            price: 1500,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: "s2",
            name: "NIKE Boots",
            price: 2000,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: "s3",
            name: "Cricket set",
            price: 3200,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: "s4",
            name: "Cold Spray",
            price: 849,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600"
        }
    ];

    // Mock Explore More venues from Figma
    const moreVenues = [
        {
            id: 'm1',
            name: "Elite Arena Pro",
            rating: 4.8,
            slots: 8,
            location: "Edapally, Kochi",
            tags: ["Football"],
            price: 800,
            imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018"
        },
        {
            id: 'm2',
            name: "Aqua Haven Court",
            rating: 4.8,
            slots: 8,
            location: "Edapally, Kochi",
            tags: ["Swimming"],
            price: 900,
            imageUrl: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e"
        },
        {
            id: 'm3',
            name: "Boundary Box",
            rating: 4.8,
            slots: 8,
            location: "Kakkabad, Kochi",
            tags: ["Cricket"],
            price: 600,
            imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da"
        }
    ];

    const mockSportDetails = {
        name: sport?.name || 'Elite Arena Pro',
        description: 'Our turf features premium FIFA-approved 50mm artificial grass with superior shock absorption. Designed for peak performance, The Arena offers an unparalleled sporting environment for both competitive matches and recreational play. Equipped with professional floodlights and drainage systems for an all-weather experience.',
        venue: 'Elite Arena Pro',
        address: 'Edapally, Kochi, Keralam',
        city: 'Kochi',
        state: 'Kerala',
        price: 800,
        startTime: 'Open 24/7',
        allImages: [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
            'https://images.unsplash.com/photo-1551958219-acbc608c6377',
            'https://images.unsplash.com/photo-1526232759583-26f1fa1aa75da'
        ],
        courts: [
            { id: 'c1', className: 'Main Turf (8v8)', price: 1200, availableSeats: 5 },
            { id: 'c2', className: 'Box Cricket (6v6)', price: 800, availableSeats: 10 }
        ]
    };

    const fetchTurfDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Prioritize the real database ID over the URL slug/name
            const turfId = sport?._id || sport?.id || slug;
            
            // Try fetching real data with cache support using the ID
            const data = await apiCacheManager.getOrFetchTurfDetails(turfId, () => getTurfDetails(turfId));
            
            if (data) {
                setSport(data);
            } else {
                // Fallback for development if API returns nothing but current state is empty
                if (!sport) {
                    console.warn(`Turf not found for ID: ${turfId}, using mock fallback`);
                    setSport(mockSportDetails);
                }
            }
        } catch (err) {
            console.error('Failed to fetch turf details:', err);
            // On error, show error state only if we have no fallback data
            if (!sport) {
                setError('Failed to load venue details');
            }
        } finally {
            setLoading(true); // Small delay to show smooth transition
            setTimeout(() => setLoading(false), 300);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        const handleScroll = () => setIsScrolled(window.scrollY > 500);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });

        fetchTurfDetails();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [slug]);

    const handleGetDirections = () => {
        if (sport?.coordinates && sport.coordinates.length === 2) {
            // GeoJSON is [lng, lat], Google Maps needs [lat, lng]
            const [lng, lat] = sport.coordinates;
            const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            window.open(url, '_blank');
        } else if (sport?.address) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sport.address)}`;
            window.open(url, '_blank');
        }
    };

    const handleCheckout = () => {
        if (!user) {
            openLogin(() => handleCheckout());
            return;
        }
        
        // Use the backend ID if available, otherwise fallback to slug
        const turfId = sport?._id || sport?.id || slug;
        navigate(`/sports/book/${turfId}`, { state: { sport } });
    };

    if (loading) return <LoadingScreen message="Loading Sport Details" />;
    if (!sport) return <ErrorState title="Venue not found" />;

    const images = sport.allImages || [sport.imageUrl];

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0f1115] pb-32 transition-colors duration-300 bg-fixed">
            <SEO title={`${sport.name} - XYNEMA Sports`} description={sport.description} />

            {/* Sharpness Filter Definition */}
            <svg style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <filter id="sharpen-filter">
                    <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" preserveAlpha="true" />
                </filter>
            </svg>

            {/* Sticky Minimal Nav */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'translate-y-0' : '-translate-y-full'} bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-bold truncate max-w-[200px]">{sport.name}</h1>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* --- HERO SECTION --- */}
            <div className="relative w-full min-h-[500px] lg:min-h-[600px] bg-gray-50 flex items-center justify-center overflow-hidden">
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="absolute top-6 right-6 z-50 flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md">
                        <Share2 className="w-4 h-4 ml-[-2px]" />
                    </button>
                </div>

                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[4px] md:blur-none transition-all duration-700"
                    style={{
                        backgroundImage: `url(${images[1] || images[0]})`,
                        filter: isMobile ? 'blur(4px)' : 'url(#sharpen-filter)'
                    }}
                />

                <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 pt-28 pb-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-4">
                    {/* Left: Poster */}
                    <div className="w-full sm:w-[85%] md:w-[320px] lg:w-[700px] shrink-0 mx-auto md:mx-0">
                        <div className="aspect-[1.5/1] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 relative group">
                            <img src={images[0]} alt={sport.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-1" />
                        </div>
                    </div>

                    {/* Right: Glass Details Area */}
                    <div className="w-full md:flex-1 max-w-md mx-auto md:mx-0">
                        <div className="bg-black/10 backdrop-blur-xl border border-white/10 rounded-[12px] p-8 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden transition-all duration-300">
                            <div className="relative z-10 space-y-6 text-left">
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-lg text-white font-bold group">
                                        <Star className="w-4 h-4 fill-white transition-transform group-hover:scale-125" />
                                        <span className="text-sm">{sport.rating > 0 ? sport.rating.toFixed(1) : 'New'}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white/60">
                                        {sport.reviewCount > 0 ? `[${sport.reviewCount.toLocaleString()} ratings]` : '[Be the first to rate]'}
                                    </span>
                                </div>

                                <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
                                    {sport.name}
                                </h1>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-3 text-white/90">
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-sm font-bold">
                                            Available Today, {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-white/90">
                                        <MapPin className="w-5 h-5" />
                                        <p className="text-sm font-medium">{sport.venue}, {sport.city}</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest mb-3">Starting from</p>
                                    <div className="flex items-baseline gap-2 mb-10">
                                        <p className="text-3xl font-black text-white">₹{sport.price.toLocaleString()}</p>
                                        <p className="text-sm font-medium text-white/60">/ hour</p>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full py-5 bg-primary hover:bg-[#ff4e6a] text-white text-[15px] font-bold rounded-xl transition-all shadow-xl active:scale-95"
                                    >
                                        Book Slots
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Info Bar - Restored and refined with reduced-height dividers */}
            <div className="relative z-30 mt-1 mx-2 md:mx-auto max-w-[70%] rounded-xl shadow-sm overflow-hidden">
                <div className="flex flex-wrap md:flex-nowrap items-center min-h-[100px]">
                        <div className="flex-1 min-w-[50%] md:min-w-0 px-8 py-6">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-sm font-bold dark:text-white">Min. {sport.defaultSlotDuration || 60} mins</p>
                        </div>
                        {/* Divider */}
                        <div className="hidden md:block w-[1px] h-10 bg-gray-100 dark:bg-gray-800" />
                        
                        <div className="flex-1 min-w-[50%] md:min-w-0 px-8 py-6">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                            <p className="text-sm font-bold dark:text-white">{sport.paymentType || 'Pay at venue or Online'}</p>
                        </div>
                        {/* Divider */}
                        <div className="hidden md:block w-[1px] h-10 bg-gray-100 dark:bg-gray-800" />
                        
                        <div className="flex-1 min-w-[50%] md:min-w-0 px-8 py-6">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sport Type</p>
                            <p className="text-sm font-bold dark:text-white">{sport.tags?.slice(0, 5).join(' / ') || 'Multi-sport'}</p>
                        </div>
                        {/* Divider */}
                        <div className="hidden md:block w-[1px] h-10 bg-gray-100 dark:bg-gray-800" />
                        
                        <div className="flex-1 min-w-[50%] md:min-w-0 px-8 py-6">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entry</p>
                            <p className="text-sm font-bold dark:text-white">{sport.entryType || 'Valid Booked QR Code'}</p>
                        </div>
                </div>
            </div>

            {/* --- REDESIGNED SECTIONS BELOW --- */}
            <main className="max-w-[70%] mx-auto px-4 sm:px-8 py-12 space-y-16">

                {/* About This Turf */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold dark:text-white">About</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-5xl">
                        {sport.description}
                    </p>
                </section>
                {/* Facilities available */}
                {(() => {
                    const hasVerifiedAmenities = Object.values(sport.amenities || {}).some(val => val === true);
                    const hasDerivedFacilities = sport.description?.toLowerCase().includes('floodlight') || sport.description?.toLowerCase().includes('lighting');
                    
                    if (!hasVerifiedAmenities && !hasDerivedFacilities) return null;

                    return (
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold dark:text-white">Facilities available</h2>
                            <div className="bg-white dark:bg-[#1a1c23] border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-6 gap-x-12">
                                    {[
                                        { key: 'isChangingRoomAvailable', label: 'Changing Rooms' },
                                        { key: 'isParkingAvailable', label: 'Parking' },
                                        { key: 'isWashroomAvailable', label: 'Washroom' },
                                        { key: 'isFirstAidAvailable', label: 'First aid' },
                                        { key: 'isFoodAndBeveragesAvailable', label: 'Food & Beverages' }
                                    ].map((amenity) => (
                                        sport.amenities?.[amenity.key] === true && (
                                            <div key={amenity.key} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-100 flex items-center justify-center shrink-0">
                                                    <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{amenity.label}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </section>
                    );
                })()}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold dark:text-white">Location</h2>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-bold dark:text-white">{sport.venue}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{sport.address}</p>
                            </div>
                             <button 
                                onClick={handleGetDirections}
                                className="px-4 py-2 bg-primary text-white text-[12px] font-bold rounded-lg hover:bg-[#ff4e6a] transition-all"
                            >
                                Get directions
                            </button>
                        </div>
                    </div>
                </section>

                {/* Turf Gallery Carousel */}
                <section className="space-y-6 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold dark:text-white">Gallery</h2>
                        <div className="flex gap-2">
                            <button className="gallery-prev w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center dark:text-white hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button className="gallery-next w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center dark:text-white hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative group/gallery">
                        <Swiper
                            modules={[Navigation]}
                            spaceBetween={20}
                            slidesPerView={1}
                            navigation={{
                                nextEl: '.gallery-next',
                                prevEl: '.gallery-prev',
                            }}
                            breakpoints={{
                                640: { slidesPerView: 2 },
                                1024: { slidesPerView: 2 }
                            }}
                            className="!overflow-visible"
                        >
                            {images.map((img, idx) => (
                                <SwiperSlide key={idx}>
                                    <div 
                                        onClick={() => setFullScreenImage(img)}
                                        className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 aspect-video group cursor-zoom-in"
                                    >
                                        <img 
                                            src={img} 
                                            alt={`Turf Gallery ${idx + 1}`} 
                                            className="w-full h-full object-cover transition-transform duration-500" 
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </section>

                {/* Explore the store */}
                <section className="space-y-8 py-8 bg-[#f5f5f5] dark:bg-[#0a0c10] -mx-4 sm:-mx-8 md:-mx-12 px-4 sm:px-8 md:px-12 rounded-3xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black dark:text-white">Explore the store</h2>
                        <Link to="/store" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-all">
                            <ShoppingBag className="w-4 h-4" /> Visit Store
                        </Link>
                    </div>
                    <div className="relative group/slider">
                        <Swiper
                            modules={[Navigation]}
                            spaceBetween={20}
                            slidesPerView={2}
                            navigation={{ nextEl: '.store-next', prevEl: '.store-prev' }}
                            breakpoints={{
                                640: { slidesPerView: 3 },
                                1024: { slidesPerView: 4 }
                            }}
                        >
                            {storeItems.map(item => (
                                <SwiperSlide key={item.id} className="!h-auto">
                                    <StoreCard item={item} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <button className="store-prev absolute -left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-800 shadow-xl rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-700 opacity-0 group-hover/slider:opacity-100 transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button className="store-next absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-800 shadow-xl rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-700 opacity-0 group-hover/slider:opacity-100 transition-all">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </section>

                {/* Explore More Section */}
                <section className="space-y-8 pt-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black dark:text-white">Explore More</h2>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                            <ChevronRight className="w-6 h-6 text-primary" />
                        </button>
                    </div>
                    <div className="relative group/slider">
                        <Swiper
                            modules={[Navigation]}
                            spaceBetween={24}
                            slidesPerView={1}
                            navigation={{ nextEl: '.more-next', prevEl: '.more-prev' }}
                            breakpoints={{
                                768: { slidesPerView: 2 },
                                1024: { slidesPerView: 3 }
                            }}
                        >
                            {moreVenues.map(venue => (
                                <SwiperSlide key={venue.id}>
                                    <SportCard event={venue} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <button className="more-next absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center border border-gray-100 dark:border-gray-700 opacity-0 group-hover/slider:opacity-100 transition-all">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </section>
            </main>

            {/* Sticky Minimal Booking Bar (Appears after hero button scrolls out) */}
            {isScrolled && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 p-4 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-[70%] mx-auto flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Starting from</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black dark:text-white">₹{sport.price.toLocaleString()}</span>
                                <span className="text-[10px] text-gray-400 font-medium lowercase">/ hour</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout} 
                            className="px-8 py-3.5 bg-primary text-white text-[13px] font-black rounded-lg shadow-lg hover:bg-[#ff4e6a] transition-all flex items-center gap-2 uppercase tracking-wider"
                        >
                            Book Slots <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Full Screen Image Modal */}
            {fullScreenImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
                    <button 
                        onClick={() => setFullScreenImage(null)}
                        className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all z-[110]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
                        <img 
                            src={fullScreenImage} 
                            alt="Full Screen Turf View" 
                            className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in-95 duration-300" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportDetailsPage;
