import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, QrCode, Share2, MapPin, Calendar, Users, Loader, AlertCircle, ArrowLeft, Ticket, ExternalLink, ChevronRight, Sparkles, Search } from 'lucide-react';
import * as api from '../services/api';
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
                const response = await api.getEventBookings();
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
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#3e7cb1] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-bold text-gray-900">My Events</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Event History</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-[#3e7cb1]" />
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
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterStatus === status ? 'bg-xynemaRose  text-white border-[#3e7cb1] shadow-lg shadow-blue-100' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8 relative group">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchTerm ? 'text-[#3e7cb1]' : 'text-gray-400 group-focus-within:text-[#3e7cb1]'}`} />
                    <input
                        type="text"
                        placeholder="Search events by name or venue..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3e7cb1]/20 focus:border-[#3e7cb1] transition-all shadow-sm font-medium"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 hover:text-[#3e7cb1] uppercase tracking-widest"
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
                    <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-8 h-8 text-gray-200" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Events Found</h2>
                        <p className="text-gray-400 text-sm mb-8">You haven't booked any event tickets yet.</p>
                        <button
                            onClick={() => navigate('/explore')}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-xynemaRose text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2c5a85] transition-all shadow-lg shadow-blue-100"
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

    // Calculate total tickets
    const ticketCount = booking.tickets.reduce((sum, t) => sum + t.quantity, 0);

    const formatTime = (timeString) => {
        if (!timeString) return '';
        try {
            // Check if it's a full ISO string (e.g. 2023-10-27T10:00:00)
            const date = new Date(timeString);
            if (!isNaN(date.getTime()) && timeString.includes('T')) {
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            }

            // Handle "HH:mm" or "HH:mm:ss" format
            const [hours, minutes] = timeString.split(':');
            if (hours && minutes) {
                const d = new Date();
                d.setHours(parseInt(hours));
                d.setMinutes(parseInt(minutes));
                return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            }

            return timeString;
        } catch (e) {
            return timeString;
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="flex flex-col md:flex-row">
                {/* Left Side - Date/Time Gradient Strip */}
                <div className="bg-gradient-to-br from-[#00296b] to-[#3e7cb1] p-6 flex flex-col items-center justify-center text-white md:w-32 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                    <span className="text-3xl font-black relative z-10">
                        {new Date(booking.showDate).getDate()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider relative z-10">{new Date(booking.showDate).toLocaleString('default', { month: 'short' })}</span>
                    <div className="w-8 h-0.5 bg-white/20 my-3 relative z-10" />
                    <span className="text-xs font-medium opacity-80 relative z-10">{formatTime(booking.showTime)}</span>
                </div>

                {/* Right Side - Details */}
                <div className="flex-1 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-xynemaRose transition-colors">
                                    {booking.eventName}
                                </h3>
                                {/* <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColors[booking.status.toLowerCase()] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                    {booking.status}
                                </span> */}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                <MapPin className="w-3.5 h-3.5 text-[#81a4cd]" />
                                <span>{booking.venue.name}, {booking.venue.city}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                                {booking.currency === 'INR' ? 'Rs:' : booking.currency}
                                {booking.totalAmount.toLocaleString()}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Total Amount</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Items</p>
                                <p className="text-sm font-bold text-gray-900">{ticketCount} Tickets</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Order ID</p>
                                <p className="text-xs font-medium text-gray-500 font-mono">{booking.bookingId}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/event-bookings/${booking.bookingId}`)}
                            className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:text-[#3e7cb1] hover:border-[#3e7cb1] transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <QrCode className="w-3.5 h-3.5" />
                            View Ticket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col items-center justify-center space-y-6 p-8">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: '#3e7cb1' }} />
        <div className="text-center">
            <p className="text-[#3e7cb1] font-bold text-xs uppercase tracking-widest mb-1 animate-pulse">Loading Events</p>
            <h2 className="text-xl font-bold text-gray-400">XYNEMA</h2>
        </div>
    </div>
);

export default MyEventBookingsPage;
