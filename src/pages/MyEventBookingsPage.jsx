import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, QrCode, Share2, MapPin, Calendar, Users, Loader, AlertCircle, ArrowLeft, Ticket, ExternalLink, ChevronRight, Sparkles, Search, Clock, User } from 'lucide-react';
import { getEventBookings } from '../services/eventService';
import { EventBooking } from '../models';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import { animationStyles } from '../styles/components';

const MyEventBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('upcoming');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await getEventBookings();
                setBookings(response || []);
            } catch (err) {
                console.error('Failed to fetch event bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const parseDateTime = (dateStr, timeStr) => {
        if (!dateStr) return null;
        try {
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
                const period = parts[1];

                let [hours, minutes] = time.split(':').map(Number);
                if (period === 'PM' && hours < 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                date.setHours(hours || 0, minutes || 0, 0, 0);
            }
            return date;
        } catch (e) {
            console.error('Event date parsing error:', e);
            return null;
        }
    };

    const filteredBookings = bookings.filter(b => {
        // Search Filter
        const query = searchTerm.toLowerCase();
        const eventName = (b.eventName || '').toLowerCase();
        const venueName = (b.venue?.name || '').toLowerCase();

        const matchesSearch = eventName.includes(query) || venueName.includes(query);
        if (!matchesSearch) return false;

        // Status Filter
        if (filterStatus === 'all') return true;

        const showDate = parseDateTime(b.showDate, b.showTime);
        if (!showDate) return true;

        const now = new Date();
        // 24 hour grace period for events matching Flutter logic
        const gracePeriodMs = 24 * 60 * 60 * 1000;

        const isPast = now.getTime() > (showDate.getTime() + gracePeriodMs);

        if (filterStatus === 'upcoming') return !isPast;
        if (filterStatus === 'past') return isPast;
        return true;
    });

    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-[#F5F5FA]">
            <SEO title="My Events - XYNEMA" description="View your event ticket bookings" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-bold text-gray-900 dark:text-white">My Events</h1>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Event History</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/5 dark:bg-primary/20 flex items-center justify-center border border-primary/10 dark:border-primary/80">
                            <Calendar className="w-4 h-4 text-primary dark:text-primary" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar justify-center">
                    {['all', 'upcoming', 'past'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterStatus === status ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 dark:shadow-primary/30' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/60'}`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8 relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchTerm ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-focus-within:text-primary'}`} />
                    <input
                        type="text"
                        placeholder="Search events by name or venue..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-primary uppercase tracking-widest"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Bookings List */}
                {filteredBookings.length > 0 ? (
                    <div className="space-y-6">
                        {filteredBookings.map((booking, idx) => (
                            <EventBookingCard key={booking.id || idx} booking={booking} />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Events Found</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">You haven't booked any event tickets yet.</p>
                        <button
                            onClick={() => navigate('/explore')}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 dark:shadow-primary/30"
                        >
                            Explore Events
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

const EventBookingCard = ({ booking }) => {
    const navigate = useNavigate();
    // Determine colors based on status
    const statusColors = {
        confirmed: 'bg-green-50 text-green-600 border-green-100',
        completed: 'bg-blue-50 text-blue-600 border-blue-100',
        cancelled: 'bg-red-50 text-red-600 border-red-100',
    };

    const uniqueTicketClasses = Array.from(new Set(booking.tickets.map(t => t.ticketClass))).join(', ');
    const ticketCount = booking.tickets?.reduce((acc, t) => acc + (t.quantity || 0), 0) || 0;
    const primaryAttendee = booking.attendees?.[0]?.name || 'Guest';

    const formatTime = (time) => {
        if (!time) return '';
        if (time.includes(':')) return time;
        return time;
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/50 transition-all overflow-hidden group">
            <div className="flex flex-col md:flex-row h-full">

                {/* Left Side - Date/Time Block */}
                <div className="bg-primary p-6 flex flex-col items-center justify-center text-white md:w-40 shrink-0 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-6 -mb-6" />

                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 relative z-10 mb-2">{new Date(booking.showDate).getFullYear()}</span>
                    <span className="text-4xl font-black relative z-10 leading-none tracking-tighter shadow-sm">
                        {new Date(booking.showDate).getDate()}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-widest relative z-10 mt-1">{new Date(booking.showDate).toLocaleString('default', { month: 'short' })}</span>

                    <div className="w-full h-px bg-white/20 my-4 relative z-10 mx-6" />

                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider relative z-10 text-white/80">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(booking.showTime)}
                    </div>
                </div>

                {/* Perforation Line (Desktop) */}
                <div className="relative w-0.5 hidden md:block bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent">
                    {/* Semi-circles at top and bottom */}
                    <div className="absolute -left-2 -top-3 w-5 h-5 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-b-0 border-gray-200 dark:border-gray-800" />
                    <div className="absolute -left-2 -bottom-3 w-5 h-5 bg-[#F5F5FA] dark:bg-gray-950 rounded-full border border-t-0 border-gray-200 dark:border-gray-800" />
                </div>

                {/* Right Side - Details & Action */}
                <div className="flex-1 flex flex-col justify-between p-6 sm:p-8">
                    {/* Top Section */}
                    <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2">
                                {booking.event?.eventName || booking.eventName}
                            </h3>
                            <div className="shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border ${statusColors[booking.status.toLowerCase()] || 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {booking.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <div className="flex items-center gap-1.5 shrink-0">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">{booking.event?.venue?.name || booking.venue?.name}, {booking.event?.venue?.city || booking.venue?.city}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <User className="w-4 h-4 text-primary" />
                                <span>{primaryAttendee}</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Info Row */}
                    <div className="mt-8 mb-6 flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Ticket Level</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={uniqueTicketClasses}>{uniqueTicketClasses || 'Standard'}</p>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                        <div className="flex-1 min-w-[80px]">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Quantity</p>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                                <Ticket className="w-4 h-4 text-primary" />
                                {ticketCount} {ticketCount > 1 ? 'Tickets' : 'Ticket'}
                            </div>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                        <div className="flex-1 min-w-[100px]">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-base font-black text-primary dark:text-primary">
                                {booking.currency === 'INR' || !booking.currency ? '₹' : booking.currency}
                                {booking.totalAmount?.toLocaleString() || '0.00'}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 border-dashed">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Order Reference</p>
                            <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">{booking.bookingId}</p>
                        </div>

                        <button
                            onClick={() => navigate(`/event-bookings/${booking.bookingId}`)}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
                        >
                            <QrCode className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            View Digital Ticket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col items-center justify-center space-y-6 p-8">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--xynemaRose, #FD4960)' }} />
        <div className="text-center">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-1 animate-pulse">Loading Events</p>
            <h2 className="text-xl font-bold text-gray-400">XYNEMA</h2>
        </div>
    </div>
);

export default MyEventBookingsPage;
