import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Heart, Info, Clock, CheckCircle2, ChevronRight, Filter, Film, Ticket } from 'lucide-react';
import SEO from '../components/SEO';
import { getTheatersByCity, getTheaterDetails } from '../services/movieService';
import { useData } from '../context/DataContext';
import apiCacheManager from '../services/apiCacheManager';
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
            const theaterData = await apiCacheManager.getOrFetchTheaterDetails(slug, selectedDate, () => getTheaterDetails(slug, selectedDate));

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
                const theaters = await apiCacheManager.getOrFetchTheaters(city, () => getTheatersByCity(city));
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
                    const fullDetails = await apiCacheManager.getOrFetchTheaterDetails(foundTheater.id, selectedDate, () => getTheaterDetails(foundTheater.id, selectedDate));
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
            if (!timeStr) return 0;
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours, 10);
            minutes = parseInt(minutes, 10);
            if (hours === 12) hours = (modifier === 'AM' ? 0 : 12);
            else if (modifier === 'PM') hours += 12;
            return hours * 60 + minutes;
        };

        const isTimeMatch = (timeStr, filter) => {
            if (filter === 'All') return true;
            const totalMinutes = parseTime(timeStr);
            const hours = totalMinutes / 60;
            if (filter === 'Morning') return hours >= 6 && hours < 12;
            if (filter === 'Afternoon') return hours >= 12 && hours < 16;
            if (filter === 'Evening') return hours >= 16 && hours < 21;
            if (filter === 'Night') return hours >= 21 || hours < 6;
            return true;
        };

        const isPriceMatch = (pricing, filter) => {
            if (filter === 'All') return true;
            if (!pricing || !Array.isArray(pricing)) return true;
            return pricing.some(p => {
                const price = p.basePrice || p.price || 0;
                if (filter === '0-200') return price <= 200;
                if (filter === '200-400') return price > 200 && price <= 400;
                if (filter === '400+') return price > 400;
                return true;
            });
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
                return dateMatches;
            });

            if (validSchedules.length === 0) return null;

            // Further filter the showTimes and shows within each schedule to only show matching ones
            const doubleFilteredSchedules = validSchedules.map(sched => {
                const filteredTimes = sched.showTimes.filter(time =>
                    isTimeMatch(time, selectedTiming) && isPriceMatch(sched.pricing, selectedPriceRange)
                );

                const filteredShows = (sched.shows || []).filter(s => {
                    const time = s.startTime || s.showTime;
                    const pricing = s.pricing || sched.pricing;
                    return isTimeMatch(time, selectedTiming) && isPriceMatch(pricing, selectedPriceRange);
                });

                return {
                    ...sched,
                    showTimes: filteredTimes,
                    shows: filteredShows
                };
            }).filter(sched => sched.showTimes.length > 0 || (sched.shows && sched.shows.length > 0));

            if (doubleFilteredSchedules.length === 0) return null;

            // Extract all shows to keep it flat for the UI
            const allShows = doubleFilteredSchedules.flatMap(sched => {
                const baseShows = (sched.shows && sched.shows.length > 0)
                    ? sched.shows
                    : sched.showTimes.map(t => ({
                        startTime: t,
                        id: sched.id,
                        format: sched.format,
                        pricing: sched.pricing,
                        screen: sched.screen
                    }));

                return baseShows.map(s => {
                    // Derive pricing from screen seatClasses if not directly available on show/schedule
                    let showPricing = s.pricing || sched.pricing || [];
                    if (showPricing.length === 0 && s.screen?.seatClasses?.length > 0) {
                        showPricing = s.screen.seatClasses.map(sc => ({
                            label: sc.name || sc.label,
                            basePrice: sc.price || sc.basePrice,
                            price: sc.price || sc.basePrice,
                            id: sc.id || sc._id
                        }));
                    }

                    const totalSeats = s.totalSeats || s.screen?.totalSeats || s.screen?.capacity || sched.screenDetails?.totalSeats || 0;
                    const availableSeats = s.availableSeats ?? (totalSeats - (s.bookedSeats ?? 0));

                    const rawLang = s.movieLanguage || sched.movieLanguage || movie.language;
                    const displayLang = Array.isArray(rawLang) ? rawLang[0] : (typeof rawLang === 'string' ? rawLang.split(',')[0] : rawLang);

                    return {
                        ...s,
                        format: s.format || s.screen?.screenType || sched.screen?.screenType || sched.format || '2D',
                        language: displayLang,
                        availableSeats: availableSeats,
                        totalSeats: totalSeats,
                        pricing: showPricing,
                        bookedSeats: s.bookedSeats ?? (totalSeats - availableSeats)
                    };
                });
            });

            if (allShows.length === 0) return null;

            // Sort shows by time ascending
            const sortedShows = [...allShows].sort((a, b) => {
                return parseTime(a.startTime || a.showTime) - parseTime(b.startTime || b.showTime);
            });

            return { ...movie, schedules: doubleFilteredSchedules, allShows: sortedShows };
        }).filter(Boolean);
    }, [theater, selectedDate, selectedTiming, selectedPriceRange]);


    const experiences = useMemo(() => {
        if (!theater?.screens) return ['Standard'];
        return [...new Set(theater.screens.map(s => s.type || 'Standard'))];
    }, [theater]);

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
            const posterUrlStr = movie.posterUrl?.url || movie.posterUrl || '';
            const landscapeUrlStr = movie.landscapePosterUrl?.url || movie.landscapePosterUrl || movie.landscape_poster?.url || movie.landscape_poster || '';
            sessionStorage.setItem('booking_show_id', showId);
            sessionStorage.setItem('booking_theater_id', theater.id);
            sessionStorage.setItem('booking_movie_id', movie.movieId || movie.id || movie._id || '');
            sessionStorage.setItem('booking_movie_title', movie.name);
            sessionStorage.setItem('booking_movie_poster', posterUrlStr);
            sessionStorage.setItem('booking_movie_landscape_poster', landscapeUrlStr);
            sessionStorage.setItem('booking_show_date', selectedDate);
            sessionStorage.setItem('booking_show_time', time);
            sessionStorage.setItem('booking_screen_name', show?.screen?.name || sched.screen?.name || '1');
            sessionStorage.setItem('booking_theater_name', theater.name);

            // Get language from schedule if available (array or string)
            const lang = Array.isArray(sched.movieLanguage) ? sched.movieLanguage[0] : (sched.movieLanguage || show?.movieLanguage || 'Malayalam');
            sessionStorage.setItem('booking_movie_language', lang);
            sessionStorage.setItem('booking_movie_format', show?.format || sched.format || '2D');
            sessionStorage.setItem('booking_is_food_available', String(theater.isFoodAndBeveragesAvailable ?? true));

            bookingSessionManager.startSession(showId, theater.name, user?.id || user?._id);

            navigate(`/movie/${movieSlug}/${theaterSlug}/seats`, {
                state: {
                    movieId: movie.movieId,
                    movieTitle: movie.name,
                    moviePoster: movie.posterUrl?.url || movie.posterUrl,
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

    if (loading) return <LoadingScreen message="Linking to Cinema..." />;
    if (error) return <ErrorState error={error} onRetry={fetchTheaterInfo} title="Cinema Link Interrupted" buttonText="Try Again" />;
    if (!theater) return <ErrorState error="Cinema not found" onRetry={() => navigate('/cinemas')} title="Not Found" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] font-sans text-gray-900 dark:text-gray-100 transition-colors">
            <SEO
                title={`${theater?.name} - Showtimes | XYNEMA`}
                description={`Book tickets for movies at ${theater?.name}, ${theater?.city}. View latest showtimes and prices.`}
            />

            {/* Theater Info Header */}
            <div className="bg-white dark:bg-[#1a1d24] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-10">
                    <Link
                        to="/cinemas"
                        className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-4 md:mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Cinemas
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="flex items-center justify-between md:justify-start gap-3 mb-2">
                                <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                                    {theater?.name}
                                </h1>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors shrink-0">
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

                        <div className="flex items-center md:items-end md:gap-3 mt-1 md:mt-0">
                            <button
                                onClick={handleDirections}
                                className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm hover:underline"
                            >
                                <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                Location Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Date and Filter Bar */}
            <div className="sticky top-16 md:top-20 z-40 bg-white/95 dark:bg-[#1a1d24]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 py-3 md:py-4">
                        {/* Date Strip */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
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
                                        className={`flex flex-col items-center justify-center min-w-[50px] md:min-w-[56px] h-[56px] md:h-[64px] rounded-lg transition-all ${isSelected
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


                        {/* Filters Container - simplified for mobile */}
                        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide md:overflow-visible">
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
                                className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
                            >
                                <option value="All">Price</option>
                                <option value="0-200">0 - 200</option>
                                <option value="200-400">200 - 400</option>
                                <option value="400+">400+</option>
                            </select>

                            <select
                                value={selectedTiming}
                                onChange={(e) => setSelectedTiming(e.target.value)}
                                className="bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
                            >
                                <option value="All">Timings</option>
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
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
                {filteredMovies.length > 0 ? (
                    <div className="space-y-4">
                        {filteredMovies.map((movie) => (
                            <div key={movie.movieId} className="bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 shadow-sm">
                                <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
                                    {/* Left: Movie Info */}
                                    <div className="lg:w-1/3 flex gap-4">
                                        {/*<button className="shrink-0 pt-0.5 hover:scale-110 transition-transform">
                                            <Heart className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                        </button>*/}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <h3 className="text-sm md:text-lg font-medium tracking-tight text-gray-900 dark:text-white leading-tight">
                                                    <Link to={`/movie/${movie.movieId}`}>{movie.name}</Link>
                                                </h3>
                                                {movie.certification && (
                                                    <span className="shrink-0 text-[8px] md:text-[10px] font-black px-1.2 py-0.5 border border-gray-200 dark:border-gray-700 rounded text-gray-400 uppercase">
                                                        {movie.certification}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wide flex-wrap">
                                                <Link to={`/movie/${movie.movieId}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                                    <Info className="w-2.5 h-2.5" /> Info
                                                </Link>
                                                <span className="opacity-50">•</span>
                                                <span className="text-primary/80">
                                                    {movie.schedules[0]?.movieLanguage?.join(', ') || movie.schedules[0]?.movieLanguage || 'Malayalam'}, {movie.schedules[0]?.format || '2D'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Showtimes Grid grouped by Language */}
                                    <div className="flex-1">
                                        <div className="space-y-6">
                                            {(() => {
                                                const showsByLang = (movie.allShows || []).reduce((acc, show) => {
                                                    const lang = show.language;
                                                    if (!acc[lang]) acc[lang] = [];
                                                    acc[lang].push(show);
                                                    return acc;
                                                }, {});

                                                return Object.entries(showsByLang).map(([lang, shows], langIdx) => (
                                                    <div key={langIdx} className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{lang}</span>
                                                            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800/50"></div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-3 md:gap-4">
                                                            {shows.map((show, idx) => {
                                                                const isSoldOut = show.availableSeats === 0;
                                                                const isFastFilling = !isSoldOut && show.availableSeats < (show.totalSeats * 0.2);
                                                                const statusColor = isSoldOut ? 'text-gray-400 border-gray-200 bg-gray-50' : isFastFilling ? 'text-orange-500 border-orange-200' : 'text-green-600 border-green-200';
                                                                const hoverColor = isSoldOut ? '' : isFastFilling ? 'hover:border-orange-500' : 'hover:border-green-500';

                                                                return (
                                                                    <div key={`${show.id}-${idx}`} className="group relative">
                                                                        <button
                                                                            disabled={isSoldOut}
                                                                            onClick={() => handleShowSelection(movie, movie.schedules[0] || {}, show)}
                                                                            className={`w-[90px] md:w-[100px] h-[40px] md:h-[44px] flex flex-col items-center justify-center rounded-lg border bg-white dark:bg-[#0f1115] transition-all font-medium text-[11px] md:text-[13px] shadow-sm ${statusColor} ${hoverColor} ${isSoldOut ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                                                        >
                                                                            {show.startTime || show.showTime}
                                                                            <span className="text-[7.5px] md:text-[9px] opacity-70 font-bold uppercase">{show.format || '2D'}</span>
                                                                        </button>
                                                                        {/* Tooltip on hover */}
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-lg text-[11px] opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-2xl border border-white/10 translate-y-2 group-hover:translate-y-0">
                                                                            <div className="space-y-2">
                                                                                {(show.pricing || []).map((p, ix) => (
                                                                                    <div key={ix} className="flex justify-between items-center">
                                                                                        <span className="capitalize opacity-80">{p.label}:</span>
                                                                                        <span className="font-bold">₹{p.basePrice || p.price}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <div className={`mt-2 pt-2 border-t border-white/10 text-[9px] font-bold uppercase tracking-tighter ${isSoldOut ? 'text-gray-400' : isFastFilling ? 'text-orange-400' : 'text-green-400'}`}>
                                                                                {isSoldOut ? 'Sold Out' : isFastFilling ? 'Fast Filling' : 'Available'}
                                                                            </div>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-800"></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
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
