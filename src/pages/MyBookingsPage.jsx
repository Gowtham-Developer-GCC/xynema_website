import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Loader, ArrowLeft, Ticket, ExternalLink, QrCode, User, Clock, Calendar } from 'lucide-react';
import { getUserBookings } from '../services/bookingService';
import { getEventBookings } from '../services/eventService';
import SEO from '../components/SEO';

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const [bookingType, setBookingType] = useState('movies'); // 'movies' or 'events'
    const [bookings, setBookings] = useState([]);
    const [eventBookings, setEventBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventLoading, setEventLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('upcoming');

    // Pagination State (for Movies)
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchMovieBookings = async (targetPage = 1, isLoadMore = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const response = await getUserBookings(targetPage);
            const { bookings: newBookings, totalPages: total, currentPage } = response;

            if (isLoadMore) {
                setBookings(prev => [...prev, ...newBookings]);
            } else {
                setBookings(newBookings || []);
            }

            setTotalPages(total);
            setPage(currentPage);
        } catch (err) {
            console.error('Failed to fetch movie bookings:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchEventBookings = async () => {
        try {
            setEventLoading(true);
            const response = await getEventBookings();
            setEventBookings(response || []);
        } catch (err) {
            console.error('Failed to fetch event bookings:', err);
        } finally {
            setEventLoading(false);
        }
    };

    useEffect(() => {
        fetchMovieBookings(1, false);
        fetchEventBookings();
    }, []);

    const handleLoadMore = () => {
        if (page < totalPages && !loadingMore) {
            fetchMovieBookings(page + 1, true);
        }
    };

    const parseDateTime = (dateStr, timeStr) => {
        if (!dateStr) return null;
        try {
            // Robust parsing: Treat "YYYY-MM-DD" as local date to avoid timezone shifts
            let date;
            if (dateStr.includes('-') && !dateStr.includes('T')) {
                const [year, month, day] = dateStr.split('-').map(Number);
                date = new Date(year, month - 1, day);
            } else {
                date = new Date(dateStr);
            }

            if (isNaN(date.getTime())) return null;

            if (timeStr) {
                const parts = timeStr.trim().toUpperCase().split(' ');
                const time = parts[0];
                const period = parts[1]; // AM/PM

                let [hours, minutes] = time.split(':').map(Number);

                if (period === 'PM' && hours < 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;

                date.setHours(hours || 0, minutes || 0, 0, 0);
            }
            return date;
        } catch (e) {
            console.error('Date parsing error:', e);
            return null;
        }
    };

    const activeBookings = bookingType === 'movies' ? bookings : eventBookings;

    const filteredBookings = activeBookings.filter(b => {
        if (filterStatus === 'all') return true;

        const dateStr = bookingType === 'movies' ? b.date : b.showDate;
        const timeStr = bookingType === 'movies' ? b.time : b.showTime;

        const showDate = parseDateTime(dateStr, timeStr);
        if (!showDate) return true;

        const now = new Date();
        const gracePeriodMs = bookingType === 'movies' ? 200 * 60 * 1000 : 24 * 60 * 60 * 1000;

        const isPast = now.getTime() > (showDate.getTime() + gracePeriodMs);

        if (filterStatus === 'upcoming') return !isPast;
        if (filterStatus === 'past') return isPast;
        return true;
    });

    if (loading && bookingType === 'movies') return <LoadingState />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 transition-colors duration-300">
            <SEO title="My Bookings - XYNEMA" description="View your purchase history" />

            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.3em]">My Bookings</h1>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">PURCHASE HISTORY</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Ticket className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Type Toggle & Filter Tabs */}
                <div className="flex flex-col items-center gap-6 mb-12">
                    {/* Booking Type Toggle */}
                    <div className="flex p-1.5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setBookingType('movies')}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingType === 'movies'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Movies
                        </button>
                        <button
                            onClick={() => setBookingType('events')}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingType === 'events'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Event Pass
                        </button>
                    </div>

                    {/* Filter Status */}
                    <div className="flex gap-4">
                        {['all', 'upcoming', 'past'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`
                                    px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border
                                    ${filterStatus === status
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                                    }
                                `}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {eventLoading && bookingType === 'events' ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Fetching event passes...</p>
                    </div>
                ) : filteredBookings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {filteredBookings.map((booking) => (
                            bookingType === 'movies' ? (
                                <BookingCard key={booking.id} booking={booking} />
                            ) : (
                                <EventBookingCard key={booking.id} booking={booking} />
                            )
                        ))}

                        {/* Load More Section (Movies Only) */}
                        {bookingType === 'movies' && page < totalPages && (
                            <div className="flex justify-center pt-8 pb-12">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className={`
                                        flex items-center gap-3 px-10 py-4 rounded-2xl font-display font-bold text-[10px] uppercase tracking-widest transition-all
                                        ${loadingMore
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95 hover:bg-indigo-700'
                                        }
                                    `}
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Syncing Transactions...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            Load More
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Ticket className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No {bookingType === 'movies' ? 'Bookings' : 'Event Passes'} Found</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">You haven't booked any {bookingType === 'movies' ? 'movie tickets' : 'event passes'} yet.</p>
                        <button
                            onClick={() => navigate(bookingType === 'movies' ? '/' : '/events')}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-indigo-600 text-white font-display font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                        >
                            Explore {bookingType === 'movies' ? 'Movies' : 'Events'}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};


const BookingCard = ({ booking }) => {
    const navigate = useNavigate();

    const statusColors = {
        confirmed: 'bg-green-50 text-green-600 border-green-100',
        completed: 'bg-blue-50 text-blue-600 border-blue-100',
        cancelled: 'bg-red-50 text-red-600 border-red-100',
    };

    const getDisplayDate = (dateStr) => {
        if (!dateStr) return 'TBD';
        try {
            // Standardize display by parsing local components
            const d = dateStr.includes('-') && !dateStr.includes('T')
                ? new Date(...dateStr.split('-').map((v, i) => i === 1 ? v - 1 : v))
                : new Date(dateStr);

            return d.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const bookingDate = getDisplayDate(booking.date);
    const seatCount = booking.seats?.length || 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all overflow-hidden group">
            <div className="flex flex-col md:flex-row h-full">

                {/* Left Side - Poster Block */}
                <div className="relative md:w-48 shrink-0 bg-gray-900 overflow-hidden">
                    <img
                        src={booking.posterUrl || 'https://placehold.co/400x600/F5F5FA/999?text=Movie'}
                        alt={booking.movieTitle}
                        className="w-full h-full object-cover md:absolute inset-0 aspect-[2/3] md:aspect-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-gray-900 via-gray-900/60 md:via-gray-900/40 to-transparent pointer-events-none" />

                    {/* Status Pill on top of poster */}
                    <div className="absolute top-4 left-4 z-10">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md backdrop-blur-md border ${statusColors[booking.status.toLowerCase()] || 'bg-white/90 text-gray-900 border-white/20'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {booking.status}
                        </span>
                    </div>
                </div>

                {/* Perforation Line (Desktop) */}
                <div className="relative w-0.5 hidden md:block bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 -ml-0.5">
                    {/* Semi-circles at top and bottom */}
                    <div className="absolute -left-2 -top-3 w-5 h-5 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-b-0 border-gray-200 dark:border-gray-800" />
                    <div className="absolute -left-2 -bottom-3 w-5 h-5 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-t-0 border-gray-200 dark:border-gray-800" />
                </div>

                {/* Right Side - Details & Action */}
                <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 relative">

                    {/* Top Section */}
                    <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                {booking.movieTitle}
                            </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <div className="flex items-center gap-1.5 shrink-0">
                                <MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">{booking.theaterName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Info Row */}
                    <div className="mt-8 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Date & Time</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                {bookingDate} <span className="text-gray-400 dark:text-gray-500 font-normal">|</span> {booking.time || 'N/A'}
                            </p>
                        </div>
                        <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700 h-full justify-self-center pointer-events-none"></div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Seats ({seatCount})</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1" title={booking.seats?.join(', ')}>
                                {booking.seats?.join(', ') || 'N/A'}
                            </p>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700 h-full justify-self-center pointer-events-none hidden md:block"></div>
                        <div className="text-right md:text-left">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                                ₹{booking.totalAmount?.toLocaleString() || '0.00'}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 border-dashed">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Order Reference</p>
                            <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{booking.id}</p>
                        </div>

                        <button
                            onClick={() => navigate(`/bookings/${booking.id}`)}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
                        >
                            <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            View Digital Ticket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventBookingCard = ({ booking }) => {
    const navigate = useNavigate();

    const statusColors = {
        confirmed: 'bg-green-50 text-green-600 border-green-100',
        completed: 'bg-blue-50 text-blue-600 border-blue-100',
        cancelled: 'bg-red-50 text-red-600 border-red-100',
    };

    const ticketCount = booking.tickets?.reduce((acc, t) => acc + (t.quantity || 0), 0) || 0;
    const uniqueTicketClasses = Array.from(new Set(booking.tickets?.map(t => t.ticketClass))).join(', ');

    const formatTime = (time) => {
        if (!time) return '';
        if (time.includes(':')) return time;
        return time;
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all overflow-hidden group">
            <div className="flex flex-col md:flex-row h-full">
                {/* Left Side - Hero Date Block */}
                <div className="relative md:w-48 shrink-0 bg-indigo-600 flex flex-col items-center justify-center text-white py-8 md:py-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-50" />
                    </div>

                    <span className="text-4xl font-black relative z-10 leading-none tracking-tighter">
                        {new Date(booking.showDate).getDate()}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-widest relative z-10 mt-1">
                        {new Date(booking.showDate).toLocaleString('default', { month: 'short' })}
                    </span>

                    <div className="w-12 h-px bg-white/20 my-4 relative z-10" />

                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider relative z-10 text-indigo-100">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(booking.showTime)}
                    </div>

                    <div className="absolute top-4 left-4 z-10 md:hidden">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md backdrop-blur-md border ${statusColors[booking.status.toLowerCase()] || 'bg-white/90 text-gray-900 border-white/20'}`}>
                            {booking.status}
                        </span>
                    </div>
                </div>

                {/* Perforation Line (Desktop) */}
                <div className="relative w-0.5 hidden md:block bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 -ml-0.5">
                    <div className="absolute -left-2 -top-3 w-5 h-5 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-b-0 border-gray-200 dark:border-gray-800" />
                    <div className="absolute -left-2 -bottom-3 w-5 h-5 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-t-0 border-gray-200 dark:border-gray-800" />
                </div>

                {/* Right Side - Details & Action */}
                <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 relative">
                    <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                {booking.eventName}
                            </h3>
                            <div className="shrink-0 text-right hidden md:block">
                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border ${statusColors[booking.status.toLowerCase()] || 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {booking.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <div className="flex items-center gap-1.5 shrink-0">
                                <MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">{booking.venue?.name}, {booking.venue?.city}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Ticket Level</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={uniqueTicketClasses}>{uniqueTicketClasses || 'Standard'}</p>
                        </div>
                        <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700 h-full justify-self-center pointer-events-none"></div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Quantity</p>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                                <Ticket className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                {ticketCount} {ticketCount > 1 ? 'Tickets' : 'Ticket'}
                            </div>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700 h-full justify-self-center pointer-events-none hidden md:block"></div>
                        <div className="text-right md:text-left">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                                {booking.currency === 'INR' || !booking.currency ? '₹' : booking.currency}
                                {booking.totalAmount?.toLocaleString() || '0.00'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 border-dashed">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Order Reference</p>
                            <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{booking.bookingId}</p>
                        </div>
                        <button
                            onClick={() => navigate(`/event-bookings/${booking.bookingId}`)}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
                        >
                            <QrCode className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            View Digital Pass
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col items-center justify-center space-y-6 p-8 transition-colors duration-300">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800 animate-spin" style={{ borderTopColor: '#4f46e5' }} />
        <div className="text-center">
            <p className="text-indigo-600 dark:text-indigo-400 font-display font-bold text-xs uppercase tracking-widest mb-1 animate-pulse">Loading Bookings</p>
            <h2 className="text-xl font-display font-black tracking-tight text-gray-300 dark:text-gray-700">XYNEMA</h2>
        </div>
    </div>
);

export default MyBookingsPage;
