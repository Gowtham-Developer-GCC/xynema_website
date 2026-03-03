import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Loader, ChevronRight, ChevronDown, Filter, Info, Calendar, Ticket, Sun, SunMedium, Moon, CloudSun, CreditCard, Layers, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
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

    if (loading) return <LoadingSpinner message="Loading Nearby Screens" />;
    if (error) return <ErrorState error={error} onRetry={fetchData} title="Transmission Interrupted" buttonText="Recalibrate Connection" />;
    if (!movie) return <NotFoundState title="Movie Not Found" message="We couldn't find the movie you're looking for or it may not be available in this region." />;

    return (
        <div className="min-h-screen bg-whiteSmoke w-full max-w-[100vw] overflow-x-hidden">
            <SEO
                title={`Select Theater - ${movie?.title} | XYNEMA`}
                description="Choose your preferred cinema theater and select your seats"
            />

            {/* Simplified Movie Details Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight truncate">
                                {movie?.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5">
                                {movie?.certification && (
                                    <span className="px-1 py-0.5 rounded border border-gray-100 text-[8px] md:text-[9px] font-black text-gray-400 uppercase">
                                        {movie.certification}
                                    </span>
                                )}

                                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {movie?.genre && <span className="truncate max-w-[100px] md:max-w-none">{movie.genre}</span>}
                                    {movie?.language && (
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                                            <span>{movie.language}</span>
                                        </div>
                                    )}
                                    {movie?.duration > 0 && (
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                                            <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <div className="w-1 h-1 rounded-full bg-gray-200 shrink-0" />
                                        <span className="text-[#00296b] font-black truncate max-w-[80px] md:max-w-none">{selectedCity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consolidated Controls Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center py-2 md:py-3 gap-3 md:gap-8">
                        {/* Date Selection - Compact */}
                        <div className="flex-1 overflow-x-auto no-scrollbar px-4 sm:px-0">
                            <DateSelector
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                releaseDate={movie?.releaseDate}
                            />
                        </div>

                        {/* Divider for Desktop */}
                        <div className="hidden md:block w-px h-8 bg-gray-100" />

                        {/* Filter & Sort Controls */}
                        <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 px-4 sm:px-0 scroll-px-4 snap-x">
                            {/* Sort Dropdown */}
                            <FilterDropdown
                                label="Sort"
                                icon={Layers}
                                options={[
                                    { id: 'distance', label: 'Nearest', icon: MapPin },
                                    { id: 'price', label: 'Price', icon: CreditCard },
                                    { id: 'rating', label: 'Rating', icon: Star }
                                ]}
                                activeValue={sortBy}
                                onSelect={setSortBy}
                            />

                            {/* Format Dropdown */}
                            <FilterDropdown
                                label="Format"
                                icon={Layers}
                                options={dynamicFilterOptions.formats}
                                activeValue={filterSettings.format}
                                onSelect={(val) => updateFilter('format', val)}
                            />

                            {/* Price Dropdown */}
                            <FilterDropdown
                                label="Price"
                                icon={CreditCard}
                                options={dynamicFilterOptions.priceRanges}
                                activeValue={filterSettings.priceRange}
                                onSelect={(val) => updateFilter('priceRange', val)}
                            />

                            {/* Timing Dropdown */}
                            <FilterDropdown
                                label="Timing"
                                icon={Clock}
                                options={dynamicFilterOptions.timeSlots}
                                activeValue={filterSettings.timeSlot}
                                onSelect={(val) => updateFilter('timeSlot', val)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32">
                {/* Cinema Header Only */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#00296b] rounded-full" />
                        <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Cinemas</h2>
                        <span className="text-xs font-bold text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full">
                            {sortedTheaters.length} Available
                        </span>
                    </div>
                </div>

                {/* Theater List */}
                {sortedTheaters.length > 0 ? (
                    <div className="grid gap-6">
                        {sortedTheaters.map((theater) => (
                            <TheaterCard
                                key={theater.id}
                                theater={theater}
                                movieId={movie._id}
                                selectedDate={selectedDate}
                                selectedCity={selectedCity}
                                onSelect={(showId) => handleTheaterSelect(showId, theater)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No Shows Available</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">Try changing the date or format to see available screenings in {selectedCity}.</p>
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

    const dates = Array.from({ length: 2 }, (_, i) => {
        const date = new Date(minDate);
        date.setDate(minDate.getDate() + i);
        return date;
    });

    return (
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x scroll-px-4">
            {dates.map((date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const isSelected = dateStr === selectedDate;

                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });

                return (
                    <button
                        key={dateStr}
                        onClick={() => onDateSelect(dateStr)}
                        className={`
                            flex-shrink-0 w-16 py-3 rounded-xl flex flex-col items-center justify-center snap-center active:scale-95 transition-transform
                            ${isSelected
                                ? 'bg-[#00296b] text-white shadow-md shadow-blue-900/20'
                                : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
                            }
                        `}
                    >
                        <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                            {dayName}
                        </span>
                        <span className="text-lg font-black tracking-tight my-0.5 leading-none">
                            {dayNum}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-[0.1em] leading-none ${isSelected ? 'text-white/70' : 'text-gray-300'}`}>
                            {monthName}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const TheaterCard = ({ theater, movieId, selectedDate, onSelect, selectedCity }) => {
    const navigate = useNavigate();
    const allShows = theater.filteredShows || [];

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative`}>
            <div className="flex flex-col lg:flex-row gap-2 md:gap-5 lg:gap-8 overflow-visible">
                {/* Left Side: Theater Info */}
                <div className="lg:w-64 xl:w-72 flex flex-col justify-between shrink-0">
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <div className="flex items-start justify-between gap-3">
                                <button
                                    onClick={() => navigate(`/theater/${theater.id || theater._id}?city=${selectedCity}`, { state: { theater } })}
                                    className="flex items-center gap-2 text-left group w-full"
                                >
                                    <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight leading-tight group-hover:text-xynemaRose transition-colors truncate">
                                        {theater.name}
                                    </h3>
                                    <Info className="w-4 h-4 text-gray-400 group-hover:text-xynemaRose transition-colors shrink-0" />
                                </button>
                                {theater.rating > 0 && (
                                    <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold text-green-700 border border-green-100 uppercase tracking-tight shrink-0">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>{theater.rating}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wider mt-1.5">
                                {theater.distance && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-xynemaRose" />
                                        {theater.distance} KM
                                    </span>
                                )}
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {theater.city}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Divider (Visible only on LG up) */}
                    <div className="hidden lg:block h-px bg-gray-50 mt-4" />
                </div>

                {/* Right Side: Showtimes */}
                <div className="flex-1 min-w-0">
                    {allShows.length > 0 ? (
                        <div className="flex flex-nowrap items-center gap-3 py-2 md:pt-40 md:pb-40 md:-my-40 overflow-x-auto no-scrollbar scroll-smooth snap-x touch-pan-x">
                            {allShows.map((show, index) => (
                                <div key={show.id || show._id} className="min-w-[100px] md:min-w-[120px] shrink-0 snap-start">
                                    <TimeChip
                                        show={show}
                                        onSelect={() => onSelect(show.id || show._id)}
                                        position={index < 2 ? 'left' : index >= allShows.length - 2 ? 'right' : 'center'}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] text-center">
                                No screenings scheduled at this cinema
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TimeChip = ({ show, onSelect, position = 'center' }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isFull = show.availableSeats <= 0;

    // Calculate availability ratio
    const totalSeats = show.totalSeats || (show.availableSeats + (show.bookedSeats || 0));
    const availabilityRatio = totalSeats > 0 ? show.availableSeats / totalSeats : 1;

    // Status Logic
    let statusColor = 'text-green-500';
    let bgColor = 'bg-green-50/30';
    let borderColor = 'border-green-100';
    let availabilityLabel = `${show.availableSeats} Seats`;

    if (show.availableSeats === 0) {
        statusColor = 'text-gray-400';
        bgColor = 'bg-gray-50';
        borderColor = 'border-gray-100';
        availabilityLabel = 'Sold Out';
    } else if (availabilityRatio < 0.2) {
        statusColor = 'text-orange-500';
        bgColor = 'bg-orange-50/30';
        borderColor = 'border-orange-100';
        availabilityLabel = 'Filling Fast';
    }

    return (
        <div
            className={`relative ${isHovered ? 'z-50' : 'z-10'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={isFull ? null : onSelect}
                className={`
                    flex flex-col items-center justify-center py-2 px-1 rounded-xl border w-full
                    ${isFull ? 'cursor-not-allowed opacity-40' : 'hover:shadow-md'}
                    ${bgColor} ${borderColor}
                `}
            >
                <span className={`text-[13px] font-black tracking-tight ${isFull ? 'text-gray-400' : 'text-gray-900'}`}>
                    {show.startTime}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-bold uppercase tracking-tight ${statusColor}`}>
                        {availabilityLabel}
                    </span>
                    {show.screenType && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                {show.screenType}
                            </span>
                        </>
                    )}
                </div>
            </button>

            {/* Horizontal Hover Tooltip - Smart Positioning */}
            {isHovered && show.pricing && show.pricing.length > 0 && !isFull && (
                <div className={`
                    absolute bottom-full mb-4 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none
                    ${position === 'left' ? 'left-0 origin-bottom-left' :
                        position === 'right' ? 'right-0 origin-bottom-right' :
                            'left-1/2 -translate-x-1/2 origin-bottom'}
                `}>
                    <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 p-4 whitespace-nowrap min-w-max">
                        <div className="flex items-center gap-5 px-0.5">
                            {show.pricing.map((price, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    {idx > 0 && <div className="w-px h-5 bg-gray-100" />}
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{price.label}</span>
                                        <div className="text-sm font-bold text-gray-900 tracking-tight leading-none flex items-center gap-0.5">
                                            <span className="text-[10px] text-gray-400">₹</span>
                                            {price.basePrice || price.price}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Arrow - Smart Positioning */}
                        <div className={`
                            absolute top-full w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 -mt-1.5 shadow-[2px_2px_5px_rgba(0,0,0,0.02)]
                            ${position === 'left' ? 'left-8' :
                                position === 'right' ? 'right-8' :
                                    'left-1/2 -translate-x-1/2'}
                        `} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TheaterSelectionPage;
