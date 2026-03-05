import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Loader, ChevronRight, ChevronDown, Filter, Info, Calendar, Ticket, Sun, SunMedium, Moon, CloudSun, CreditCard, Layers, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import NotFoundState from '../components/NotFoundState';
import { designSystem } from '../config/design-system';
import { cardStyles, animationStyles } from '../styles/components';
import { getTheatersForMovie } from '../services/movieService';
import bookingSessionManager from '../utils/bookingSessionManager';

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.trim().split(' ');
    if (!time || !period) return 0;
    let [hours, minutes] = time.split(':').map(Number);
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

const TheaterSelectionPage = () => {
    let { id: paramId, slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Prioritize URL params (slug/id), then search params
    const identifier = slug || paramId || searchParams.get('movieId');

    const [movie, setMovie] = useState(null);
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('distance');
    const [filterSettings, setFilterSettings] = useState({
        format: 'All',
        priceRange: 'All',
        timeSlot: 'All'
    });

    const dynamicFilterOptions = useMemo(() => {
        const formats = new Set(['All']);
        const timeSlots = new Set(['All']);
        const prices = [];

        theaters.forEach(theater => {
            (theater.allShows || []).forEach(show => {
                if (show.format) formats.add(show.format);

                const mins = timeToMinutes(show.startTime);
                if (mins < 720) timeSlots.add('Morning');
                else if (mins < 960) timeSlots.add('Afternoon');
                else if (mins < 1200) timeSlots.add('Evening');
                else timeSlots.add('Night');

                const price = show.basePrice || 0;
                if (price > 0) prices.push(price);
            });
        });

        const sortedPrices = [...new Set(prices)].sort((a, b) => a - b);
        const priceRanges = [{ id: 'All', label: 'All' }];

        let thresholds = { mid1: 200, mid2: 450 };

        if (sortedPrices.length > 0) {
            const min = sortedPrices[0];
            const max = sortedPrices[sortedPrices.length - 1];
            const range = max - min;

            if (range === 0) {
                priceRanges.push({ id: 'PricePoint', label: `₹${min}` });
            } else {
                thresholds.mid1 = Math.round(min + range / 3);
                thresholds.mid2 = Math.round(min + (2 * range) / 3);
                priceRanges.push({ id: 'Budget', label: `< ₹${thresholds.mid1}` });
                priceRanges.push({ id: 'Mid', label: `₹${thresholds.mid1}-${thresholds.mid2}` });
                priceRanges.push({ id: 'Premium', label: `> ₹${thresholds.mid2}` });
            }
        }

        return {
            formats: Array.from(formats).map(f => ({ id: f, label: f })),
            timeSlots: Array.from(timeSlots).map(t => ({ id: t, label: t })),
            priceRanges,
            thresholds
        };
    }, [theaters]);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { selectedCity: cityFromContext, movies, loading: isContextLoading } = useData();
    const { user } = useAuth();
    const selectedCity = cityFromContext || localStorage.getItem('selected_city') || '';

    // Sync movie details and adjust initial date if needed
    useEffect(() => {
        if ((movies || []).length > 0) {
            const foundMovie = movies.find(m => {
                const slugMatch = m.slug && m.slug.toLowerCase() === identifier?.toLowerCase();
                const idMatch = String(m.id) === identifier || String(m._id) === identifier;
                return slugMatch || idMatch;
            });

            if (foundMovie) {
                setMovie(foundMovie);

                // Ensure selectedDate is valid for this movie
                if (foundMovie.releaseDate) {
                    const releaseDateObj = new Date(foundMovie.releaseDate);
                    releaseDateObj.setHours(0, 0, 0, 0);

                    const currentSelectedObj = new Date(selectedDate);
                    currentSelectedObj.setHours(0, 0, 0, 0);

                    // If currently selected date is before release, jump to release date
                    if (currentSelectedObj < releaseDateObj) {
                        const dateStr = foundMovie.releaseDate.split('T')[0];
                        setSelectedDate(dateStr);
                    }
                }
            } else if (!isContextLoading) {
                // Movie not found and context is done loading
                setLoading(false);
            }
        } else if (!isContextLoading) {
            setLoading(false);
        }
    }, [movies, identifier, selectedDate, isContextLoading]);

    const fetchData = useCallback(async (isStopped = { current: false }) => {
        const targetMovieId = movie?.id || (identifier?.match(/^[0-9a-fA-F]{24}$/) ? identifier : null);

        // If we don't have a target ID yet
        if (!targetMovieId) {
            // If we rely on context resolving the slug, and context is done but failed to match -> Stop loading
            if (!isContextLoading && !movie) {
                if (!isStopped.current) setLoading(false);
            }
            return;
        }

        if (!selectedCity || !selectedDate) return;

        try {
            setLoading(true);
            setError(null);
            const theatersRes = await getTheatersForMovie(targetMovieId, selectedCity, selectedDate);
            if (!isStopped.current) {
                setTheaters(theatersRes || []);
            }
        } catch (err) {
            if (!isStopped.current) setError(err);
            console.error('Fetch error:', err);
        } finally {
            if (!isStopped.current) setLoading(false);
        }
    }, [movie, identifier, selectedCity, selectedDate, isContextLoading]);

    // Robust fetching with cleanup to prevent race conditions
    useEffect(() => {
        const isStopped = { current: false };
        fetchData(isStopped);
        return () => { isStopped.current = true; };
    }, [fetchData]);

    const handleTheaterSelect = (showId, theater) => {
        try {
            const slug = movie.slug;
            const theaterSlug = theater?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theater';

            bookingSessionManager.startSession(showId, theater?.name || '', user?.id || user?._id);

            navigate(`/movie/${slug}/${theaterSlug}/seats`);
        } catch (err) {
            console.error('Navigation error:', err);
        }
    };


    const isMatch = (show) => {
        // Format Filter
        if (filterSettings.format !== 'All' && show.format !== filterSettings.format) return false;

        // Price Filter
        if (filterSettings.priceRange !== 'All') {
            const price = show.basePrice || 0;
            const { mid1, mid2 } = dynamicFilterOptions.thresholds;

            if (filterSettings.priceRange === 'PricePoint' && price !== mid1) return false;
            if (filterSettings.priceRange === 'Budget' && price >= mid1) return false;
            if (filterSettings.priceRange === 'Mid' && (price < mid1 || price > mid2)) return false;
            if (filterSettings.priceRange === 'Premium' && price <= mid2) return false;
        }

        // Time Slot Filter
        if (filterSettings.timeSlot !== 'All') {
            const mins = timeToMinutes(show.startTime);
            if (filterSettings.timeSlot === 'Morning' && mins >= 720) return false; // 12 PM
            if (filterSettings.timeSlot === 'Afternoon' && (mins < 720 || mins >= 960)) return false; // 12 PM - 4 PM
            if (filterSettings.timeSlot === 'Evening' && (mins < 960 || mins >= 1200)) return false; // 4 PM - 8 PM
            if (filterSettings.timeSlot === 'Night' && mins < 1200) return false; // 8 PM
        }

        return true;
    };

    const filteredTheaters = theaters.map(theater => {
        const matchingShows = (theater.allShows || []).filter(isMatch);

        // Sort shows by time
        matchingShows.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        if (matchingShows.length === 0) return null;
        return { ...theater, filteredShows: matchingShows };
    }).filter(Boolean);

    const sortedTheaters = [...filteredTheaters].sort((a, b) => {
        switch (sortBy) {
            case 'distance': return (a.distance || 0) - (b.distance || 0);
            case 'rating': return (b.rating || 0) - (a.rating || 0);
            case 'price': {
                const aMin = Math.min(...(a.filteredShows || []).map(s => s.basePrice || 0));
                const bMin = Math.min(...(b.filteredShows || []).map(s => s.basePrice || 0));
                return aMin - bMin;
            }
            default: return 0;
        }
    });

    const updateFilter = (key, value) => {
        setFilterSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <LoadingScreen message="Loading Nearby Screens" />;
    if (error) return <ErrorState error={error} onRetry={fetchData} title="Transmission Interrupted" buttonText="Recalibrate Connection" />;
    if (!movie) return <NotFoundState title="Movie Not Found" message="We couldn't find the movie you're looking for or it may not be available in this region." />;

    return (
        <div className="min-h-screen bg-whiteSmoke w-full max-w-[100vw] overflow-x-hidden">
            <SEO
                title={`Select Theater - ${movie?.title} | XYNEMA`}
                description="Choose your preferred cinema theater and select your seats"
            />

            {/* Redesigned Header to match Figma */}
            <div className="bg-[#f8fafc] dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[60]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                Select Showtime
                            </h1>
                            <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mt-1">
                                {movie?.title}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">
                {/* Movie Info Banner Card */}
                <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Poster */}
                        <div className="w-40 md:w-48 shrink-0 relative group">
                            <img
                                src={movie?.posterUrl || movie?.image}
                                alt={movie?.title}
                                className="w-full aspect-[2/3] object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Details */}
                        <div className="flex-1 pt-2">
                            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                                {movie?.title}
                            </h2>

                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                {movie?.certification && (
                                    <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg text-[10px] md:text-xs font-black text-gray-400 dark:text-gray-300 uppercase border border-gray-100 dark:border-gray-600">
                                        {movie.certification}
                                    </span>
                                )}
                                {movie?.duration > 0 && (
                                    <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg text-[10px] md:text-xs font-black text-gray-400 dark:text-gray-300 uppercase border border-gray-100 dark:border-gray-600">
                                        {Math.floor(movie.duration / 60)}:{String(movie.duration % 60).padStart(2, '0')}:00
                                    </span>
                                )}
                                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg text-[10px] md:text-xs font-black text-indigo-400 dark:text-indigo-300 uppercase border border-indigo-100 dark:border-indigo-800">
                                    3D
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Screen:</span>
                                    <span className="text-sm md:text-base font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                        {theaters[0]?.name || "Nearby Cinema"}
                                    </span>
                                </div>
                                <p className="text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500 tracking-tight leading-relaxed max-w-lg">
                                    Select a showtime below to proceed to seat selection.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-gray-100 dark:bg-gray-800 mb-12" />

                {/* Showtimes Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                            Showtimes for <span className="text-indigo-600 dark:text-indigo-400">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? "Today" : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        </h2>
                    </div>

                    <div className="flex-shrink-0">
                        <DateSelector
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            releaseDate={movie?.releaseDate}
                        />
                    </div>
                </div>

                {/* Cinema List - Grid Layout to match Figma */}
                {sortedTheaters.length > 0 ? (
                    <div className="grid gap-12">
                        {sortedTheaters.map((theater) => (
                            <div key={theater.id || theater._id} className="space-y-6">
                                {/* Only show theater name if it's not the first one or if multiple theaters are shown */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(theater.filteredShows || []).map((show) => (
                                        <ShowtimeCard
                                            key={show.id || show._id}
                                            show={show}
                                            theater={theater}
                                            onSelect={() => handleTheaterSelect(show.id || show._id, theater)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Shows Available</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">Try changing the date or format to see available screenings in {selectedCity}.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const FilterDropdown = ({ label, icon: Icon, options, activeValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeOption = options.find(opt => opt.id === activeValue) || options[0];

    return (
        <div className="relative shrink-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${isOpen || activeValue !== 'All' && activeValue !== 'distance'
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                    }`}
            >
                {activeOption.icon ? <activeOption.icon className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <div className="flex flex-col items-start leading-none">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isOpen || activeValue !== 'All' && activeValue !== 'distance' ? 'text-white/60' : 'text-gray-400'}`}>
                        {label}
                    </span>
                    <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">
                        {activeOption.label}
                    </span>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => {
                                onSelect(opt.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-50 ${activeValue === opt.id ? 'text-xynemaRose' : 'text-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                                {opt.label}
                            </div>
                            {activeValue === opt.id && <Check className="w-3 h-3" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const DateSelector = ({ selectedDate, onDateSelect, releaseDate }) => {
    let minDate = releaseDate ? new Date(releaseDate) : new Date();
    if (minDate < new Date().setHours(0, 0, 0, 0)) minDate = new Date();

    const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(minDate);
        date.setDate(minDate.getDate() + i);
        return date;
    });

    return (
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x">
            {dates.map((date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const isSelected = dateStr === selectedDate;

                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dayNum = date.getDate();
                const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

                return (
                    <button
                        key={dateStr}
                        onClick={() => onDateSelect(dateStr)}
                        className={`
                            flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center snap-center transition-all duration-300
                            ${isSelected
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 border-indigo-600'
                                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-gray-300'
                            } border-2
                        `}
                    >
                        <span className={`text-[9px] font-black tracking-widest mb-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                            {dayName}
                        </span>
                        <span className="text-xl font-black tracking-tighter leading-none mb-1">
                            {dayNum}
                        </span>
                        <span className={`text-[9px] font-black tracking-widest ${isSelected ? 'text-white/80' : 'text-gray-300'}`}>
                            {monthName}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const ShowtimeCard = ({ show, theater, onSelect }) => {
    const isFull = show.availableSeats <= 0;
    const totalSeats = show.totalSeats || (show.availableSeats + (show.bookedSeats || 0));
    const occupancyRatio = totalSeats > 0 ? (totalSeats - show.availableSeats) / totalSeats : 0;

    return (
        <button
            onClick={isFull ? null : onSelect}
            className={`
                group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-xl transition-all duration-500 text-left relative overflow-hidden
                ${isFull ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
            `}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    {show.startTime}
                </span>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₹{show.basePrice || 100}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-6">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-widest truncate">
                    {theater.name}
                </span>
            </div>

            {/* Availability Bar - Match Figma */}
            <div className="space-y-2">
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(1 - occupancyRatio) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {show.availableSeats} SEATS LEFT
                    </span>
                    {show.format && (
                        <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                            {show.format}
                        </span>
                    )}
                </div>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
    );
};

export default TheaterSelectionPage;
