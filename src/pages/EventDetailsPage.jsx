import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import StoreCard from '../components/StoreCard';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Share2, Globe, Phone, Mail, Instagram, Twitter, Facebook, ExternalLink, Info, Star, ChevronLeft, ChevronRight, PartyPopper, ShoppingBag } from 'lucide-react';
import SEO from '../components/SEO';
import { getEventDetails, reserveEventTickets, getSimilarEvents } from '../services/eventService';
import apiCacheManager from '../services/apiCacheManager';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import SimilarEventCard from '../components/SimilarEventCard';
import { optimizeImage } from '../utils/helpers';

const EventDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedCity } = useData();
    const { user, openLogin } = useAuth();
    const [event, setEvent] = useState(location.state?.event || null);
    const [loading, setLoading] = useState(!event);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [ticketQuantities, setTicketQuantities] = useState({});
    const [isReserving, setIsReserving] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
    const [similarEvents, setSimilarEvents] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const storeScrollRef = useRef(null);
    const galleryScrollRef = useRef(null);

    // Multi-day selection state
    const [selectedShowTimeIndex, setSelectedShowTimeIndex] = useState(0);

    const heroButtonRef = useRef(null);
    const [heroButtonVisible, setHeroButtonVisible] = useState(true);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setHeroButtonVisible(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        if (heroButtonRef.current) {
            observer.observe(heroButtonRef.current);
        }

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 300);
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (heroButtonRef.current) observer.unobserve(heroButtonRef.current);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const foundEvent = await apiCacheManager.getOrFetchEventDetails(slug, () => getEventDetails(slug));

            if (foundEvent) {
                setEvent(foundEvent);
                // Fetch similar events using the actual event ID
                try {
                    const similar = await apiCacheManager.getOrFetchSimilarEvents(foundEvent.id, () => getSimilarEvents(foundEvent.id));
                    setSimilarEvents(similar || []);
                } catch (err) {
                    console.error('Failed to fetch similar events:', err);
                    setSimilarEvents([]);
                }
            } else {
                setError('Event not found');
            }
        } catch (err) {
            console.error('Failed to fetch event details:', err);
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventDetails();
    }, [slug]);

    const getCurrentTickets = () => {
        if (event.eventType === 'multi-day' && event.showTimes?.length > 0) {
            return event.showTimes[selectedShowTimeIndex]?.ticketClasses || [];
        }
        return event.tickets || [];
    };

    const updateTicketQuantity = (ticketId, change) => {
        setTicketQuantities(prev => {
            const currentQty = prev[ticketId] || 0;
            const newQty = Math.max(0, Math.min(10, currentQty + change));
            if (newQty === 0) {
                const { [ticketId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [ticketId]: newQty };
        });
    };

    const getTotalAmount = () => {
        const tickets = getCurrentTickets();
        return Object.entries(ticketQuantities).reduce((total, [ticketId, qty]) => {
            const ticket = tickets.find(t => t.id === ticketId);
            return total + (ticket ? ticket.price * qty : 0);
        }, 0);
    };

    const getTotalTickets = () => {
        return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
    };

    const handleReserveTickets = async (injectedUser = null) => {
        // Ensure injectedUser is actually a user object, not a React event
        const validInjectedUser = (injectedUser && typeof injectedUser === 'object' && !injectedUser.nativeEvent) ? injectedUser : null;
        const currentUser = validInjectedUser || user;

        if (!currentUser || !currentUser.token) {
            openLogin((userFromLogin) => handleReserveTickets(userFromLogin));
            return;
        }

        const totalTickets = getTotalTickets();
        if (totalTickets === 0) {
            alert('Please select at least one ticket');
            return;
        }

        const tickets = getCurrentTickets();
        const selectedTickets = Object.entries(ticketQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([ticketId, quantity]) => ({
                ticketClassId: ticketId,
                quantity
            }));

        if (event.eventType === 'multi-day') {
            // Navigate to the new show selection page instead of booking directly
            const enrichedTickets = Object.entries(ticketQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([ticketId, quantity]) => {
                    const ticket = tickets.find(t => t.id === ticketId);
                    return {
                        ticketClassId: ticketId,
                        className: ticket.className,
                        quantity,
                        pricePerTicket: ticket.price,
                        totalPrice: ticket.price * quantity
                    };
                });

            navigate(`/event/${event.slug}/shows`, {
                state: {
                    event,
                    selectedTickets,
                    ticketQuantities,
                    enrichedTickets,
                    totalAmount: getTotalAmount(),
                }
            });
            return;
        }

        setIsReserving(true);
        try {
            let showDate = null;
            let showTime = event.startTime;

            try {
                const dt = new Date(event.startDate);
                showDate = dt.toISOString();
            } catch (e) {
                showDate = event.startDate;
            }

            console.log('[Reserve] Sending:', { showDate, showTime, tickets: selectedTickets });

            const result = await reserveEventTickets(event.id, selectedTickets, showDate, showTime);

            if (result?.reservationId) {
                // Navigate to booking summary with enriched ticket data
                const enrichedTickets = Object.entries(ticketQuantities)
                    .filter(([_, qty]) => qty > 0)
                    .map(([ticketId, quantity]) => {
                        const ticket = tickets.find(t => t.id === ticketId);
                        return {
                            ticketClassId: ticketId,
                            className: ticket.className,
                            quantity,
                            pricePerTicket: ticket.price,
                            totalPrice: ticket.price * quantity
                        };
                    });

                navigate('/events/booking-summary', {
                    state: {
                        event,
                        reservationId: result.reservationId,
                        selectedTickets: enrichedTickets,
                        totalAmount: getTotalAmount(),
                        selectedDate: showDate,
                        selectedTime: showTime
                    }
                });
            } else {
                alert('Failed to reserve tickets. Please try again.');
            }
        } catch (error) {
            console.error('Reserve tickets error:', error);
            alert('Error: ' + (error.message || 'Failed to reserve tickets'));
        } finally {
            setIsReserving(false);
        }
    };

    const scrollStore = (direction) => {
        if (storeScrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            storeScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Store mock data mapped for StoreCard format
    const storeItems = [
        {
            id: "store-1",
            name: "Confetti paper 250g",
            price: 250,
            sellers: 3,
            imageUrl: "https://img.freepik.com/premium-photo/colorful-background-with-confetti-place-party_577115-136303.jpg"
        },
        {
            id: "store-2",
            name: "Magician hat",
            price: 1599,
            sellers: 3,
            imageUrl: "https://thumbs.dreamstime.com/b/magician-top-hat-magic-wand-shiny-grey-background-332855369.jpg"
        },
        {
            id: "store-3",
            name: "Casual Dress set",
            price: 4399,
            sellers: 3,
            imageUrl: "https://crocodile.in/cdn/shop/files/2_67bc818f-423e-4730-b639-e97cbc7b1533.jpg?v=1756896672&width=1672"
        },
        {
            id: "store-4",
            name: "Painting kit",
            price: 1000,
            sellers: 3,
            imageUrl: "https://p9artboutique.co.uk/cdn/shop/files/oil_paint_set_amazon_new_version_2000x2000_6a185091-8142-46ac-b4e4-1ee6e6b6d976.png?v=1756616128&width=1946"
        }
    ];

    if (loading) return <LoadingScreen message="Retrieving Event Intel" />;
    if (error || !event) return <ErrorState error={error} onRetry={fetchEventDetails} title="Transmission Failed" buttonText="Recalibrate" />;

    const images = event.allImages || [event.imageUrl];

    // Improved Date Formatting
    const getFormattedDate = () => {
        if (!event.startDate) return 'TBA';
        try {
            const start = new Date(event.startDate);
            const options = { day: 'numeric', month: 'short', year: 'numeric' };

            if (event.endDate && event.endDate !== event.startDate) {
                const end = new Date(event.endDate);

                // If same month and year
                if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
                }
                // If same year
                if (start.getFullYear() === end.getFullYear()) {
                    return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                }

                return `${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`;
            }
            return start.toLocaleDateString('en-IN', options);
        } catch (e) {
            console.error('Error formatting date:', e);
            return event.startDate;
        }
    };

    const formattedDate = getFormattedDate();
    const currentTickets = getCurrentTickets();
    const totalAmount = getTotalAmount();
    const totalTickets = getTotalTickets();

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0f1115] pb-32 transition-colors duration-300 bg-fixed">
            <SEO
                title={`${event.name} - XYNEMA Events`}
                description={event.description}
            />

            {/* Sharpness Filter Definition */}
            <svg style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <filter id="sharpen-filter">
                    <feConvolveMatrix
                        order="3"
                        kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"
                        preserveAlpha="true"
                    />
                </filter>
            </svg>

            {/* Sticky Minimal Nav (Visible only when scrolling past hero) */}
            <div data-scrolled={isScrolled} className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 -translate-y-full data-[scrolled=true]:translate-y-0 bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm" id="mini-nav">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary" />
                    </button>
                    <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px] md:max-w-md">
                        {event.name}
                    </h1>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* --- HERO SECTION WITH LIQUID GLASS --- */}
            <div className="relative w-full min-h-[500px] lg:min-h-[600px] bg-gray-50 flex items-center justify-center overflow-hidden">
                {/* Back Button (Absolute in Hero) */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="absolute top-6 right-6 z-50">
                    <button className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md">
                        <Share2 className="w-4 h-4 ml-[-2px]" />
                    </button>
                </div>

                {/* Blurred Background Image - Blur only on mobile */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[4px] md:blur-none scale-[1]"
                    style={{
                        backgroundImage: `url(${optimizeImage(images[activeImageIndex] || event.imageUrl, { width: isMobile ? 800 : 1920, quality: 95 })})`,
                        filter: isMobile ? 'blur(4px)' : 'url(#sharpen-filter)',
                        imageRendering: '-webkit-optimize-contrast'
                    }}
                />

                {/* Gradient Overlays - Lightened for better visibility */}


                {/* Content Container */}
                <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 pt-28 pb-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">

                    {/* Left: Event Poster */}
                    <div className="w-full sm:w-[85%] md:w-[320px] lg:w-[30%] shrink-0 mx-auto md:mx-0">
                        <div className="aspect-[3/4] md:aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative group bg-gray-200/10 backdrop-blur-md">
                            <img
                                src={event.portraitEventImage || images[activeImageIndex] || event.imageUrl}
                                alt={event.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-1"
                            />
                            {/* Inner glass reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
                        </div>
                    </div>

                    {/* Right: Glass Card Details */}
                    <div className="w-full md:flex-1 max-w-2xl mx-auto md:mx-0">
                        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 hover:border-white/30 rounded-[32px] md:rounded-[40px] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.25)] relative overflow-hidden transition-all duration-300">
                            {/* Glass reflection gradient */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/10 to-transparent rounded-t-[32px] pointer-events-none" />
                            {/* Colorful ambient glow inside card based on image (simulated with standard modern colors) */}
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                {/* Top Labels */}
                                <div className="flex flex-wrap items-center gap-3">
                                    {event.eventCategory && (
                                        <span className="px-3 py-1 bg-primary/80 backdrop-blur-md text-white border border-primary/50 text-xs font-bold rounded-full shadow-sm">
                                            {event.eventCategory}
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                                        {event.eventType === 'multi-day' ? 'Multi-Day Event' : 'Single-Day Event'}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                                    {event.name}
                                </h1>

                                {/* Meta Info (Date, Time, Location) */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-4 text-gray-200">
                                        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0 border border-white/10">
                                            <Calendar className="w-5 h-5 text-white/90" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{formattedDate}</p>
                                            <p className="text-sm text-white/70">{event.startTime}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-gray-200">
                                        <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0 border border-white/10">
                                            <MapPin className="w-5 h-5 text-white/90" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{event.venue}</p>
                                            <p className="text-sm text-white/70 truncate max-w-[280px] sm:max-w-md">{event.city}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Action */}
                                <div className="pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-t border-white/10">
                                    <div>
                                        <p className="text-xs text-white/70 font-medium uppercase tracking-widest mb-1.5">Starting from</p>
                                        <p className="text-3xl font-bold text-white drop-shadow-md">
                                            ₹{event.price ? event.price.toLocaleString() : 'Free'}
                                        </p>
                                    </div>

                                    <button
                                        ref={heroButtonRef}
                                        onClick={() => {
                                            document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        className="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-[#E33D52] text-white text-[15px] font-bold rounded-xl transition-all shadow-[0_8px_20px_rgba(66,124,174,0.3)] hover:shadow-[0_12px_24px_rgba(66,124,174,0.5)] hover:-translate-y-1 active:translate-y-0 active:scale-95"
                                    >
                                        Book Tickets
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Info Bar - Liquid Glass Effect (Blur only on mobile) */}
            <div className="relative z-20 bg-white/2 dark:bg-[#1a1c23]/30 backdrop-blur-md md:backdrop-blur-md border border-white/30 dark:border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] -mt-12 mx-4 sm:mx-8 md:mx-auto max-w-6xl rounded-[32px] overflow-hidden transition-all duration-500 hover:bg-white/20 dark:hover:bg-[#1a1c23]/40 hover:border-white/40 group">
                {/* Glass reflection highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-white/20 dark:divide-white/5">
                    <div className="px-5 py-5 sm:px-6 sm:py-8 flex items-center gap-4 transition-transform hover:scale-[1.02] duration-300">
                        <div className="p-2.5 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400/80 uppercase tracking-widest mb-0.5">Duration</p>
                            <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight tracking-tight">{event.duration ? `${event.duration} hrs` : 'TBA'}</p>
                        </div>
                    </div>
                    <div className="px-5 py-5 sm:px-6 sm:py-8 flex items-center gap-4 transition-transform hover:scale-[1.02] duration-300 border-t sm:border-t-0 sm:border-l border-white/20 dark:border-white/5">
                        <div className="p-2.5 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
                            <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400/80 uppercase tracking-widest mb-0.5">Language</p>
                            <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight tracking-tight">{event.languages?.join(', ') || 'English'}</p>
                        </div>
                    </div>
                    <div className="px-5 py-5 sm:px-6 sm:py-8 flex items-center gap-4 transition-transform hover:scale-[1.02] duration-300 border-t lg:border-t-0 lg:border-l border-white/20 dark:border-white/5">
                        <div className="p-2.5 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400/80 uppercase tracking-widest mb-0.5">Age Limit</p>
                            <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight tracking-tight">{event.ageGroup || 'All Ages'}</p>
                        </div>
                    </div>
                    <div className="px-5 py-5 sm:px-6 sm:py-8 flex items-center gap-4 transition-transform hover:scale-[1.02] duration-300 border-t sm:border-t-0 sm:border-l lg:border-l border-white/20 dark:border-white/5">
                        <div className="p-2.5 bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 backdrop-blur-md shrink-0">
                            <Ticket className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-500 dark:text-gray-400/80 uppercase tracking-widest mb-0.5">Entry Type</p>
                            <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight tracking-tight">E-Ticket Only</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Left Column Area: Details */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* Description Section */}
                        <section className="space-y-6 bg-white dark:bg-[#1a1c23] p-6 sm:p-10 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">About This Event</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-[15px] sm:text-[17px] leading-relaxed whitespace-pre-line font-medium">
                                {event.description}
                            </p>

                            <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2.5">
                                {event.tags?.map(tag => (
                                    <span key={tag} className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:border-primary/30 transition-all cursor-default">
                                        #{tag.replace(/\s+/g, '')}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Location Details */}
                        <section className="space-y-6 bg-white dark:bg-[#1a1c23] p-6 sm:p-10 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Location</h3>
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl shrink-0 flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900 dark:text-gray-100 font-black text-xl mb-1.5 tracking-tight">
                                        {event.venue}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 text-[15px] font-medium leading-relaxed mb-5 max-w-lg">
                                        {event.address}, {event.city}, {event.state}
                                    </p>
                                    <button
                                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.address}, ${event.city}`)}`, '_blank')}
                                        className="h-12 px-6 bg-primary/5 dark:bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white text-primary font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                    >
                                        Get Directions
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Event Gallery */}
                        {images && images.length > 0 && (
                            <section className="space-y-6 bg-white dark:bg-[#1a1c23] p-6 sm:p-10 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Event Gallery</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
                                    {images.slice(0, 3).map((img, idx) => {
                                        const isLast = idx === 2;
                                        const remainingCount = Math.max(0, images.length - 3);
                                        const showOverlay = isLast && remainingCount > 0;

                                        return (
                                            <div
                                                key={idx}
                                                className="relative overflow-hidden rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                                                onClick={() => {
                                                    setGalleryInitialIndex(idx);
                                                    setIsGalleryOpen(true);
                                                }}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${event.name} gallery ${idx + 1}`}
                                                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                                {showOverlay && (
                                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:bg-black/60">
                                                        <span className="text-white text-2xl font-bold">
                                                            +{remainingCount} View All
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Similar Events */}
                        {similarEvents && similarEvents.length > 0 && (
                            <section className="bg-transparent mt-12 mb-16 relative group/similar">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Similar events</h3>
                                    <button className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="relative">
                                    <Swiper
                                        modules={[Navigation]}
                                        slidesPerView={1}
                                        spaceBetween={16}
                                        navigation={{
                                            nextEl: '.similar-events-next',
                                            prevEl: '.similar-events-prev',
                                        }}
                                        breakpoints={{
                                            640: { slidesPerView: 2, spaceBetween: 24 },
                                            768: { slidesPerView: 2, spaceBetween: 24 },
                                            1024: { slidesPerView: 3, spaceBetween: 24 },
                                        }}
                                        className="!pb-6 !px-1"
                                    >
                                        {similarEvents.map((item) => (
                                            <SwiperSlide key={`similar-${item.id}`} className="!h-auto">
                                                <SimilarEventCard event={item} />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>

                                    {/* Custom Navigation Arrows */}
                                    <button className="similar-events-prev absolute -left-4 top-[45%] -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/similar:opacity-100 disabled:opacity-0 hover:scale-105 active:scale-95">
                                        <ChevronRight className="w-6 h-6 rotate-180" />
                                    </button>
                                    <button className="similar-events-next absolute -right-4 top-[45%] -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/similar:opacity-100 disabled:opacity-0 hover:scale-105 active:scale-95">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Explore the Store */}
                        <section className="bg-white dark:bg-[#1a1c23] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300 relative group/store">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Explore the store</h3>
                                <Link to="/store" className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    Visit Store
                                </Link>
                            </div>

                            <div className="relative">
                                <Swiper
                                    modules={[Navigation]}
                                    slidesPerView={2}
                                    spaceBetween={16}
                                    navigation={{
                                        nextEl: '.event-store-next',
                                        prevEl: '.event-store-prev',
                                    }}
                                    breakpoints={{
                                        640: { slidesPerView: 2, spaceBetween: 24 },
                                        768: { slidesPerView: 2, spaceBetween: 24 },
                                        1024: { slidesPerView: 3, spaceBetween: 24 },
                                    }}
                                    className="!pb-6 !px-1"
                                >
                                    {storeItems.map((item) => (
                                        <SwiperSlide key={item.id} className="!h-auto">
                                            <StoreCard item={item} />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>

                                {/* Custom Navigation Arrows */}
                                <button className="event-store-prev absolute -left-4 top-[40%] -translate-y-1/2 -translate-x-12 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0 xl:-translate-x-full">
                                    <ChevronRight className="w-6 h-6 rotate-180" />
                                </button>
                                <button className="event-store-next absolute -right-4 top-[40%] -translate-y-1/2 translate-x-12 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0 xl:translate-x-full">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column Area: Booking */}
                    <div className="lg:col-span-4 space-y-8" id="tickets-section">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white dark:bg-[#1a1c23] rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden group/tickets transition-colors duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 mb-6 md:mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 dark:bg-primary/40 flex items-center justify-center border border-primary/20">
                                        <Ticket className="w-5 h-5 md:w-6 md:h-6 text-primary dark:text-primary" />
                                    </div>
                                    Select Tickets
                                </h3>

                                <div className="space-y-4">
                                    {currentTickets.map((ticket) => {
                                        const quantity = ticketQuantities[ticket.id] || 0;
                                        const isSelected = quantity > 0;
                                        const isSoldOut = ticket.availableSeats === 0;

                                        return (
                                            <div
                                                key={ticket.id}
                                                className={`p-5 rounded-2xl border transition-all duration-300 ${isSelected
                                                    ? 'border-primary dark:border-primary bg-primary/[0.03] dark:bg-primary/[0.05] shadow-[0_10px_20px_rgba(66,124,174,0.08)]'
                                                    : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 tracking-tight text-sm md:text-base">{ticket.className}</p>
                                                        <p className="text-xl md:text-2xl font-black text-primary dark:text-primary tracking-tighter">
                                                            ₹{ticket.price.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {isSoldOut ? (
                                                        <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100 dark:border-red-900/30">
                                                            Sold Out
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-3 md:gap-4 bg-white dark:bg-gray-900/80 p-1 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                                            <button
                                                                onClick={() => updateTicketQuantity(ticket.id, -1)}
                                                                disabled={quantity === 0}
                                                                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-lg disabled:opacity-20 transition-all active:scale-90 border border-transparent hover:border-primary/10"
                                                            >
                                                                <span className="text-xl font-bold">−</span>
                                                            </button>
                                                            <span className="text-sm md:text-base font-black text-gray-900 dark:text-gray-100 min-w-[20px] text-center tabular-nums">
                                                                {quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateTicketQuantity(ticket.id, 1)}
                                                                disabled={quantity >= 10}
                                                                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-lg disabled:opacity-20 transition-all active:scale-90 border border-transparent hover:border-primary/10"
                                                            >
                                                                <span className="text-xl font-bold">+</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {totalTickets === 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 text-center">
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Select to proceed</p>
                                    </div>
                                )}
                            </div>

                            {/* Organizer Section */}
                            <div className="bg-white dark:bg-[#1a1c23] rounded-[24px] p-5 md:p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group/organizer hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-black text-primary shadow-sm group-hover/organizer:scale-110 transition-transform duration-500">
                                            {event.organizerName ? event.organizerName.charAt(0) : 'O'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Organized By</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight line-clamp-1">
                                            {event.organizerName}
                                        </p>
                                    </div>
                                </div>
                                <button className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div >
            </main >

            {/* Unified Sticky Bottom Bar - Responsive Visibility */}
            {event && (isScrolled || !heroButtonVisible || totalTickets > 0) && (
                <div className={`fixed bottom-0 left-0 right-0 z-[70] animate-in slide-in-from-bottom-full duration-500 pb-safe ${totalTickets > 0 ? 'block' : 'lg:hidden'}`}>
                    <div className="bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800 shadow-[0_-15px_50px_rgba(0,0,0,0.12)] transition-all duration-300">
                        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
                            {totalTickets > 0 ? (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{totalTickets} {totalTickets > 1 ? 'Tickets' : 'Ticket'}</span>
                                        <span className="text-2xl sm:text-3xl font-black text-primary tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                                    </div>

                                    <button
                                        onClick={() => handleReserveTickets()}
                                        disabled={isReserving}
                                        className="flex-1 sm:flex-none sm:min-w-[200px] h-14 sm:h-16 rounded-2xl bg-primary text-white font-black text-sm sm:text-base uppercase tracking-widest transition-all hover:bg-[#E33D52] hover:shadow-[0_12px_24px_rgba(224,36,65,0.3)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isReserving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span>PROCESSING</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>CHECKOUT</span>
                                                <ChevronRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className="w-full h-14 sm:h-16 rounded-2xl bg-primary text-white font-black text-sm sm:text-base uppercase tracking-widest transition-all hover:bg-[#E33D52] hover:shadow-[0_12px_24px_rgba(224,36,65,0.3)] active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span>BOOK TICKETS</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Full Screen Image Gallery Modal */}
            {isGalleryOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-center animate-in fade-in duration-300">
                    {/* Close Button */}
                    <button
                        onClick={() => setIsGalleryOpen(false)}
                        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/20 shadow-xl"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    {/* Main Viewing Area */}
                    <div className="w-full max-w-7xl mx-auto px-4 flex-1 flex flex-col h-full relative group">

                        {/* Featured Large Image View */}
                        <div className="flex-1 flex items-center justify-center p-4 lg:p-12 relative h-[70vh]">
                            <img
                                src={images[galleryInitialIndex]}
                                alt={`${event.name} Gallery Featured - View ${galleryInitialIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-opacity animate-in fade-in duration-300 zoom-in-95"
                                key={galleryInitialIndex} // Forces re-render for animation on change
                            />

                            {/* Navigation Overlays (Desktop) */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setGalleryInitialIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/20 text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 border border-white/10 hover:scale-110"
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setGalleryInitialIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/20 text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 border border-white/10 hover:scale-110"
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails Strip */}
                        {images.length > 1 && (
                            <div className="h-[20vh] min-h-[120px] max-h-[180px] w-full px-4 pb-8 overflow-x-auto overflow-y-hidden flex items-center gap-4 snap-x snap-mandatory hide-scrollbar">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setGalleryInitialIndex(idx)}
                                        className={`relative shrink-0 h-20 md:h-28 aspect-video rounded-lg overflow-hidden snap-center transition-all duration-300 border-2 ${galleryInitialIndex === idx
                                            ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10'
                                            : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default EventDetailsPage;
