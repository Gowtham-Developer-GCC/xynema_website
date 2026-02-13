import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Share2, Globe, Phone, Mail, Instagram, Twitter, Facebook, ExternalLink, Info, Star, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import SEO from '../components/SEO';
import * as api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const EventDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [event, setEvent] = useState(location.state?.event || null);
    const [loading, setLoading] = useState(!event);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [ticketQuantities, setTicketQuantities] = useState({});
    const [isReserving, setIsReserving] = useState(false);

    // Multi-day selection state
    const [selectedShowTimeIndex, setSelectedShowTimeIndex] = useState(0);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const events = await api.getEvents();
            const foundEvent = events.find(e => String(e.slug) === String(slug) || String(e.id) === String(slug));
            if (foundEvent) {
                setEvent(foundEvent);
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
        if (!event) {
            fetchEventDetails();
        }
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

    const handleReserveTickets = async () => {
        const totalTickets = getTotalTickets();
        if (totalTickets === 0) {
            alert('Please select at least one ticket');
            return;
        }

        setIsReserving(true);
        try {
            const tickets = getCurrentTickets();
            const selectedTickets = Object.entries(ticketQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([ticketId, quantity]) => ({
                    ticketClassId: ticketId,
                    quantity
                }));

            let showDate = null;
            let showTime = null;

            if (event.eventType === 'multi-day' && event.showTimes?.length > 0) {
                const showTimeData = event.showTimes[selectedShowTimeIndex];
                showTime = showTimeData.startTime;
                try {
                    const dt = new Date(showTimeData.date);
                    showDate = dt.toISOString();
                } catch (e) {
                    showDate = showTimeData.date;
                }
            } else {
                showTime = event.startTime;
                try {
                    const dt = new Date(event.startDate);
                    showDate = dt.toISOString();
                } catch (e) {
                    showDate = event.startDate;
                }
            }

            console.log('[Reserve] Sending:', { showDate, showTime, tickets: selectedTickets });

            const result = await api.reserveEventTickets(event.id, selectedTickets, showDate, showTime);

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

    if (loading) return <LoadingSpinner message="Retrieving Event Intel" />;
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
        <div className="min-h-screen bg-white">
            <SEO
                title={`${event.name} - XYNEMA Events`}
                description={event.description}
            />

            {/* Sticky Header - Ultra Minimal */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 p-2 rounded-full hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-xynemaRose" />
                    </button>
                    <h1 className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-900 truncate max-w-[200px] md:max-w-md px-4">
                        {event.name}
                    </h1>
                    <div className="flex gap-2">
                        <button className="p-3 rounded-full hover:bg-xynemaRose/10 text-gray-400 hover:text-xynemaRose transition-all">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-12">
                {/* Clean Hero Header */}
                <div className="mb-12 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xynemaRose text-[12px] font-black uppercase bg-xynemaRose/10 tracking-[0.1em] px-2 py-1 rounded">
                            {event.ageGroup || 'All Ages'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="text-gray-400 text-[12px] font-black uppercase tracking-[0.1em]">
                            {event.languages?.join(' • ')}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-3xl lg:text-3xl font-black text-gray-900 leading-[1.1] tracking-tighter uppercase">
                        {event.name}
                    </h1>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{event.startTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{event.venue}</span>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-1 gap-16">

                    {/* Left Column Area: Details */}
                    <div className="space-y-12">
                        {/* Image Gallery - Cinematic & Professional */}
                        <div className="relative group rounded-[32px] overflow-hidden bg-gray-50 aspect-[21/9] shadow-2xl shadow-black/5">
                            <img
                                src={images[activeImageIndex]}
                                alt={event.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />

                            {/* Gradient Overlay for indicators */}
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Navigation Arrows - Refined */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                                        className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 hover:bg-white/30"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all opacity-0 translate-x-[10px] group-hover:opacity-100 group-hover:translate-x-0 hover:bg-white/30"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Subtle Dot Indicators */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                        {images.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImageIndex(idx)}
                                                className={`h-1 rounded-full transition-all duration-300 ${activeImageIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Description Section */}
                        <section className="col-span-1 grid grid-cols-1 md:grid-cols-12 gap-12">
                            <div className="md:col-span-8 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-xynemaRose uppercase">ABOUT</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line font-medium">
                                        {event.description}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-xynemaRose uppercase">ADDRESS</h3>
                                    <div className="flex gap-6 items-start">
                                        <div className="flex-1">
                                            <p className="text-gray-900 leading-relaxed font-bold text-lg">
                                                {event.venue}
                                            </p>
                                            <p className="text-gray-500 text-sm font-medium mt-1">
                                                {event.address}, {event.city}, {event.state}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.address}, ${event.city}`)}`, '_blank')}
                                            className="p-4 rounded-2xl bg-gray-50 text-xynemaRose hover:bg-xynemaRose/10 transition-all"
                                        >
                                            <Globe className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {event.tags.map(tag => (
                                        <span key={tag} className="text-gray-300 text-[11px] font-black uppercase tracking-[0.2em] hover:text-xynemaRose transition-colors cursor-default">
                                            #{tag.replace(/\s+/g, '')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Booking Overlay - integrated into scroll */}
                            <div className="md:col-span-4">
                                <div className="sticky top-24 space-y-8">
                                    <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100">
                                        <h3 className="text-xs font-black text-xynemaRose uppercase mb-4">TICKET</h3>
                                        <div className="space-y-6">
                                            {currentTickets.map((ticket) => {
                                                const quantity = ticketQuantities[ticket.id] || 0;
                                                const isSelected = quantity > 0;
                                                const isSoldOut = ticket.availableSeats === 0;

                                                return (
                                                    <div key={ticket.id} className="space-y-3">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ticket.className}</p>
                                                                <p className="text-xl font-black text-gray-900">₹{ticket.price}</p>
                                                            </div>

                                                            {!isSoldOut && (
                                                                <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-full border border-gray-100">
                                                                    <button
                                                                        onClick={() => updateTicketQuantity(ticket.id, -1)}
                                                                        disabled={quantity === 0}
                                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-xynemaRose disabled:opacity-20 transition-all font-bold"
                                                                    >
                                                                        <span className="text-lg">−</span>
                                                                    </button>
                                                                    <span className="text-sm font-black text-gray-900 w-4 text-center">
                                                                        {quantity}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => updateTicketQuantity(ticket.id, 1)}
                                                                        disabled={quantity >= 10}
                                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-xynemaRose disabled:opacity-20 transition-all font-bold"
                                                                    >
                                                                        <span className="text-lg">+</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>

                                    {/* Minimal Organizer */}
                                    <div className="px-8 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Presenter</p>
                                            <p className="text-xs font-black text-gray-900 uppercase">
                                                {event.organizerName}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            {event.organizerEmail && (
                                                <a href={`mailto:${event.organizerEmail}`} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                                    <Mail className="w-4 h-4" />
                                                </a>
                                            )}
                                            {event.organizerContact && (
                                                <a href={`tel:${event.organizerContact}`} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Unified Sticky Bottom Bar - Professional & Minimal */}
            {event && (
                <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full duration-500">
                    <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">Total for {totalTickets} ticket{totalTickets > 1 ? 's' : ''}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{totalAmount.toFixed(2)}</span>
                                    {/* <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Inclusive of taxes</span> */}
                                </div>
                            </div>

                            <button
                                onClick={handleReserveTickets}
                                disabled={isReserving}
                                className="px-12 py-4 rounded-2xl bg-xynemaRose/80 text-white font-black text-[10px] uppercase tracking-[0.4em] transition-all hover:bg-xynemaRose active:scale-95 shadow-2xl shadow-black/20 disabled:opacity-50"
                            >
                                {isReserving ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        RESERVING
                                    </div>
                                ) : (
                                    'CONTINUE'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetailsPage;
