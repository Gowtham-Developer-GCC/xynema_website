import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Film, Loader } from 'lucide-react';
import SEO from '../components/SEO';
import { getUpcomingMovies } from '../services/movieService';
import ErrorState from '../components/ErrorState';

const TheaterDetailsPage = () => {
    const { id, slug } = useParams(); // Route uses :slug or :id depending on version
    const theaterIdentifier = id || slug;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const city = searchParams.get('city') || localStorage.getItem('selected_city') || '';

    const [theater, setTheater] = useState(location.state?.theater || null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(!theater);
    const [moviesLoading, setMoviesLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedFormat, setSelectedFormat] = useState('All');

    const fetchTheaterInfo = useCallback(async () => {
        if (theater) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await getUpcomingMovies(city);
            // Identifier can be ID or Name/Slug. Since API returns list, we try to match by ID or check if slug matches name?
            // Usually theater slug logic might differ. For now, let's assume if it's an ID match it.
            // If it's a slug, we might need a better matching strategy if slug isn't in the object.

            const foundTheater = res.theaters.find(t =>
                String(t.id) === String(theaterIdentifier) ||
                String(t._id) === String(theaterIdentifier)
            );

            if (foundTheater) {
                setTheater(foundTheater);
            } else {
                throw new Error('Theater not found in this city.');
            }
        } catch (err) {
            console.error('Error fetching theater details:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [theaterIdentifier, city, theater]);

    const fetchMoviesAtTheater = useCallback(async () => {
        try {
            setMoviesLoading(true);
            const res = await getUpcomingMovies(city);
            const filteredMovies = res.movies.filter(movie =>
                movie.theaters.some(t => String(t.id) === String(theaterIdentifier) || String(t._id) === String(theaterIdentifier))
            );
            setMovies(filteredMovies);
        } catch (err) {
            console.error('Error fetching movies at theater:', err);
        } finally {
            setMoviesLoading(false);
        }
    }, [theaterIdentifier, city]);

    useEffect(() => {
        fetchTheaterInfo();
        fetchMoviesAtTheater();
    }, [fetchTheaterInfo, fetchMoviesAtTheater, selectedDate]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={fetchTheaterInfo} title="Cinema Link Failed" buttonText="Restore Session" />;

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
        // Attempt to extract coordinates from various formats
        let lat, lng;
        if (theater?.coordinates?.lat && theater?.coordinates?.lng) {
            lat = theater.coordinates.lat;
            lng = theater.coordinates.lng;
        } else if (Array.isArray(theater?.coordinates)) {
            [lng, lat] = theater.coordinates; // GeoJSON format [lng, lat]
        } else if (typeof theater?.location === 'string' && theater.location.includes('[') && theater.location.includes(']')) {
            // Handle the weird stringified format from sample response
            const match = theater.location.match(/\[\s*([\d.]+),\s*([\d.]+)\s*\]/);
            if (match) {
                lng = match[1];
                lat = match[2];
            }
        }

        if (lat && lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        } else {
            // Fallback to name search
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${theater?.name} ${theater?.city}`)}`, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            <SEO
                title={`${theater?.name} - Cinema Details | XYNEMA`}
                description={`View movie showtimes and facilities at ${theater?.name}, ${theater?.city}.`}
            />

            {/* Simple Minimal Header */}
            <div className="border-b border-gray-100 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                                    {theater?.name}
                                </h1>
                                <div
                                    className="flex items-center gap-2 text-gray-500 mt-2 cursor-pointer hover:text-[#00296b] transition-colors w-fit"
                                    onClick={handleDirections}
                                >
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="text-sm font-medium">{theater?.city || 'Location unavailable'}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {experiences.map((exp, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                                        {exp}
                                    </span>
                                ))}
                                {theater?.rating > 0 && (
                                    <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100 flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>{theater.rating}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleDirections}
                                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                            >
                                Get Directions
                            </button>
                        </div>
                    </div>

                    {/* Facilities - Clean Row */}
                    {facilities.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Amenities</h3>
                            <div className="flex flex-wrap gap-x-6 gap-y-3">
                                {facilities.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-gray-600">
                                        <div className="text-gray-400">
                                            {getFacilityIcon(f)}
                                        </div>
                                        <span className="text-sm font-medium">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Date Selector - Minimal Sticky */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
                        {[...Array(7)].map((_, i) => {
                            const minDate = new Date();
                            const date = new Date(minDate);
                            date.setDate(minDate.getDate() + i);
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDate === dateStr;

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`flex flex-col items-center justify-center min-w-[60px] h-[64px] rounded-xl transition-all border ${isSelected
                                        ? 'bg-[#00296b] text-white border-[#00296b] shadow-md shadow-blue-900/20'
                                        : 'bg-white text-gray-500 border-transparent hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <span className="text-lg font-bold leading-none mt-1">
                                        {date.getDate()}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-gray-900">Now Showing</h2>

                    {/* Format Filter */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        {['All', '2D', '3D', 'IMAX'].map((format) => (
                            <button
                                key={format}
                                onClick={() => setSelectedFormat(format)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${selectedFormat === format
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {format}
                            </button>
                        ))}
                    </div>
                </div>

                {moviesLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-4">
                        <Loader className="w-8 h-8 text-[#00296b] animate-spin" />
                        <p className="text-sm font-medium text-gray-400">Loading schedules...</p>
                    </div>
                ) : movies.length > 0 ? (
                    <div className="space-y-6">
                        {movies.map((movie) => {
                            const theaterInMovie = movie.theaters.find(t => String(t.id) === String(theaterId));
                            const allShowsAtDate = theaterInMovie?.screens?.flatMap(screen =>
                                screen.shows.filter(show => {
                                    const showDate = show.date || show.showDate;
                                    const dateMatch = showDate?.split('T')[0] === selectedDate;
                                    const formatMatch = selectedFormat === 'All' || show.format === selectedFormat;
                                    return dateMatch && formatMatch;
                                }).map(s => ({ ...s, screenName: screen.name, screenType: screen.type }))
                            ) || [];

                            if (allShowsAtDate.length === 0 && selectedFormat !== 'All') return null;

                            return (
                                <div key={movie.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Movie Poster & Info */}
                                        <div className="flex md:flex-col gap-4 md:w-48 shrink-0">
                                            <div
                                                className="relative w-24 md:w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                                                onClick={() => navigate(`/movie/${movie.slug || movie.id}`)}
                                            >
                                                <img
                                                    src={movie.posterUrl}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 md:hidden">
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{movie.title}</h3>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {movie.language} • {movie.genre?.split(',')[0]}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Info & Showtimes */}
                                        <div className="flex-1">
                                            <div className="hidden md:block mb-6">
                                                <h3
                                                    className="text-xl font-bold text-gray-900 cursor-pointer hover:text-[#00296b] transition-colors w-fit"
                                                    onClick={() => navigate(`/movie/${movie.slug || movie.id}`)}
                                                >
                                                    {movie.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    <span className="px-2 py-0.5 border border-gray-200 rounded text-gray-600 font-bold">{movie.certification || 'U/A'}</span>
                                                    <span>{movie.language}</span>
                                                    <span>•</span>
                                                    <span>{movie.genre?.split(',').slice(0, 2).join(', ')}</span>
                                                    <span>•</span>
                                                    <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                                                </div>
                                            </div>

                                            {allShowsAtDate.length > 0 ? (
                                                <div className="flex flex-wrap gap-3">
                                                    {allShowsAtDate
                                                        .sort((a, b) => new Date(`1970/01/01 ${a.startTime || a.showTime}`) - new Date(`1970/01/01 ${b.startTime || b.showTime}`))
                                                        .map((show) => (
                                                            <button
                                                                key={show.id || show._id}
                                                                onClick={() => navigate(`/seats?movieId=${movie.id}&theaterId=${theaterId}&showId=${show.id || show._id}&date=${selectedDate}`)}
                                                                className={`
                                                                    flex flex-col items-center justify-center min-w-[90px] py-2 px-3 rounded-lg border transition-all text-sm
                                                                    ${show.availableSeats > 0
                                                                        ? 'bg-white border-green-200 hover:border-green-500 hover:shadow-sm'
                                                                        : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                                                    }
                                                                `}
                                                            >
                                                                <span className={`font-bold ${show.availableSeats > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                                                    {show.startTime || show.showTime}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                                    {show.screenType || 'Standard'}
                                                                </span>
                                                            </button>
                                                        ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-xs font-medium text-gray-400">No shows available for this filter</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Film className="w-6 h-6 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Shows Available</h3>
                        <p className="text-gray-500 text-sm mt-1">Try selecting a different date</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen bg-whiteSmoke flex flex-col items-center justify-center space-y-12 p-8 text-center font-display">
        <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-[40px] border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-[40px] border-4 border-transparent animate-spin" style={{ borderTopColor: 'var(--xynemaRose, #00296b)', borderRadius: '40px' }} />
        </div>
        <div className="space-y-4">
            <p className="text-xynemaRose font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Syncing Cinema Link</p>
            <h2 className="text-5xl font-black text-gray-200 uppercase tracking-tighter">XYNEMA</h2>
        </div>
    </div>
);

// ErrorState removed - imported from components

export default TheaterDetailsPage;
