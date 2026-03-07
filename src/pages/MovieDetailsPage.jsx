import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Clock, ThumbsDown, MapPin, Share2, Heart, AlertCircle, Loader, Sparkles, Play, User, TrendingUp, ChevronRight, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleInterest, addMovieReview, getNotNowMovies, getUpcomingMovies, getHighlightsMovies } from '../services/movieService';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import NotFoundState from '../components/NotFoundState';
import ErrorState from '../components/ErrorState';
import { designSystem } from '../config/design-system';
import { buttonStyles, cardStyles, animationStyles } from '../styles/components';
import { useData } from '../context/DataContext';
import { optimizeImage } from '../utils/helpers';
import { getMovieMerchandise } from '../services/storeService';
import StoreCard from '../components/StoreCard';
import MovieCard from '../components/MovieCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ShoppingBag } from 'lucide-react';

const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
};

const getAvatarColor = (name) => {
    const colors = [
        'bg-indigo-500',
        'bg-xynemaRose',
        'bg-amber-500',
        'bg-emerald-500',
        'bg-blue-500',
        'bg-violet-500',
        'bg-cyan-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-teal-500'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const MovieDetailsPage = () => {
    let { idOrSlug } = useParams();
    const location = useLocation();

    // Fallback: manually parse path if useParams fails (e.g. some router edge cases)
    if (!idOrSlug) {
        const pathParts = location.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'movie') {
            idOrSlug = pathParts[2];
        }
    }
    const navigate = useNavigate();
    const { user, isAuthenticated, openLogin } = useAuth();
    const { movies, latestMovies, upcomingMovies, loading: contextLoading, getMovieById, toggleInterestOptimistic, getInterestOffset, interestedMovieIds } = useData();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState('2D');
    const [showFullCast, setShowFullCast] = useState(false);
    const [showFullCrew, setShowFullCrew] = useState(false);
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
            return [];
        }
    });


    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [merchandise, setMerchandise] = useState([]);
    const [merchLoading, setMerchLoading] = useState(true);

    useEffect(() => {
        const fetchMerch = async () => {
            if (movie) {
                try {
                    const data = await getMovieMerchandise(movie.id || movie.slug);
                    setMerchandise(data);
                } catch (err) {
                    console.error('Error fetching merchandise:', err);
                } finally {
                    setMerchLoading(false);
                }
            }
        };
        fetchMerch();
    }, [movie]);

    useEffect(() => {
        if (!contextLoading) {
            const foundMovie = getMovieById(idOrSlug);

            if (foundMovie) {
                setMovie(foundMovie);
                setLoading(false);
            } else {
                setError(new Error('Movie not found'));
                setLoading(false);
            }
        }
    }, [idOrSlug, movies, latestMovies, contextLoading]);

    const toggleFavorite = () => {
        setFavorites(prev => {
            const currentId = movie?.id || idOrSlug;
            const updated = prev.includes(currentId)
                ? prev.filter(mid => mid !== currentId)
                : [...prev, currentId];
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
        });
    };

    const handleBookingClick = () => {
        if (movie.isAvailable) {
            navigate(`/movie/${movie.slug}/theaters`);
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: movie.title,
                    text: `Check out ${movie.title} on XYNEMA!`,
                    url: window.location.href,
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleWatchTrailer = () => {
        if (movie.trailerUrl) {
            window.open(movie.trailerUrl, '_blank');
        }
    };

    const handleInterest = () => {
        if (!isAuthenticated) {
            openLogin();
            return;
        }
        toggleInterestOptimistic(movie.id);
    };

    if (!idOrSlug || (loading && !movie)) return <LoadingScreen message="Fetching Movie" />;
    if (loading) return <LoadingScreen message="Fetching Movie" />;
    if (error) return <NotFoundState title="Movie Not Found" message="We couldn't find the movie you're looking for." />;
    if (!movie) return <NotFoundState title="Movie Not Found" message="We couldn't find the movie you're looking for." />;

    const isFavorite = favorites.includes(movie.id);
    const hasInterested = interestedMovieIds.has(movie.id);
    const interestOffset = getInterestOffset(movie.id);

    return (
        <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title={`${movie.title} - Book Tickets | XYNEMA`}
                description={movie.description || `Watch ${movie.title} in cinemas near you`}
            />

            {/* Hero Section with Sophisticated Banner */}
            <div className="relative w-full overflow-hidden bg-black min-h-[60vh] md:min-h-[70vh] flex items-center pt-24 pb-16">
                {/* Background Image with Multi-layered Masking */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center md:bg-fixed"
                        style={{
                            backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
                            filter: 'blur( 0px)',
                            opacity: 1
                        }}
                    />
                    {/* <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" /> */}
                    {/* <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" /> */}
                </div>

                <div className="relative z-10 max-w-[80%] mx-auto px-4 md:px-8 w-full mt-4">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-14 items-center md:items-start text-white p-6 md:p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-saturate-150 relative overflow-hidden">
                        {/* Soft Highlight for Glass Edge */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>

                        {/* Premium Movie Poster */}
                        <div className="relative w-56 md:w-[260px] flex-shrink-0 animate-fade-in shadow-2xl">
                            <div className="aspect-[2/3] rounded-xl overflow-hidden relative border border-white/20">
                                <img
                                    src={optimizeImage(movie.posterUrl, { width: 600, quality: 95 })}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 inset-x-0 h-10 bg-black/80 backdrop-blur-md flex items-center justify-center pointer-events-none">
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                                        {movie.isAvailable ? 'In Cinemas' : `Releasing on ${new Date(movie.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Soon'}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Movie Details Content Area */}
                        <div className="flex-1 flex flex-col gap-5 text-center md:text-left max-w-3xl pt-2 md:pt-4">
                            {/* Title Area */}
                            <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-black tracking-tight leading-tight text-white drop-shadow-2xl">
                                {movie.title}
                            </h1>

                            {/* Metadata Line */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm md:text-base font-medium text-white/90">
                                {movie.isAvailable && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#333545] rounded-md text-white font-bold shadow-md">
                                        <Star className="w-5 h-5 fill-rose-500 text-rose-500" />
                                        <span>{movie.rating ? `${movie.rating}/10` : 'New'}</span>
                                        {movie.voteCount > 0 && (
                                            <span className="text-xs font-normal text-white/70 ml-1">
                                                {movie.voteCount > 1000 ? `${(movie.voteCount / 1000).toFixed(1)}K Votes` : `${movie.voteCount} Votes`}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {movie.releaseDate && (
                                    <>
                                        <span className="font-semibold">{new Date(movie.releaseDate).getFullYear()}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                    </>
                                )}
                                {movie.duration > 0 && (
                                    <>
                                        <span className="font-semibold">{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                    </>
                                )}
                                {movie.certification && (
                                    <span className="bg-white/10 px-2 py-0.5 rounded border border-white/50 text-xs font-bold tracking-wider">{movie.certification}</span>
                                )}
                            </div>

                            {/* Genre Pills */}
                            {movie.genre && (
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
                                    {movie.genre.split(',').map((g, i) => (
                                        <span key={i} className="px-4 py-1.5 rounded-full border border-white/30 text-xs font-semibold hover:bg-white/10 transition-colors cursor-default backdrop-blur-sm bg-black/20 text-white/90">
                                            {g.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Synopsis */}
                            <p className="text-sm md:text-base text-white/90 leading-relaxed font-normal mt-4 max-w-2xl">
                                {movie.description}
                            </p>

                            {/* Format & Language */}
                            <div className="space-y-3 mt-4">
                                {movie.format?.length > 0 && (
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <span className="text-white/60 font-semibold text-xs md:text-sm tracking-wide">Format:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {movie.format.map((f, i) => (
                                                <span key={i} className="px-2.5 py-1 bg-white text-black text-[11px] md:text-xs font-black uppercase rounded shadow-sm">
                                                    {f.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {movie.language && (
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <span className="text-white/60 font-semibold text-xs md:text-sm tracking-wide">Language:</span>
                                        <span className="font-semibold text-white/90 text-sm md:text-base">
                                            {movie.language}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* CTAs */}
                            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                                {movie.trailerUrl && (
                                    <button
                                        onClick={handleWatchTrailer}
                                        className="w-full sm:w-[180px] px-8 py-3.5 rounded-lg border border-white bg-white/10 backdrop-blur-sm text-white font-bold tracking-wide hover:bg-white/20 transition-all text-center shadow-lg active:scale-95"
                                    >
                                        Watch trailer
                                    </button>
                                )}
                                <button
                                    onClick={handleBookingClick}
                                    disabled={!movie.isAvailable}
                                    className={`w-full sm:w-[350px] px-8 py-3.5 rounded-lg font-bold tracking-wide transition-all text-center shadow-lg active:scale-95 ${movie.isAvailable
                                        ? 'bg-[#F84464] hover:bg-[#e03150] text-white border-transparent'
                                        : 'bg-gray-600 text-white/50 cursor-not-allowed border-transparent'
                                        }`}
                                >
                                    {movie.isAvailable ? 'Book tickets' : 'Coming Soon'}
                                </button>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-center mt-4 sm:mt-0">
                                    <button
                                        onClick={toggleFavorite}
                                        className={`flex items-center justify-center w-12 h-12 rounded-lg border transition-all active:scale-95 shadow-md ${isFavorite
                                            ? 'bg-white border-white text-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.2)]'
                                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                            }`}
                                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center justify-center w-12 h-12 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 shadow-md"
                                        title="Share movie"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className={`grid grid-cols-1 gap-8 ${movie.offers?.length > 0 ? 'lg:grid-cols-12' : 'lg:grid-cols-1'}`}>
                    {/* Left Column */}
                    <div className={`${movie.offers?.length > 0 ? 'lg:col-span-8' : 'w-full'} space-y-10 md:space-y-14`}>
                        <MovieContentSections
                            movie={movie}
                            merchandise={merchandise}
                            merchLoading={merchLoading}
                            onShowAllCast={() => setShowFullCast(true)}
                            onShowAllCrew={() => setShowFullCrew(true)}
                            onWriteReview={() => setIsReviewModalOpen(true)}
                        />
                    </div>

                    {/* Right Column */}
                    {movie.offers?.length > 0 && (
                        <div className="lg:col-span-4 space-y-10">
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 transition-colors">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Available Offers</h3>
                                <div className="space-y-4">
                                    {movie.offers.map((offer, idx) => (
                                        <div key={idx} className="p-4 rounded-xl bg-premiumGold/5 dark:bg-premiumGold/10 border border-premiumGold/10 dark:border-premiumGold/20 flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-premiumGold/10 dark:bg-premiumGold/20 flex items-center justify-center shrink-0">
                                                <Sparkles className="w-5 h-5 text-premiumGold" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{offer.title}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">{offer.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showFullCast && (
                <CastCrewModal
                    title="Cast"
                    items={movie.cast}
                    onClose={() => setShowFullCast(false)}
                />
            )}
            {showFullCrew && (
                <CastCrewModal
                    title="Crew"
                    items={movie.crew}
                    onClose={() => setShowFullCrew(false)}
                />
            )}

            {/* Mobile Sticky Booking Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
                <button
                    onClick={handleBookingClick}
                    disabled={!movie.isAvailable}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 ${movie.isAvailable
                        ? 'bg-xynemaRose text-white shadow-xynemaRose/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {movie.isAvailable ? 'Book Tickets' : 'Coming Soon'}
                </button>
            </div>
        </div>
    );
};

const CastCrewModal = ({ title, items, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-gray-100 rotate-90 md:rotate-0" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {items.map((item, idx) => {
                            const name = item.name || '';
                            const role = item.role || '';
                            const photoUrl = item.photoUrl || '';

                            return (
                                <div key={idx} className="flex flex-col items-center text-center space-y-3">
                                    <div className={`w-20 h-20 rounded-full overflow-hidden border border-white/10 flex items-center justify-center shadow-inner ${!photoUrl || photoUrl.includes('ui-avatars') ? getAvatarColor(name) : ''}`}>
                                        {photoUrl && !photoUrl.includes('ui-avatars') ? (
                                            <img
                                                src={photoUrl}
                                                alt={name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xl font-black text-white tracking-tighter">
                                                {getInitials(name)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs">{name}</h4>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{role}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MovieContentSections = ({ movie, merchandise, merchLoading, onShowAllCast, onShowAllCrew, onWriteReview }) => {
    return (
        <div className="space-y-4 md:space-y-12">
            {/* Cast Section */}
            {movie.cast?.length > 0 && (
                <section id="cast" className="space-y-6 pt-6 animate-slide-up opacity-0 delay-200">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center md:text-left w-full md:w-auto">Cast</h3>
                        {movie.cast?.length > 5 && (
                            <button
                                onClick={onShowAllCast}
                                className="text-[10px] font-black uppercase tracking-widest text-xynemaRose dark:text-blue-400 hover:opacity-80 transition-opacity hidden md:block"
                            >
                                See All
                            </button>
                        )}
                    </div>
                    <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                        {movie.cast.map((actor, idx) => {
                            const name = actor.name || '';
                            const role = actor.role || '';
                            const photoUrl = actor.photoUrl || '';

                            return (
                                <div key={idx} className="flex-shrink-0 w-28 md:w-36 flex flex-col items-center text-center space-y-3 group snap-start">
                                    <div className={`w-28 h-[140px] md:w-36 md:h-[180px] rounded-2xl overflow-hidden shadow-sm flex items-center justify-center bg-gray-100 ${!photoUrl || photoUrl.includes('ui-avatars') ? getAvatarColor(name) : ''}`}>
                                        {photoUrl && !photoUrl.includes('ui-avatars') ? (
                                            <img
                                                src={photoUrl}
                                                alt={name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                            />
                                        ) : (
                                            <span className="text-4xl font-black text-white transition-colors tracking-tighter">
                                                {getInitials(name)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="font-semibold text-gray-800 text-sm md:text-[15px] leading-tight mt-1 truncate w-full px-1" title={name}>{name}</h4>
                                        <p className="text-xs text-gray-400 font-normal truncate w-full px-1" title={role}>({role})</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Mobile See All */}
                    {movie.cast?.length > 5 && (
                        <div className="md:hidden flex justify-center pt-2">
                            <button
                                onClick={onShowAllCast}
                                className="px-6 py-2 rounded-full border border-gray-200 dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            >
                                See All Cast
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Crew Section */}
            {movie.crew?.length > 0 && (
                <section id="crew" className="space-y-6 pt-8 border-t border-gray-100 dark:border-gray-800 transition-colors animate-slide-up opacity-0 delay-300">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight text-center md:text-left w-full md:w-auto">Crew</h3>
                        {movie.crew?.length > 5 && (
                            <button
                                onClick={onShowAllCrew}
                                className="text-[10px] font-black uppercase tracking-widest text-xynemaRose dark:text-blue-400 hover:opacity-80 transition-opacity hidden md:block"
                            >
                                See All
                            </button>
                        )}
                    </div>
                    <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                        {movie.crew.map((member, idx) => {
                            const name = member.name || '';
                            const role = member.role || '';
                            const photoUrl = member.photoUrl || '';

                            return (
                                <div key={idx} className="flex-shrink-0 w-28 md:w-36 flex flex-col items-center text-center space-y-3 group snap-start">
                                    <div className={`w-28 h-[140px] md:w-36 md:h-[180px] rounded-2xl overflow-hidden shadow-sm flex items-center justify-center bg-gray-100 ${!photoUrl || photoUrl.includes('ui-avatars') ? getAvatarColor(name) : ''}`}>
                                        {photoUrl && !photoUrl.includes('ui-avatars') ? (
                                            <img
                                                src={photoUrl}
                                                alt={name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                            />
                                        ) : (
                                            <span className="text-4xl font-black text-white transition-colors tracking-tighter">
                                                {getInitials(name)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="font-semibold text-gray-800 text-sm md:text-[15px] leading-tight mt-1 truncate w-full px-1" title={name}>{name}</h4>
                                        <p className="text-xs text-gray-400 font-normal truncate w-full px-1" title={role}>({role})</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Mobile See All */}
                    {movie.crew?.length > 5 && (
                        <div className="md:hidden flex justify-center pt-2">
                            <button
                                onClick={onShowAllCrew}
                                className="px-6 py-2 rounded-full border border-gray-200 dark:border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            >
                                See All Crew
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Official Merchandise Section */}
            {!merchLoading && merchandise.length > 0 && (
                <section id="merchandise" className="space-y-6 pt-12 border-t border-gray-100 dark:border-gray-800 transition-colors group/store animate-slide-up opacity-0 delay-400">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Official merchandise</h3>
                        <Link to="/store" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-xynemaRose dark:hover:text-blue-400 transition-colors group/link">
                            <ShoppingBag className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover/link:text-xynemaRose dark:group-hover/link:text-blue-400 transition-colors" />
                            Visit Store
                        </Link>
                    </div>

                    <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
                        <Swiper
                            modules={[Navigation]}
                            spaceBetween={20}
                            slidesPerView={1.2}
                            navigation={{
                                nextEl: '.merch-next',
                                prevEl: '.merch-prev',
                            }}
                            breakpoints={{
                                480: { slidesPerView: 1.5, spaceBetween: 20 },
                                640: { slidesPerView: 2.2, spaceBetween: 24 },
                                768: { slidesPerView: 2.5, spaceBetween: 24 },
                                1024: { slidesPerView: 3, spaceBetween: 24 },
                                1280: { slidesPerView: 3.5, spaceBetween: 24 },
                            }}
                            className="!pb-8"
                        >
                            {merchandise.map((item, idx) => (
                                <SwiperSlide key={`merch-${item.id || idx}`}>
                                    <StoreCard item={item} />
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Custom Navigation Arrows */}
                        <button className="merch-prev absolute -left-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-800 items-center justify-center text-gray-800 dark:text-gray-200 hover:text-xynemaRose dark:hover:text-blue-400 hover:scale-110 transition-all hidden lg:flex disabled:opacity-0">
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                        <button className="merch-next absolute -right-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-800 items-center justify-center text-gray-800 dark:text-gray-200 hover:text-xynemaRose dark:hover:text-blue-400 hover:scale-110 transition-all hidden lg:flex disabled:opacity-0">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </section>
            )}

            {/* Similar Movies Section */}
            <SimilarMovies currentMovie={movie} />

            {/* Reviews Section */}
            {(movie.reviews?.length > 0 || movie.isAvailable) && movie.rating > 0 && (
                <section id="reviews" className="space-y-6 animate-slide-up opacity-0 delay-400">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 transition-colors pb-2">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Top reviews</h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Summary of {movie.reviews?.length} reviews.</p>
                        </div>
                        {movie.reviews?.length > 0 && (
                            <Link
                                to={`/movie/${movie.slug}/reviews`}
                                state={{ movieId: movie.id, movieName: movie.title }}
                                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-xynemaRose dark:text-blue-400 hover:opacity-80 transition-opacity"
                            >
                                {movie.reviews.length} reviews
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>



                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-6 snap-x">
                        {movie.reviews?.map((review, idx) => (
                            <div key={idx} className="flex-shrink-0 w-full md:w-[450px] p-5 rounded-2xl border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white transition-all snap-start">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-800 overflow-hidden">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${review.user.name || 'User'}&background=random&color=fff`}
                                                    alt="User"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm tracking-tight">{review.user.name || 'Verified User'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            <span className="text-sm font-black text-gray-900 dark:text-gray-100">{review.rating}/10</span>
                                        </div>
                                    </div>
                                    <p className="text-black dark:text-gray-200 text-sm leading-relaxed font-medium line-clamp-4">
                                        {review.comment}
                                    </p>
                                </div>

                                <div className="flex items-center justify-end pt-3 border-t border-gray-50 dark:border-gray-800 mt-1">
                                    <span className="text-[10px] text-black-100 dark:text-gray-500 font-bold uppercase tracking-widest">
                                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};


const SimilarMovies = ({ currentMovie }) => {
    const { latestMovies, highlightsMovies, upcomingMovies } = useData();
    const navigate = useNavigate();

    // Use latestMovies, highlightsMovies, and upcomingMovies from context
    const allMovies = [...(latestMovies || []), ...(highlightsMovies || []), ...(upcomingMovies || [])];

    // Remove duplicates and current movie
    const moviesToShow = Array.from(new Set(allMovies.map(m => String(m.id))))
        .map(id => allMovies.find(m => String(m.id) === id))
        .filter(m => m && String(m.id) !== String(currentMovie.id));

    // Development purpose: disable genre filter, show all available movies
    let similarMovies = moviesToShow.slice(0, 8);

    // Only render the section if we actually have movies to show
    if (similarMovies.length === 0) return null;

    return (
        <section id="similar-movies" className="relative mt-16 group/similar animate-slide-up delay-400">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    You might also like
                </h2>
                <Link to="/movies" className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>

            <div className="relative">
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={24}
                    slidesPerView={2}
                    navigation={{
                        nextEl: '.similar-next',
                        prevEl: '.similar-prev',
                    }}
                    breakpoints={{
                        640: { slidesPerView: 3, spaceBetween: 24 },
                        768: { slidesPerView: 4, spaceBetween: 24 },
                        1024: { slidesPerView: 5, spaceBetween: 24 },
                    }}
                    className="!pb-4"
                >
                    {similarMovies.map((movie, idx) => (
                        <SwiperSlide key={movie.id || movie._id}>
                            <MovieCard
                                movie={{ ...movie, delayClass: `delay-[${(idx + 1) * 100}ms]` }}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>

                <button className="similar-prev absolute -left-4 top-[40%] -translate-y-1/2 -translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-[#1E2532] dark:text-gray-200 hover:text-xynemaRose dark:hover:text-blue-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all hidden md:flex opacity-0 group-hover/similar:opacity-100 disabled:opacity-0">
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <button className="similar-next absolute -right-4 top-[40%] -translate-y-1/2 translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-[#1E2532] dark:text-gray-200 hover:text-xynemaRose dark:hover:text-blue-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all hidden md:flex opacity-0 group-hover/similar:opacity-100 disabled:opacity-0">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </section>
    );
};

// Loading states consolidated into global LoadingScreen

// DetailErrorState removed - replaced with shared ErrorState



const ReviewModal = ({ movie, onClose, onSubmit, isSubmitting }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Rate {movie.title}</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                        <ArrowLeft className="w-6 h-6 rotate-90" />
                    </button>
                </div>
                <div className="p-8 space-y-8">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-transform active:scale-90"
                            >
                                <Star
                                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'}`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Your Experience (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-xynemaRose dark:focus:ring-blue-500 transition-all resize-none"
                            placeholder="Share your thoughts on the movie..."
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 transition-colors">
                    <button
                        onClick={() => onSubmit(rating, comment)}
                        disabled={rating === 0 || isSubmitting}
                        className="w-full py-4 bg-xynemaRose text-white rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-all shadow-lg shadow-xynemaRose/20 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            'Submit Review'
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default MovieDetailsPage;
