import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Heart, Info, Clock, CheckCircle2, ChevronRight, Filter, Film, Ticket } from 'lucide-react';
import SEO from '../components/SEO';
import { getTheatersByCity, getTheaterDetails } from '../services/movieService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import bookingSessionManager from '../utils/bookingSessionManager';
import ErrorState from '../components/ErrorState';
import LoadingScreen from '../components/LoadingScreen';

const TheaterDetailsPage = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const city = searchParams.get('city') || localStorage.getItem('selected_city') || 'Kochi';

    const [theater, setTheater] = useState(location.state?.theater || null);
    const [maxShowEndDate] = useState(() => {
        const d = location.state?.maxShowEndDate;
        if (d) {
            const parsed = new Date(d);
            parsed.setHours(23, 59, 59, 999);
            console.log(`📅 Theater maxShowEndDate from nav state: ${parsed.toISOString()}`);
            return parsed;
        }
        return null;
    });
    const [loading, setLoading] = useState(!theater);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPriceRange, setSelectedPriceRange] = useState('All');
    const [selectedTiming, setSelectedTiming] = useState('All');
    const { user, openLogin } = useAuth();

    const fetchTheaterInfo = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Try fetching directly by ID (slug often contains the ID)
            const theaterData = await getTheaterDetails(slug, selectedDate);

            if (theaterData) {
                setTheater(prev => {
                    if (!prev) return theaterData;
                    // Merge: preserve theater metadata (name, address) from initial load
                    return {
                        ...prev,
                        ...theaterData,
                        name: (theaterData.name && theaterData.name !== 'Unknown Theatre') ? theaterData.name : prev.name,
                        address: theaterData.address || prev.address,
                        city: theaterData.city || prev.city
                    };
                });
            } else {
                // 2. Fallback: Search among theaters in the city if ID fetch fails
                // This handles cases where slug might be name-based but not the ID
                const theaters = await getTheatersByCity(city);
                const slugLower = slug?.toLowerCase();
                const foundTheater = theaters.find(t =>
                    t.id === slug ||
                    (t.name && (
                        t.name.toLowerCase().replace(/\s+/g, '-').includes(slugLower) ||
                        slugLower.includes(t.name.toLowerCase().replace(/\s+/g, '-')) ||
                        t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(slugLower)
                    ))
                );

                if (foundTheater) {
                    // Fetch full details for the matched theater to get movies/shows
                    const fullDetails = await getTheaterDetails(foundTheater.id, selectedDate);
                    setTheater(fullDetails || foundTheater);
                } else {
                    throw new Error('Cinema not found in this city.');
                }
            }
        } catch (err) {
            console.error('Error fetching theater details:', err);
            setError(err.message || 'Could not load cinema details.');
        } finally {
            setLoading(false);
        }
    }, [slug, city, selectedDate]);

    useEffect(() => {
        fetchTheaterInfo();
    }, [fetchTheaterInfo]);

    const filteredMovies = useMemo(() => {
        if (!theater?.movies) return [];

        const parseTime = (timeStr) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            return parseInt(hours, 10);
        };

        const isTimeMatch = (timeStr, filter) => {
            if (filter === 'All') return true;
            const hours = parseTime(timeStr);
            if (filter === 'Morning') return hours >= 6 && hours < 12;
            if (filter === 'Afternoon') return hours >= 12 && hours < 16;
            if (filter === 'Evening') return hours >= 16 && hours < 21;
            if (filter === 'Night') return hours >= 21 || hours < 6;
            return true;
        };

        const isPriceMatch = (schedules, filter) => {
            if (filter === 'All') return true;
            return schedules.some(sched =>
                sched.pricing.some(p => {
                    const price = p.basePrice || p.price || 0;
                    if (filter === '0-200') return price <= 200;
                    if (filter === '200-400') return price > 200 && price <= 400;
                    if (filter === '400+') return price > 400;
                    return true;
                })
            );
        };

        return theater.movies.map(movie => {
            // Filter schedules that are valid for the selected date
            const validSchedules = movie.schedules.filter(sched => {
                const startDate = sched.showStartDate ? new Date(sched.showStartDate) : null;
                const endDate = sched.showEndDate ? new Date(sched.showEndDate) : null;
                const target = new Date(selectedDate);

                if (startDate) startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(23, 59, 59, 999);
                target.setHours(12, 0, 0, 0);

                const dateMatches = (!startDate || target >= startDate) && (!endDate || target <= endDate);
                if (!dateMatches) return false;

                // Check if any showtime in this schedule matches the timing filter
                const hasMatchingTime = sched.showTimes.some(time => isTimeMatch(time, selectedTiming));
                if (!hasMatchingTime) return false;

                // Price filter applied at movie level if it matches ANY schedule
                return true;
            });

            if (validSchedules.length === 0) return null;

            // Final check for price match across all valid schedules for this movie
            if (!isPriceMatch(validSchedules, selectedPriceRange)) return null;

            // Further filter the showTimes within each schedule to only show matching ones if timing filter is on
            const doubleFilteredSchedules = validSchedules.map(sched => ({
                ...sched,
                showTimes: sched.showTimes.filter(time => isTimeMatch(time, selectedTiming))
            })).filter(sched => sched.showTimes.length > 0);

            if (doubleFilteredSchedules.length === 0) return null;

            // Extract all shows from the doubleFilteredSchedules to keep it flat
            const shows = doubleFilteredSchedules.flatMap(sched =>
                (sched.shows || []).map(s => ({
                    ...s,
                    // Ensure format is legacy-compatible if missing on show
                    format: s.format || s.screen?.screenType || sched.format || '2D'
                }))
            );

            return { ...movie, schedules: doubleFilteredSchedules, allShows: shows };
        }).filter(Boolean);
    }, [theater, selectedDate, selectedTiming, selectedPriceRange]);

    if (loading) return <LoadingScreen message="Linking to Cinema..." />;
    if (error) return <ErrorState error={error} onRetry={fetchTheaterInfo} title="Cinema Link Interrupted" buttonText="Try Again" />;
    if (!theater) return <ErrorState error="Cinema not found" onRetry={() => navigate('/cinemas')} title="Not Found" />;

    const experiences = theater?.screens?.map(s => s.type || 'Standard')
        .filter((v, i, a) => a.indexOf(v) === i) || ['Standard'];

    // Aggregate facilities from screens + theater amenities
    let facilities = [
        ...(theater?.features || []),
        ...(theater?.amenities || []),
        ...(theater?.screens?.flatMap(s => s.facilities) || [])
    ];

    // Remove duplicates
    facilities = [...new Set(facilities)];

    // Fallback if absolutely no facilities found
    if (facilities.length === 0) {
        facilities = ['Dolby Atmos', 'Recliner Seats', 'F&B Service', 'Parking'];
    }

    const getFacilityIcon = (facility) => {
        const f = facility.toLowerCase();
        if (f.includes('atmos') || f.includes('sound')) return <Film className="w-3 h-3" />;
        if (f.includes('recliner') || f.includes('sofa')) return <Ticket className="w-3 h-3" />;
        if (f.includes('parking')) return <MapPin className="w-3 h-3" />;
        if (f.includes('food') || f.includes('f&b')) return <Info className="w-3 h-3" />;
        return <CheckCircle2 className="w-3 h-3" />;
    };

    const handleDirections = () => {
        let lat, lng;
        if (theater?.coordinates?.lat && theater?.coordinates?.lng) {
            lat = theater.coordinates.lat;
            lng = theater.coordinates.lng;
        } else if (Array.isArray(theater?.coordinates)) {
            [lng, lat] = theater.coordinates;
        } else if (theater?.location?.coordinates) {
            [lng, lat] = theater.location.coordinates;
        }

        if (lat && lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        } else {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${theater?.name} ${theater?.city}`)}`, '_blank');
        }
    };


    const handleShowSelection = (movie, sched, timeOrShow) => {
        if (!user) {
            openLogin(() => handleShowSelection(movie, sched, timeOrShow));
            return;
        }

        const show = typeof timeOrShow === 'object' ? timeOrShow : null;
        const time = show ? show.startTime : timeOrShow;
        const showId = show?.id || show?._id || show?.showId || sched.id;

        try {
            const movieSlug = movie.slug || movie.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const theaterSlug = theater.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            // Persist details for the booking flow
            sessionStorage.setItem('booking_movie_title', movie.name);
            sessionStorage.setItem('booking_movie_poster', movie.posterUrl);
            sessionStorage.setItem('booking_show_date', selectedDate);
            sessionStorage.setItem('booking_show_time', time);
            sessionStorage.setItem('booking_screen_name', show?.screen?.name || sched.screen?.name || '1');
            sessionStorage.setItem('booking_theater_name', theater.name);

            // Get language from schedule if available (array or string)
            const lang = Array.isArray(sched.movieLanguage) ? sched.movieLanguage[0] : (sched.movieLanguage || show?.movieLanguage || 'Malayalam');
            sessionStorage.setItem('booking_movie_language', lang);
            sessionStorage.setItem('booking_movie_format', show?.format || sched.format || '2D');
            sessionStorage.setItem('booking_is_food_available', 'true');

            bookingSessionManager.startSession(showId, theater.name, user?.id || user?._id);

            navigate(`/movie/${movieSlug}/${theaterSlug}/seats`, {
                state: {
                    movieId: movie.movieId,
                    movieTitle: movie.name,
                    moviePoster: movie.posterUrl,
                    theaterId: theater.id,
                    theaterName: theater.name,
                    date: selectedDate,
                    startTime: time
                }
            });
        } catch (err) {
            console.error('Navigation error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] font-sans text-gray-900 dark:text-gray-100 transition-colors">
            <SEO
                title={`${theater?.name} - Showtimes | XYNEMA`}
                description={`Book tickets for movies at ${theater?.name}, ${theater?.city}. View latest showtimes and prices.`}
            />

            {/* Theater Info Header */}
            <div className="bg-white dark:bg-[#1a1d24] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                    <Link
                        to="/cinemas"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Cinemas
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                    {theater?.name}
                                </h1>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                    <Heart className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-primary" />
                                </button>
                            </div>

                            <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 group cursor-pointer" onClick={handleDirections}>
                                <MapPin className="w-4 h-4 shrink-0 mt-1" />
                                <p className="text-sm leading-relaxed group-hover:text-primary transition-colors">
                                    {theater?.address || `${theater?.city}, Kerala`}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {theater?.amenities?.map((amenity, i) => (
                                    <span key={i} className="px-3 py-1 rounded-md bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                                        {getFacilityIcon(amenity)}
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <button
                                onClick={handleDirections}
                                className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                            >
                                <Info className="w-4 h-4" />
                                Cinema Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Date and Filter Bar */}
            <div className="sticky top-16 md:top-20 z-40 bg-white/95 dark:bg-[#1a1d24]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                        {/* Date Strip */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {[...Array(7)].map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() + i);
                                const dateStr = date.toISOString().split('T')[0];
                                const isSelected = selectedDate === dateStr;

                                // Disable dates beyond the max show end date from the browse API
                                const isAfterMax = maxShowEndDate && date > maxShowEndDate;

                                return (
                                    <button
                                        key={i}
                                        disabled={isAfterMax}
                                        onClick={() => !isAfterMax && setSelectedDate(dateStr)}
                                        className={`flex flex-col items-center justify-center min-w-[56px] h-[64px] rounded-lg transition-all ${
                                            isSelected
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : isAfterMax
                                                    ? 'bg-gray-100 dark:bg-gray-800/20 text-gray-300 dark:text-gray-700 cursor-not-allowed border border-transparent'
                                                    : 'bg-white dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800 text-gray-500 hover:border-primary/40'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold opacity-80">
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <span className="text-lg font-black mt-0.5">
                                            {date.getDate()}
                                        </span>
                                        <span className="text-[10px] font-bold opacity-80">
                                            {date.toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-3 pr-4 border-r border-gray-200 dark:border-gray-800">
                                <div className="text-[10px] font-black text-gray-400 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Available
                                </div>
                                <div className="text-[10px] font-black text-gray-400 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div> Fast Filling
                                </div>
                            </div>

                            <select
                                value={selectedPriceRange}
                                onChange={(e) => setSelectedPriceRange(e.target.value)}
                                className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">Filter Price</option>
                                <option value="0-200">0 - 200</option>
                                <option value="200-400">200 - 400</option>
                                <option value="400+">400+</option>
                            </select>

                            <select
                                value={selectedTiming}
                                onChange={(e) => setSelectedTiming(e.target.value)}
                                className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="All">Filter Timings</option>
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                                <option value="Evening">Evening</option>
                                <option value="Night">Night</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Movies and Showtimes List */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredMovies.length > 0 ? (
                    <div className="space-y-4">
                        {filteredMovies.map((movie) => (
                            <div key={movie.movieId} className="bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Left: Movie Info */}
                                    <div className="lg:w-1/3 flex gap-4">
                                        <button className="shrink-0 p-1 hover:scale-110 transition-transform">
                                            <Heart className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold uppercase tracking-tight text-gray-900 dark:text-white hover:text-primary transition-colors">
                                                    <Link to={`/movie/${movie.movieId}`}>{movie.name}</Link>
                                                </h3>
                                                <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded text-gray-400 uppercase">UA</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                                                <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Info</span>
                                                <span>•</span>
                                                <span className="text-primary/80">
                                                    {movie.schedules[0]?.movieLanguage?.join(', ') || movie.schedules[0]?.movieLanguage || 'Malayalam'}, {movie.schedules[0]?.format || '2D'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Showtimes Grid */}
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-4">
                                            {(movie.allShows || movie.schedules.flatMap(sched => sched.showTimes.map(t => ({ startTime: t, id: sched.id, format: sched.format, pricing: sched.pricing })))).map((show, idx) => (
                                                <div key={`${show.id}-${idx}`} className="group relative">
                                                    <button
                                                        onClick={() => handleShowSelection(movie, movie.schedules[0] || {}, show)}
                                                        className="w-[100px] h-[44px] flex flex-col items-center justify-center rounded-lg border border-green-200 dark:border-green-500/20 bg-white dark:bg-[#0f1115] hover:border-green-500 transition-all font-medium text-[13px] text-green-600 dark:text-green-500"
                                                    >
                                                        {show.startTime || show.showTime}
                                                        <span className="text-[9px] opacity-70 font-bold uppercase">{show.format || '2D'}</span>
                                                    </button>
                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white p-3 rounded-lg text-[11px] opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl">
                                                        <div className="space-y-2">
                                                            {(show.pricing || []).map((p, ix) => (
                                                                <div key={ix} className="flex justify-between items-center">
                                                                    <span className="capitalize">{p.label}:</span>
                                                                    <span className="font-bold">₹{p.basePrice || p.price}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-2 pt-2 border-t border-white/10 text-[9px] font-bold text-green-400 uppercase tracking-tighter">
                                                            Available
                                                        </div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/*<div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                            <div className="w-2 h-2 rounded-full border border-gray-200"></div> Cancellation Available
                                        </div>*/}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center bg-white dark:bg-[#1a1d24] rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                        <Film className="w-16 h-16 text-gray-200 dark:text-gray-800 mb-4" />
                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">No shows available</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs leading-relaxed">
                            There are no shows scheduled for this cinema on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
                        </p>
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className="mt-6 text-primary font-bold hover:underline"
                        >
                            Reset to today
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TheaterDetailsPage;
