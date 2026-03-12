import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import StoreCard from '../components/StoreCard';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Share2, Globe, Phone, Mail, Instagram, Twitter, Facebook, ExternalLink, Info, Star, ChevronLeft, ChevronRight, PartyPopper, ShoppingBag } from 'lucide-react';
import SEO from '../components/SEO';
import { getEventDetails, reserveEventTickets, getAllEventsList } from '../services/eventService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import SimilarEventCard from '../components/SimilarEventCard';

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
    const storeScrollRef = useRef(null);

    // Multi-day selection state
    const [selectedShowTimeIndex, setSelectedShowTimeIndex] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const [foundEvent, allEvents] = await Promise.all([
                getEventDetails(slug),
                getAllEventsList().catch(() => [])
            ]);

            if (foundEvent) {
                setEvent(foundEvent);
                setSimilarEvents(allEvents || []);
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
        const currentUser = injectedUser || user;

        if (!currentUser) {
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
            name: "Cold white Tshirt",
            price: 849,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: "store-2",
            name: "Charlie movie shirt",
            price: 849,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: "store-3",
            name: "Spiderverse T Shirt",
            price: 849,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600"
        },
        {
            id: "store-4",
            name: "Premium Black Tee",
            price: 849,
            sellers: 3,
            imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600"
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
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0f1115] pb-32 transition-colors duration-300">
            <SEO
                title={`${event.name} - XYNEMA Events`}
                description={event.description}
            />

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

                {/* Blurred Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[0px] md:blur-[0px] opacity-0 md:opacity-100 scale-[1.0]"
                    style={{ backgroundImage: `url(${images[activeImageIndex] || event.imageUrl})` }}
                />

                {/* Gradient Overlays for contrast and smooth blending to content below */}
                <div className="absolute inset-x-0 bottom-0 h-48  via-gray-900/40 to-transparent z-[1]" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 md:from-black/40 to-black/10 z-[1]" />

                {/* Content Container */}
                <div className="relative z-10 w-full max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:py-20 flex flex-col md:flex-row items-center gap-8 md:gap-16">

                    {/* Left: Event Poster */}
                    <div className="w-[80%] sm:w-[60%] md:w-[320px] lg:w-[600px] shrink-0 mx-auto md:mx-0">
                        <div className="aspect-[16/9] md:aspect-[16/9] rounded-[24px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] ">
                            <img
                                src={images[activeImageIndex] || event.imageUrl}
                                alt={event.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Inner glass reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
                        </div>
                    </div>

                    {/* Right: Glass Card Details */}
                    <div className="w-full md:w-[60%] lg:w-[65%] max-w-2xl mx-auto md:mx-0">
                        <div className="bg-white/10 backdrop-blur-[20px] border border-white/20 hover:border-white/30 rounded-[32px] p-6 sm:p-8 md:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative overflow-hidden transition-all duration-300">
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
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.15] tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
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

            {/* Quick Info Bar */}
            <div className="relative z-20 bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl -mt-8 mx-4 sm:mx-8 max-w-5xl lg:mx-auto rounded-2xl overflow-hidden transition-all duration-300">
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
                    <div className="flex-1 px-6 py-4 text-center sm:text-left flex items-center gap-4 sm:justify-center">
                        <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500 hidden sm:block" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Duration</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{event.duration ? `${event.duration} hrs` : 'TBA'}</p>
                        </div>
                    </div>
                    <div className="flex-1 px-6 py-4 text-center sm:text-left flex items-center gap-4 sm:justify-center">
                        <Globe className="w-6 h-6 text-gray-400 dark:text-gray-500 hidden sm:block" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Language</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{event.languages?.join(', ') || 'English'}</p>
                        </div>
                    </div>
                    <div className="flex-1 px-6 py-4 text-center sm:text-left flex items-center gap-4 sm:justify-center">
                        <Info className="w-6 h-6 text-gray-400 dark:text-gray-500 hidden sm:block" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Age Restriction</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{event.ageGroup || 'All Ages'}</p>
                        </div>
                    </div>
                    <div className="flex-1 px-6 py-4 text-center sm:text-left flex items-center gap-4 sm:justify-center">
                        <Ticket className="w-6 h-6 text-gray-400 dark:text-gray-500 hidden sm:block" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Entry Type</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">E-Ticket</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Left Column Area: Details */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* Description Section */}
                        <section className="space-y-6 bg-white dark:bg-[#1a1c23] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">About This Event</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-[15px] sm:text-base leading-relaxed whitespace-pre-line">
                                {event.description}
                            </p>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                                {event.tags?.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-default">
                                        #{tag.replace(/\s+/g, '')}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Location Details */}
                        <section className="space-y-6 bg-white dark:bg-[#1a1c23] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Location</h3>
                            <div className="flex gap-6 items-start">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shrink-0">
                                    <MapPin className="w-6 h-6 text-primary dark:text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-1">
                                        {event.venue}
                                    </p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                        {event.address}, {event.city}, {event.state}
                                    </p>
                                    <button
                                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.address}, ${event.city}`)}`, '_blank')}
                                        className="text-primary dark:text-primary font-semibold text-sm hover:underline"
                                    >
                                        Open in Google Maps
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Event Gallery */}
                        {images && images.length > 0 && (
                            <section className="space-y-6 bg-white dark:bg-[#1a1c23] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Event Gallery</h3>
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
                                        spaceBetween={24}
                                        slidesPerView={1}
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
                                    spaceBetween={24}
                                    slidesPerView={1}
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

                                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/40 flex items-center justify-center border border-primary/10 dark:border-primary/20">
                                        <Ticket className="w-5 h-5 text-primary dark:text-primary" />
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
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 tracking-tight">{ticket.className}</p>
                                                        <p className="text-2xl font-black text-primary dark:text-primary tracking-tighter">
                                                            ₹{ticket.price.toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {isSoldOut ? (
                                                        <span className="px-3.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                                                            Sold Out
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-3.5 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                                            <button
                                                                onClick={() => updateTicketQuantity(ticket.id, -1)}
                                                                disabled={quantity === 0}
                                                                className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-20 transition-all active:scale-90"
                                                            >
                                                                <span className="text-2xl font-light leading-none">−</span>
                                                            </button>
                                                            <span className="text-base font-black text-gray-900 dark:text-gray-100 w-6 text-center tabular-nums">
                                                                {quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateTicketQuantity(ticket.id, 1)}
                                                                disabled={quantity >= 10}
                                                                className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-20 transition-all active:scale-90"
                                                            >
                                                                <span className="text-2xl font-light leading-none">+</span>
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

                            {/* Premium Organizer Section */}
                            <div className="bg-white dark:bg-[#1a1c23] rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group/organizer hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-lg font-black text-white shadow-lg group-hover/organizer:rotate-12 transition-transform duration-500">
                                            {event.organizerName ? event.organizerName.charAt(0) : 'O'}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Organized By</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                            {event.organizerName}
                                        </p>
                                    </div>
                                </div>
                                <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-primary/5 dark:hover:bg-primary/40 hover:text-primary dark:hover:text-primary transition-all">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div >
            </main >

            {/* Unified Sticky Bottom Bar - Professional & Minimal */}
            {event && totalTickets > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full duration-500">
                    <div className="bg-white/80 dark:bg-[#1a1c23]/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-all duration-300">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{totalTickets} Ticket{totalTickets > 1 ? 's' : ''} Selected</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">₹{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleReserveTickets}
                                disabled={isReserving}
                                className="px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-primary text-white font-bold text-sm sm:text-[15px] transition-all hover:bg-[#E33D52] active:scale-95 shadow-lg shadow-primary/30 disabled:opacity-50"
                            >
                                {isReserving ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>PROCESSING</span>
                                    </div>
                                ) : (
                                    'CHECKOUT'
                                )}
                            </button>
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
