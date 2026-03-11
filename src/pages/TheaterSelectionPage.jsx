import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Loader, ChevronRight, ChevronDown, Filter, Info, Calendar, Ticket, Sun, SunMedium, Moon, CloudSun, CreditCard, Layers, Check, ChevronLeft } from 'lucide-react';
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

            // Find the specific show for time info
            const selectedShow = theater.allShows?.find(s => (s.id || s._id) === showId);
            const startTime = selectedShow?.startTime || '';
            const screenName = selectedShow?.screen?.name || (typeof selectedShow?.screen === 'string' ? selectedShow.screen : '') || '1';
            const movieLanguage = selectedShow?.movieLanguage || '';
            const format = selectedShow?.format || '2D';
            const subtitles = selectedShow?.subtitles || '';

            // Persist movie details for the booking flow
            sessionStorage.setItem('booking_movie_title', movie?.title || '');
            sessionStorage.setItem('booking_movie_poster', movie?.portraitPosterUrl || movie?.posterUrl || '');
            sessionStorage.setItem('booking_show_date', selectedDate);
            sessionStorage.setItem('booking_show_time', startTime);
            sessionStorage.setItem('booking_screen_name', screenName);
            sessionStorage.setItem('booking_theater_name', theater?.name || '');
            sessionStorage.setItem('booking_movie_language', movieLanguage);
            sessionStorage.setItem('booking_movie_format', format);
            sessionStorage.setItem('booking_movie_subtitles', subtitles);
            sessionStorage.setItem('booking_is_food_available', String(theater?.isFoodAndBeveragesAvailable ?? true));

            bookingSessionManager.startSession(showId, theater?.name || '', user?.id || user?._id);

            navigate(`/movie/${slug}/${theaterSlug}/seats`, {
                state: {
                    movieId: movie?.id || movie?._id,
                    movieTitle: movie?.title,
                    moviePoster: movie?.portraitPosterUrl || movie?.posterUrl,
                    theaterId: theater?.id || theater?._id,
                    theaterName: theater?.name,
                    date: selectedDate,
                    startTime: startTime
                }
            });
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
        <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-950 w-full max-w-[100vw] overflow-x-hidden font-roboto">
            <SEO
                title={`Select Theater - ${movie?.title} | XYNEMA`}
                description="Choose your preferred cinema theater and select your seats"
            />

            {/* Redesigned Minimalist Header & Movie Info - Matches Figma */}
            <div className="bg-white dark:bg-gray-900 pt-6 pb-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800 relative z-10 w-full">
                <div className="max-w-[80%] mx-auto flex items-start gap-4 md:gap-6">
                    {/* Simple Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-1 md:mt-2 p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 -ml-1"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 stroke-[1.5]" />
                    </button>

                    {/* Movie Details - Clean Stack */}
                    <div className="flex gap-5 md:gap-6 items-start w-full">
                        {/* Poster */}
                        <div className="w-[100px] md:w-[130px] shrink-0">
                            <img
                                src={movie?.portraitPosterUrl || movie?.posterUrl || movie?.PosterUrl || movie?.image}
                                alt={movie?.MovieName || movie?.movieName || movie?.title}
                                className="w-full rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                            />
                        </div>

                        {/* Details Stack */}
                        <div className="flex-1 space-y-1 pt-1 md:pt-2">
                            <h2 className="text-[22px] md:text-[28px] font-bold text-gray-900 dark:text-white leading-tight mb-2 md:mb-3">
                                {movie?.MovieName || movie?.movieName || movie?.title}
                            </h2>

                            <div className="flex items-center gap-2 flex-wrap pb-1">
                                {movie?.certification && (
                                    <div className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                            {movie.certification}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-[1.6] space-y-0.5 flex flex-col">
                                {(movie?.Genre || movie?.genre) && (
                                    <span>
                                        {Array.isArray(movie.Genre) ? movie.Genre.join(', ') : movie.genre || movie.Genre}
                                    </span>
                                )}
                                {(movie?.Duration || movie?.duration) && (
                                    <span>
                                        {typeof (movie.Duration || movie.duration) === 'string'
                                            ? (movie.Duration || movie.duration)
                                            : `${Math.floor(movie.duration / 60)}h ${String(movie.duration % 60)}m`}
                                    </span>
                                )}
                                <span>
                                    {movie?.language || 'Tamil'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">
                {/* Showtimes Section - Date Selector on Left */}
                <div className="mb-10">
                    <DateSelector
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        releaseDate={movie?.releaseDate}
                    />

                    {/* <div className="mt-8">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                            Showtimes for <span className="text-primary dark:text-primary/60">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) === new Date().toDateString() ? "Today" : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        </h2>
                    </div> */}
                </div>

                {/* Cinema List - Clean layout to match Figma */}
                <h2 className="text-[18px] font-medium text-gray-800 dark:text-gray-100 mb-5 px-1 mt-6">Available Theatres</h2>
                {sortedTheaters.length > 0 ? (
                    <div className="space-y-4">
                        {sortedTheaters.map((theater) => {
                            // Group shows by screenName and format within this theater
                            const groupedByScreen = (theater.filteredShows || []).reduce((acc, show) => {
                                const key = `${show.screenName || 'Screen'} - ${show.format || '2D'} - ${show.movieLanguage || ''} - ${show.subtitles || ''}`;
                                if (!acc[key]) {
                                    acc[key] = {
                                        screenName: show.screenName || 'Screen',
                                        format: show.format || '2D',
                                        movieLanguage: show.movieLanguage || '',
                                        subtitles: show.subtitles || '',
                                        shows: []
                                    };
                                }
                                acc[key].shows.push(show);
                                return acc;
                            }, {});

                            // Extract unique formats and languages for the theater headers
                            const availableFormats = [...new Set((theater.filteredShows || []).map(s => s.format))].filter(Boolean);
                            const availableLanguages = [...new Set((theater.filteredShows || []).map(s => s.movieLanguage))].filter(Boolean);

                            return (
                                <div key={theater.id || theater._id} className="bg-white dark:bg-gray-800 rounded-[10px] p-5 pb-6 border border-gray-200 dark:border-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                                    <div className="flex flex-col mb-4">
                                        <h3 className="text-[17px] font-medium text-[#333333] dark:text-white mb-2.5">
                                            {theater.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableFormats.map(fmt => (
                                                <span key={fmt} className="px-2.5 py-0.5 bg-white border border-primary/40 rounded-full text-[10px] font-medium text-primary uppercase">{fmt}</span>
                                            ))}
                                            {availableLanguages.map(lang => (
                                                <span key={lang} className="px-2.5 py-0.5 bg-white border border-primary/40 rounded-full text-[10px] font-medium text-primary uppercase">{lang}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {Object.values(groupedByScreen).map((group, gIdx) => (
                                        <div key={gIdx} className="mt-4">
                                            <div className="flex flex-wrap gap-3">
                                                {group.shows.map((show) => (
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
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
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
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
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
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => {
                                onSelect(opt.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${activeValue === opt.id ? 'text-primary' : 'text-gray-600 dark:text-gray-300'
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
        <div className="mb-10 w-full">
            <h2 className="text-[17px] text-gray-800 dark:text-gray-100 mb-4 px-1">Select Date</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
                {dates.map((date, index) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    const isSelected = dateStr === selectedDate;

                    let dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                    if (index === 0 && date.toDateString() === new Date().toDateString()) dayLabel = 'Today';
                    if (index === 1 && date.toDateString() === new Date(new Date().setDate(new Date().getDate() + 1)).toDateString()) dayLabel = 'Tomorrow';

                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                    const dayNum = date.getDate();

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onDateSelect(dateStr)}
                            className={`
                                flex-shrink-0 min-w-[85px] py-1.5 px-3 rounded flex flex-col items-center justify-center transition-all duration-200
                                ${isSelected
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            <span className={`text-[13px] ${isSelected ? 'text-white' : 'text-gray-500'} mb-0.5`}>
                                {dayLabel}
                            </span>
                            <span className={`text-[13px] ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                {monthName} {dayNum}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ShowtimeCard = ({ show, theater, onSelect }) => {
    // Exact response data mapping
    const total = show.totalSeats || 0;
    const available = show.availableSeats || 0;
    const booked = show.bookedSeats || 0;

    // Status logic based on actual availability
    const occupancyPercent = total > 0 ? ((total - available) / total) * 100 : 0;
    const isFull = available <= 0;

    let statusText = 'Available';
    let statusColor = 'text-[#2eac78]'; // Green from Figma

    if (isFull) {
        statusText = 'Filled';
        statusColor = 'text-gray-400';
    } else if (available < (total * 0.1) || available <= 10) {
        statusText = 'Fast Filling';
        statusColor = 'text-[#f59e0b]'; // Orange/amber
    }

    return (
        <button
            onClick={isFull ? null : onSelect}
            disabled={isFull}
            className={`
                group bg-white dark:bg-gray-800 rounded-[5px] border border-gray-200 dark:border-gray-700 py-2.5 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-gray-300 dark:hover:border-gray-500 transition-colors text-center flex flex-col items-center justify-center min-w-[95px]
                ${isFull ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-70' : ''}
            `}
        >
            <span className={`text-[12px] font-medium mb-1.5 ${isFull ? 'text-gray-400' : 'text-[#333333] dark:text-white'}`}>
                {show.startTime}
            </span>
            <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 py-[1px] rounded-[3px] border border-[#a1a1aa] dark:border-gray-500 text-[#52525b] dark:text-gray-300 font-medium leading-none uppercase">
                    {show.format || '2D'}
                </span>
                <span className={`text-[9px] font-medium pl-0.5 leading-none ${statusColor}`}>
                    {statusText}
                </span>
            </div>
        </button>
    );
};

export default TheaterSelectionPage;
