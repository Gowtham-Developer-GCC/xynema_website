import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Loader, ArrowLeft, Ticket, ExternalLink } from 'lucide-react';
import { getUserBookings } from '../services/bookingService';
import SEO from '../components/SEO';

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('upcoming');

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchBookings = async (targetPage = 1, isLoadMore = false) => {
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
            console.error('Failed to fetch bookings:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchBookings(1, false);
    }, []);

    const handleLoadMore = () => {
        if (page < totalPages && !loadingMore) {
            fetchBookings(page + 1, true);
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

    const filteredBookings = bookings.filter(b => {
        if (filterStatus === 'all') return true;

        const showDate = parseDateTime(b.date, b.time);
        if (!showDate) return true;

        const now = new Date();
        // 200 minute grace period (3h 20m) matching Flutter logic
        const gracePeriodMs = 200 * 60 * 1000;

        const isPast = now.getTime() > (showDate.getTime() + gracePeriodMs);

        if (filterStatus === 'upcoming') return !isPast;
        if (filterStatus === 'past') return isPast;
        return true;
    });


    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-[#F5F5FA]">
            <SEO title="My Bookings - XYNEMA" description="View your movie ticket bookings" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-xynemaRose transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <div className="text-center font-display">
                        <h1 className="text-sm font-bold text-gray-900">My Bookings</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Purchase History</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                            <Ticket className="w-4 h-4 text-xynemaRose" />
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
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterStatus === status ? 'bg-xynemaRose text-white border-xynemaRose shadow-lg shadow-xynemaRose/10' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {filteredBookings.length > 0 ? (
                    <div className="space-y-6">
                        {filteredBookings.map((booking, idx) => (
                            <BookingCard
                                key={booking.id || idx}
                                booking={booking}
                            />
                        ))}

                        {/* Load More Section */}
                        {page < totalPages && (
                            <div className="flex justify-center pt-8 pb-12">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className={`
                                        flex items-center gap-3 px-10 py-4 rounded-2xl font-display font-bold text-[10px] uppercase tracking-widest transition-all
                                        ${loadingMore
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-xynemaRose text-white  active:scale-95'
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
                    <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Ticket className="w-8 h-8 text-gray-200" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Bookings Found</h2>
                        <p className="text-gray-400 text-sm mb-8">You haven't booked any movie tickets yet.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-xynemaRose text-white font-display font-bold text-xs uppercase tracking-widest hover:bg-charcoalSlate transition-all shadow-lg shadow-xynemaRose/10"
                        >
                            Explore Movies
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

    return (
        <div className="bg-white rounded-2xl border border-gray shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                {/* Poster */}
                <div className="w-24 md:w-24 aspect-[2/3] rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                    <img
                        src={booking.posterUrl || 'https://placehold.co/400x600/F5F5FA/999?text=Movie'}
                        alt={booking.movieTitle}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 w-full space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-xl font-display font-bold text-gray-900">{booking.movieTitle}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-[10px] font-bold uppercase">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" />
                                    <span>{booking.theaterName}</span>
                                </div>
                                {/* <div className="w-1 h-1 rounded-full bg-gray-200" />
                                <span>{booking.city}</span> */}
                            </div>
                        </div>
                        <div className="text-left md:text-right font-display">
                            <p className="text-2xl font-bold text-gray-900">Rs:{booking.totalAmount.toLocaleString()}</p>
                            {/* <p className="text-[10px] font-bold text-green-600 uppercase mt-0.5">Payment Successful</p> */}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date</p>
                            <p className="text-xs font-bold text-gray-900">{bookingDate}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time</p>
                            <p className="text-xs font-bold text-gray-900">{booking.time || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Seats</p>
                            <p className="text-xs font-bold text-gray-900">{booking.seats?.join(', ') || 'N/A'}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1 flex items-end">
                            <button
                                onClick={() => navigate(`/bookings/${booking.id}`)}
                                className="w-full h-14 rounded-2xl border border-gray-200 bg-xynemaRose text-white hover:border-xynemaRose transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 font-display"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen bg-whiteSmoke flex flex-col items-center justify-center space-y-6 p-8">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: '#00296b' }} />
        <div className="text-center">
            <p className="text-xynemaRose font-display font-bold text-xs uppercase tracking-widest mb-1 animate-pulse">Loading Bookings</p>
            <h2 className="text-xl font-display font-black tracking-tight text-gray-300">XYNEMA</h2>
        </div>
    </div>
);


export default MyBookingsPage;
