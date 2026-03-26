import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, QrCode, Loader, MapPin, Clock } from 'lucide-react';
import { getUserBookings } from '../services/bookingService';
import { getEventBookings } from '../services/eventService';
import { getMyTurfBookings } from '../services/turfService';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import apiCacheManager from '../services/apiCacheManager';

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [moviePage, setMoviePage] = useState(1);
    const [eventPage, setEventPage] = useState(1);
    const [bookings, setBookings] = useState(() => {
        const cached = apiCacheManager.get(`bookings_movies_1`);
        return cached?.bookings ? cached.bookings : [];
    });
    const [eventBookings, setEventBookings] = useState(() => {
        const cached = apiCacheManager.get(`bookings_events_1`);
        return cached?.bookings ? cached.bookings : [];
    });
    const [turfBookings, setTurfBookings] = useState(() => {
        const cached = apiCacheManager.get(`bookings_turfs`);
        if (!cached) return [];
        return Array.isArray(cached) ? cached : (cached.bookings || []);
    });
    const [loading, setLoading] = useState(!bookings?.length);
    const [eventLoading, setEventLoading] = useState(!eventBookings?.length);
    const [turfLoading, setTurfLoading] = useState(!turfBookings?.length);
    const [pageLoading, setPageLoading] = useState(false);
    const [bookingType, setBookingType] = useState(location.state?.activeTab || 'movies');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const [movieTotalPages, setMovieTotalPages] = useState(1);
    const [eventTotalPages, setEventTotalPages] = useState(1);
    const filterRef = useRef(null);
    const hasFetched = useRef(false);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchMovieBookings = async (targetPage = 1, force = false) => {
        try {
            // Only show loader if we don't have data for this page yet
            const isFreshPage = targetPage !== moviePage || bookings.length === 0;
            
            if (isFreshPage || force) {
                if (bookings.length > 0) setPageLoading(true);
                else setLoading(true);
            }

            const response = await apiCacheManager.getOrFetchMovieBookings(
                targetPage,
                () => getUserBookings(targetPage),
                force
            );

            const { bookings: newBookings, totalPages: total, currentPage } = response.bookings ? response : { bookings: response.data || [], ...response };
            setBookings(newBookings || []);
            setMovieTotalPages(total);
            setMoviePage(currentPage);
        } catch (err) {
            console.error('Failed to fetch movie bookings:', err);
        } finally {
            setLoading(false);
            setPageLoading(false);
        }
    };

    const fetchEventBookings = async (targetPage = 1, force = false) => {
        try {
            const isFreshPage = targetPage !== eventPage || eventBookings.length === 0;

            if (isFreshPage || force) {
                if (eventBookings.length > 0) setPageLoading(true);
                else setEventLoading(true);
            }

            const response = await apiCacheManager.getOrFetchEventBookings(
                targetPage,
                () => getEventBookings(targetPage),
                force
            );

            const { bookings: newBookings, totalPages: total, currentPage } = response.bookings ? response : { bookings: response.data || [], ...response };
            setEventBookings(newBookings || []);
            setEventTotalPages(total);
            setEventPage(currentPage);
        } catch (err) {
            console.error('Failed to fetch event bookings:', err);
        } finally {
            setEventLoading(false);
            setPageLoading(false);
        }
    };

    const fetchTurfBookings = async (force = false) => {
        try {
            if (turfBookings.length > 0) setPageLoading(true);
            else setTurfLoading(true);

            const response = await apiCacheManager.getOrFetchTurfBookings(
                () => getMyTurfBookings(),
                force
            );
            const bookingsArray = Array.isArray(response) ? response : (response?.data?.bookings || response?.data || response?.bookings || []);
            setTurfBookings(bookingsArray);
        } catch (err) {
            console.error('Failed to fetch turf bookings:', err);
        } finally {
            setTurfLoading(false);
            setPageLoading(false);
        }
    };

    useEffect(() => {
        if (location.state?.activeTab) {
            setBookingType(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        // Initial check: if cache is expired, refresh in background
        if (hasFetched.current) return;
        hasFetched.current = true;

        // Respect TTL (force=false) by default on navigation
        // This avoids hitting API every time if accessed within 3 minutes
        fetchMovieBookings(1, false);
        fetchEventBookings(1, false);
        fetchTurfBookings(false);
    }, []);

    const handlePageChange = (newPage) => {
        if (bookingType === 'movies') {
            if (newPage >= 1 && newPage <= movieTotalPages && newPage !== moviePage) {
                fetchMovieBookings(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else if (bookingType === 'events') {
            if (newPage >= 1 && newPage <= eventTotalPages && newPage !== eventPage) {
                fetchEventBookings(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    // ─── Date Parsing ───
    const parseDateTime = (dateStr, timeStr) => {
        if (!dateStr) return null;
        try {
            let date;
            if (typeof dateStr === 'string' && dateStr.includes('T')) {
                date = new Date(dateStr);
            } else if (typeof dateStr === 'string' && dateStr.includes('-')) {
                const parts = dateStr.split('-').map(Number);
                if (parts[0] > 1900) date = new Date(parts[0], parts[1] - 1, parts[2]);
                else date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else if (!isNaN(dateStr) && !isNaN(parseFloat(dateStr))) {
                const ts = parseFloat(dateStr);
                date = new Date(ts < 10000000000 ? ts * 1000 : ts);
            } else {
                date = new Date(dateStr);
            }
            if (isNaN(date.getTime())) return null;

            if (timeStr && typeof timeStr === 'string') {
                const cleanTime = timeStr.trim().toUpperCase();
                const timeMatch = cleanTime.match(/(\d+):(\d+)\s*(AM|PM)?/);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const period = timeMatch[3];
                    if (period === 'PM' && hours < 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    date.setHours(hours, minutes, 0, 0);
                }
            }
            return date;
        } catch (e) {
            return null;
        }
    };

    // ─── Filtering ───
    const filterByStatus = (booking, type) => {
        if (filterStatus === 'all') return true;
        const dateStr = type === 'movies' ? booking.date : (type === 'events' ? booking.showDate : (booking.snapshot?.date || booking.slots?.[0]?.date || booking.date));
        const timeStr = type === 'movies' ? booking.time : (type === 'events' ? booking.showTime : (booking.snapshot?.startTime || booking.slots?.[0]?.startTime));
        const showDate = parseDateTime(dateStr, timeStr);
        if (!showDate) return false;
        
        const now = new Date();
        const isPast = now.getTime() > showDate.getTime();
        
        if (filterStatus === 'upcoming') {
            return !isPast;
        }
        
        if (filterStatus === 'past') {
            // Include a grace period for past bookings if desired (e.g. 2 hours after show start)
            const gracePeriodMs = type === 'movies' ? 2 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
            return now.getTime() > (showDate.getTime() + gracePeriodMs);
        }
        
        return true;
    };

    const sortBookings = (a, b, type) => {
        const dateA = parseDateTime(
            type === 'movies' ? a.date : (type === 'events' ? a.showDate : (a.snapshot?.date || a.slots?.[0]?.date || a.date)), 
            type === 'movies' ? a.time : (type === 'events' ? a.showTime : (a.snapshot?.startTime || a.slots?.[0]?.startTime))
        );
        const dateB = parseDateTime(
            type === 'movies' ? b.date : (type === 'events' ? b.showDate : (b.snapshot?.date || b.slots?.[0]?.date || b.date)), 
            type === 'movies' ? b.time : (type === 'events' ? b.showTime : (b.snapshot?.startTime || b.slots?.[0]?.startTime))
        );
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
    };

    // ─── Filtered & Sorted Lists ───
    const filteredMovies = useMemo(() => {
        return bookings.filter(b => filterByStatus(b, 'movies')).sort((a, b) => sortBookings(a, b, 'movies'));
    }, [bookings, filterStatus]);

    const filteredEvents = useMemo(() => {
        return eventBookings.filter(b => filterByStatus(b, 'events')).sort((a, b) => sortBookings(a, b, 'events'));
    }, [eventBookings, filterStatus]);

    const filteredTurfs = useMemo(() => {
        if (!Array.isArray(turfBookings)) return [];
        return turfBookings.filter(b => filterByStatus(b, 'sports')).sort((a, b) => sortBookings(a, b, 'sports'));
    }, [turfBookings, filterStatus]);

    // ─── Group By Month ───
    const groupByMonth = (items, type) => {
        const groups = {};
        items.forEach(item => {
            const dateStr = type === 'movies' ? item.date : (type === 'events' ? item.showDate : (item.snapshot?.date || item.slots?.[0]?.date || item.date));
            if (!dateStr) return;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;
            const key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    };

    const movieGroups = useMemo(() => groupByMonth(filteredMovies, 'movies'), [filteredMovies]);
    const eventGroups = useMemo(() => groupByMonth(filteredEvents, 'events'), [filteredEvents]);
    const turfGroups = useMemo(() => groupByMonth(filteredTurfs, 'sports'), [filteredTurfs]);

    // ─── Initial Load ───
    if (loading && bookings.length === 0) return <LoadingScreen message="Loading Tickets" />;

    const tabs = [
        { key: 'movies', label: 'Movies' },
        { key: 'events', label: 'Events' },
        { key: 'sports', label: 'Sports' }
    ];

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'past', label: 'Past' },
    ];

    const activeGroups = bookingType === 'movies' ? movieGroups : (bookingType === 'events' ? eventGroups : turfGroups);
    const isContentLoading = bookingType === 'movies' ? pageLoading : (bookingType === 'events' ? eventLoading : turfLoading);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <SEO title="My Tickets - XYNEMA" description="View your purchase history" />

            {/* ━━━ Header ━━━ */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-1.5 -ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">
                        My tickets
                    </h1>
                </div>
            </div>

            {/* ━━━ Tabs + Filter Row ━━━ */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between">
                    {/* Tab Items */}
                    <div className="flex items-center gap-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setBookingType(tab.key)}
                                className={`relative pb-3 text-[14px] font-semibold transition-colors ${bookingType === tab.key
                                        ? 'text-primary'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                            >
                                {tab.label}
                                {bookingType === tab.key && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Filter Dropdown + Calendar */}
                    <div className="flex items-center gap-3 pb-3">
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className="flex items-center gap-1.5 px-5 py-[6px] bg-primary text-white rounded-full text-[13px] font-semibold hover:brightness-110 transition-all"
                            >
                                {filterOptions.find(o => o.value === filterStatus)?.label || 'All'}
                                <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {filterOpen && (
                                <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 min-w-[140px] py-1 overflow-hidden">
                                    {filterOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setFilterStatus(opt.value); setFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${filterStatus === opt.value
                                                    ? 'text-primary font-semibold bg-primary/5 dark:bg-primary/10'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* ━━━ Content Area ━━━ */}
            <div className={`max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-opacity duration-300 ${isContentLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {isContentLoading && (
                    <div className="flex items-center justify-center py-4">
                        <Loader className="w-5 h-5 text-primary animate-spin" />
                    </div>
                )}

                {Object.keys(activeGroups).length > 0 ? (
                    <div className="space-y-10">
                        {Object.entries(activeGroups).map(([month, items]) => (
                            <div key={month}>
                                {/* Month Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {month}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                                </div>

                                {/* Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {items.map((item, idx) =>
                                        bookingType === 'movies'
                                            ? <MovieTicketCard key={`movie-${item.id}-${idx}`} booking={item} />
                                            : bookingType === 'events'
                                                ? <EventTicketCard key={`event-${item.bookingId || item.id}-${idx}`} booking={item} />
                                                : <TurfTicketCard key={`turf-${item._id || item.id}-${idx}`} booking={item} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !isContentLoading ? (
                    <div className="py-24 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            No tickets found for this filter.
                        </p>
                    </div>
                ) : null}

                {/* ━━━ Explore Button ━━━ */}
                <div className="flex justify-center mt-14 mb-4">
                    <button
                        onClick={() => navigate(bookingType === 'movies' ? '/movies' : '/events')}
                        className="flex items-center justify-center gap-3 w-full max-w-xl px-8 py-4 bg-primary/90 dark:bg-primary/80 text-white text-[15px] font-semibold rounded-xl hover:bg-primary transition-colors shadow-sm"
                    >
                        {bookingType === 'movies' ? 'Explore movies' : bookingType === 'events' ? 'Explore events' : 'Discover sports'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* ━━━ Pagination ━━━ */}
                {bookingType === 'movies' ? (
                    movieTotalPages >= 1 && (
                        <Pagination page={moviePage} totalPages={movieTotalPages} onPageChange={handlePageChange} />
                    )
                ) : (
                    eventTotalPages >= 1 && (
                        <Pagination page={eventPage} totalPages={eventTotalPages} onPageChange={handlePageChange} />
                    )
                )}
            </div>
        </div>
    );
};


// ─────────────────────────────────────
// Movie Ticket Card (Figma-style)
// ─────────────────────────────────────
const MovieTicketCard = ({ booking }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    const seatStr = booking.seats?.length > 0
        ? booking.seats.map(s => typeof s === 'object' ? (s.seatLabel || `${s.row || ''}${s.seatNumber || s.number || ''}`) : s).join(', ')
        : '';

    return (
        <div
            onClick={() => navigate(`/bookings/${booking.id}`)}
            className="bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-md dark:hover:border-gray-700 transition-all cursor-pointer overflow-hidden group"
        >
            {/* Poster */}
            <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                    src={booking.landscapePosterUrl || booking.posterUrl || 'https://placehold.co/400x250/f0f0f5/999?text=Movie'}
                    alt={booking.movieTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {/* Info */}
            <div className="p-4 space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug line-clamp-1">
                    {booking.movieTitle}
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {formatDate(booking.date)}
                    {booking.time ? ` • ${booking.time}` : ''}
                    {seatStr ? ` • ${seatStr}` : ''}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 line-clamp-1">
                    {booking.theaterName}
                </p>
                <p className="text-primary font-bold text-[15px] pt-1">
                    ₹{booking.totalAmount?.toLocaleString() || '0'}
                </p>
            </div>
        </div>
    );
};


// ─────────────────────────────────────
// Event Ticket Card (Figma-style)
// ─────────────────────────────────────
const EventTicketCard = ({ booking }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    const ticketCount = booking.tickets?.reduce((acc, t) => acc + (t.quantity || 0), 0) || booking.quantity || 0;
    const ticketClass = booking.ticketClass || (booking.tickets?.[0]?.ticketClass) || 'Standard';

    return (
        <div
            onClick={() => navigate(`/event-bookings/${booking.bookingId}`)}
            className="bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-md dark:hover:border-gray-700 transition-all cursor-pointer overflow-hidden group"
        >
            {/* Poster */}
            <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                    src={booking.eventPoster || booking.posterUrl || booking.imageUrl || 'https://placehold.co/400x250/f0f0f5/999?text=Event'}
                    alt={booking.eventName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {/* Info */}
            <div className="p-4 space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug line-clamp-1">
                    {booking.eventName}
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {formatDate(booking.showDate)}
                    {booking.showTime ? ` • ${booking.showTime}` : ''}
                    {ticketCount > 0 ? ` • ${ticketClass} x ${ticketCount}` : ''}
                </p>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 line-clamp-1">
                    {booking.venue?.name}{booking.venue?.city ? `, ${booking.venue.city}` : ''}
                </p>
                {booking.entryType === 'qr' ? (
                    <div className="flex items-center gap-1.5 pt-1">
                        <QrCode className="w-3.5 h-3.5 text-primary" />
                        <span className="text-primary text-[12px] font-semibold">QR Entry</span>
                    </div>
                ) : (
                    <p className="text-primary font-bold text-[15px] pt-1">
                        {booking.currency === 'INR' || !booking.currency ? '₹' : booking.currency}
                        {booking.totalAmount?.toLocaleString() || '0'}
                    </p>
                )}
            </div>
        </div>
    );
};


// ─────────────────────────────────────
// Turf Ticket Card (Sports)
// ─────────────────────────────────────
const TurfTicketCard = ({ booking }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    const firstSlot = booking.slots?.[0];
    const bookingDate = booking.snapshot?.date || firstSlot?.date || booking.showDate || booking.date;
    const startTime = booking.snapshot?.startTime || firstSlot?.startTime || booking.showTime;
    const turfName = booking.turf?.turfName || booking.turfName || booking.eventName || 'Sports Arena';
    const courtName = booking.court?.courtName || booking.courtName || booking.venue?.venueName || booking.venue?.name || 'Main Arena';
    const city = booking.turf?.city || booking.venue?.city || '';
    const amount = booking.payment?.amount || booking.totalPrice || booking.paidAmount || booking.pricing?.totalAmount || booking.totalAmount || 0;
    const status = booking.payment?.status || booking.paymentStatus || booking.bookingStatus || booking.status || 'Confirmed';
    const primaryImage = booking.turf?.primaryImage?.url || booking.turfImage || booking.courtImage || booking.eventPoster || booking.eventDetails?.eventImages?.[0]?.url || booking.posterUrl;

    return (
        <div
            onClick={() => navigate(booking.turf ? `/sports/bookings/${booking.bookingId || booking._id || booking.id}` : `/event-bookings/${booking.bookingId || booking._id || booking.id}`)}
            className="bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-100 dark:border-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-md dark:hover:border-gray-700 transition-all cursor-pointer overflow-hidden group"
        >
            {/* Poster / Venue Image */}
            <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                <img
                    src={primaryImage || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600'}
                    alt={turfName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    {booking.sportType || booking.eventDetails?.eventCategory || 'Sports'}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug line-clamp-1">
                    {turfName}
                </h3>
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{formatDate(bookingDate)}</span>
                    {startTime && (
                        <>
                            <span> • </span>
                            <Clock className="w-3.5 h-3.5 ml-1" />
                            <span>{startTime}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{courtName}{city ? `, ${city}` : ''}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <p className="text-primary font-bold text-[15px]">
                        ₹{amount.toLocaleString()}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        (status === 'paid' || status === 'confirmed') ? 'bg-green-100/10 text-green-600' : 'bg-orange-100/10 text-orange-600'
                    }`}>
                        {status}
                    </span>
                </div>
            </div>
        </div>
    );
};


// ─────────────────────────────────────
// Pagination Component
// ─────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-1.5 pt-10 pb-6">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {getPageNumbers().map((p, i) =>
                p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-300 dark:text-gray-600 text-sm select-none">•••</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`min-w-[36px] h-9 rounded-lg text-[13px] font-semibold transition-all ${page === p
                                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default MyBookingsPage;
