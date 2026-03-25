import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Share2, Globe, Phone, Mail, Instagram, Twitter, Facebook, ExternalLink, Info, Star, ChevronLeft, ChevronRight, PartyPopper, ShoppingBag, Shield, Check, Users, Sparkles, Zap, Building } from 'lucide-react';
import SEO from '../components/SEO';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { optimizeImage } from '../utils/helpers';

const SportDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedCity } = useData();
    const { user, openLogin } = useAuth();
    
    // Initial state from location if available
    const [sport, setSport] = useState(location.state?.sport || null);
    const [loading, setLoading] = useState(!sport);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isReserving, setIsReserving] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const heroButtonRef = useRef(null);
    const [heroButtonVisible, setHeroButtonVisible] = useState(true);

    // Mock Sport Details - Simulating a multi-court sport venue (like a multi-day event)
    const mockSportDetails = {
        id: '123',
        name: sport?.name || 'Red Field Sports Arena',
        slug: slug,
        description: 'Elite sports facility featuring premium FIFA-grade turfs, professional lighting, and international standard amenities. Perfect for football, cricket, and multisport activities. \n\nOur facility offers dedicated zones for different sports with shock-absorbent surfaces to ensure player safety and high-performance play. We have 24/7 solar-powered floodlights, premium showers, and a player lounge for the ultimate experience.',
        venue: sport?.venue || 'Kochi Sports Hub',
        address: 'MG Road, Jos Junction',
        city: sport?.city || 'Kochi',
        state: 'Kerala',
        pricePerHour: sport?.price || 1200,
        allImages: [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
            'https://images.unsplash.com/photo-1526232759583-26f1fa1aa75da',
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea'
        ],
        sportTypes: sport?.tags || ['Football', 'Cricket'],
        amenities: ['Floodlights', 'Indoor', 'Parking', 'Showers', 'Lounge'],
        rating: 4.8,
        reviewCount: 124,
        organization: 'Elite Sports Management',
        // Courts behave like "ShowDates" in a multi-day event
        courts: [
            { id: 'c1', name: 'Main Football Turf', sportType: 'Football', price: 1200, available: true },
            { id: 'c2', name: 'Indoor Badminton Court', sportType: 'Badminton', price: 500, available: true },
            { id: 'c3', name: 'Box Cricket Arena', sportType: 'Cricket', price: 1500, available: false }
        ]
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 300);
        };
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        // Simulate fetching details
        if (!sport) {
            setTimeout(() => {
                setSport(mockSportDetails);
                setLoading(false);
            }, 800);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleReserve = () => {
        if (!user) {
            openLogin();
            return;
        }
        if (!selectedSlot) {
            alert('Please select a court/slot to proceed');
            return;
        }
        setIsReserving(true);
        // Simulate navigation to booking
        setTimeout(() => {
            alert('Proceeding to slot booking...');
            setIsReserving(false);
        }, 1000);
    };

    if (loading) return <LoadingScreen message="Inspecting Field Conditions..." />;
    if (error || !sport) return <ErrorState error={error} title="Venue Unavailable" />;

    const images = sport.allImages || [sport.imageUrl];

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0f1115] pb-32 transition-colors duration-300">
            <SEO title={`${sport.name} - XYNEMA Sports`} description={sport.description} />

            {/* Sticky Header */}
            <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-bold truncate max-w-[200px]">{sport.name}</h1>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative w-full min-h-[500px] lg:min-h-[600px] bg-gray-900 flex items-center justify-center overflow-hidden">
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="absolute inset-0">
                    <img 
                        src={images[activeImageIndex]} 
                        className="w-full h-full object-cover opacity-60 scale-105" 
                        alt="Venue Backdrop" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 flex flex-col md:flex-row items-center gap-10 md:gap-16 pt-20">
                    {/* Poster */}
                    <div className="w-full md:w-[400px] lg:w-[500px] shrink-0">
                        <div className="aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                            <img src={images[activeImageIndex]} className="w-full h-full object-cover" alt={sport.name} />
                        </div>
                    </div>

                    {/* Content Card */}
                    <div className="w-full md:flex-1">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-6 md:p-10 shadow-2xl space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
                                    {(sport.tags && sport.tags[0]) || (sport.sportTypes && sport.sportTypes[0]) || 'Sports'}
                                </span>
                                <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border border-white/20">
                                    Multi-Sport Facility
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                                {sport.name}
                            </h1>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                        <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white tracking-wide">{sport.venue}</p>
                                        <p className="text-sm text-white/70 italic">{sport.city}, {sport.state}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Starting from</p>
                                    <p className="text-3xl font-black text-white">₹{sport.pricePerHour || sport.price}<span className="text-sm font-medium opacity-60 ml-1">/ hour</span></p>
                                </div>
                                <button
                                    onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all"
                                >
                                    Select Slot
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Info Bar */}
            <div className="relative z-20 bg-white dark:bg-[#1a1c23] border border-gray-100 dark:border-gray-800 shadow-xl -mt-10 mx-auto max-w-6xl rounded-[32px] overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
                    <div className="p-6 flex items-center gap-4">
                        <Zap className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Amenities</p>
                            <p className="text-sm font-black dark:text-gray-100">{sport.amenities?.length}+ Available</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-center gap-4">
                        <Users className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                            <p className="text-sm font-black dark:text-gray-100">Professional</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-center gap-4">
                        <Building className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Experience</p>
                            <p className="text-sm font-black dark:text-gray-100">Premium</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-center gap-4">
                        <Shield className="w-6 h-6 text-primary" />
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Safety</p>
                            <p className="text-sm font-black dark:text-gray-100">Certified</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-4 md:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8 space-y-12">
                    {/* Description */}
                    <section className="bg-white dark:bg-[#1a1c23] p-8 md:p-12 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-2xl font-black mb-6 tracking-tight dark:text-white">Facility Details</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed whitespace-pre-line">
                            {sport.description}
                        </p>
                        
                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
                            {sport.amenities?.map(amenity => (
                                <span key={amenity} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400">
                                    <Check className="w-3 h-3 text-primary" />
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Similar Venues Placeholder */}
                    <section className="bg-primary/5 rounded-[40px] p-10 border border-primary/10">
                        <div className="flex items-center gap-4 mb-4">
                            <Sparkles className="w-8 h-8 text-primary" />
                            <h3 className="text-2xl font-black tracking-tight text-primary">Pro Tip</h3>
                        </div>
                        <p className="text-primary/70 font-medium">Book during morning hours (6 AM - 10 AM) to avail flat 20% discount on all turf bookings.</p>
                    </section>
                </div>

                {/* Sidebar - Slot Selection */}
                <div className="lg:col-span-4" id="booking-section">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-white dark:bg-[#1a1c23] p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16" />
                            
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 dark:text-white">
                                <Ticket className="text-primary" /> Select Venue
                            </h3>

                            <div className="space-y-4">
                                {sport.courts?.map(court => (
                                    <button
                                        key={court.id}
                                        disabled={!court.available}
                                        onClick={() => setSelectedSlot(court.id)}
                                        className={`w-full p-5 rounded-2xl border text-left transition-all relative ${
                                            selectedSlot === court.id 
                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                                            : !court.available 
                                                ? 'opacity-50 grayscale cursor-not-allowed bg-gray-50' 
                                                : 'border-gray-100 hover:border-gray-300 bg-gray-50/50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-black dark:text-gray-100">{court.name}</p>
                                            {!court.available && <span className="text-[10px] font-black uppercase text-red-500">Fully Booked</span>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{court.sportType}</p>
                                            <p className="text-xl font-black text-primary">₹{court.price}</p>
                                        </div>
                                        {selectedSlot === court.id && (
                                            <div className="absolute -right-2 -top-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                                                <Check className="w-3 h-3" strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleReserve}
                                disabled={isReserving || !selectedSlot}
                                className="w-full mt-10 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                            >
                                {isReserving ? 'Securing Slot...' : 'Book Venue Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SportDetailsPage;
