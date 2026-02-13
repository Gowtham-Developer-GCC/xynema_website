import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Clock, ThumbsDown, MapPin, Share2, Heart, AlertCircle, Loader, Sparkles, Play, User, TrendingUp, ChevronRight, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleInterest, addMovieReview } from '../services/api';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';
import NotFoundState from '../components/NotFoundState';
import ErrorState from '../components/ErrorState';
import { designSystem } from '../config/design-system';
import { buttonStyles, cardStyles, animationStyles } from '../styles/components';
import { useData } from '../context/DataContext';
import { optimizeImage } from '../utils/helpers';

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
    const { movies, latestMovies, loading: contextLoading, toggleInterestOptimistic, getInterestOffset, interestedMovieIds } = useData();
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

    useEffect(() => {
        if (!contextLoading) {
            const allAvailableMovies = [...(movies || []), ...(latestMovies || [])];

            const foundMovie = allAvailableMovies.find(m => {
                const slugMatch = m.slug && m.slug.toLowerCase() === idOrSlug?.toLowerCase();
                const idMatch = String(m.id) === idOrSlug || String(m._id) === idOrSlug;
                return idMatch || slugMatch;
            });

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

    if (!idOrSlug || (loading && !movie)) return <LoadingSpinner message="Fetching Movie" />;
    if (loading) return <LoadingSpinner message="Fetching Movie" />;
    if (error) return <NotFoundState title="Movie Not Found" message="We couldn't find the movie you're looking for." />;
    if (!movie) return <NotFoundState title="Movie Not Found" message="We couldn't find the movie you're looking for." />;

    const isFavorite = favorites.includes(movie.id);
    const hasInterested = interestedMovieIds.has(movie.id);
    const interestOffset = getInterestOffset(movie.id);

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            <SEO
                title={`${movie.title} - Book Tickets | XYNEMA`}
                description={movie.description || `Watch ${movie.title} in cinemas near you`}
            />

            {/* Hero Section with Sophisticated Banner */}
            <div className="relative w-full overflow-hidden bg-[#1A1A1A]">
                {/* Background Image with Multi-layered Masking */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center md:bg-fixed"
                        style={{
                            backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
                            filter: 'blur(10px)',
                            opacity: 0.6
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/90 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-black/30" />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-white">
                        {/* Premium Movie Poster */}
                        <div className="relative group w-44 md:w-60 flex-shrink-0 animate-fade-in">
                            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-white/10 relative">
                                <img
                                    src={optimizeImage(movie.posterUrl, { width: 600, quality: 95 })}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 inset-x-0 h-8 bg-black/70 backdrop-blur-md flex items-center justify-center pointer-events-none">
                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                                        {movie.isAvailable ? 'In Cinemas' : `Releasing on ${new Date(movie.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Soon'}`}
                                    </p>
                                </div>
                            </div>

                            {/* Trailer Trigger Overlay */}
                            {movie.trailerUrl && (
                                <button
                                    onClick={handleWatchTrailer}
                                    className="absolute inset-0 flex items-center justify-center group/trailer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover/trailer:scale-110 transition-all duration-300">
                                        <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
                                    </div>
                                    <div className="absolute bottom-12 opacity-0 group-hover/trailer:opacity-100 transition-opacity bg-black/70 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white">
                                        Trailer
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Movie Details Content Area */}
                        <div className="flex-1 flex flex-col gap-4 text-center md:text-left max-w-3xl pt-2">
                            {/* Title Area */}
                            <div className="space-y-2">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white animate-slide-up">
                                    {movie.title}
                                </h1>
                            </div>

                            <div className="space-y-4">
                                {movie.isAvailable && (
                                    <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-700">
                                        <div className="inline-flex items-center gap-2">
                                            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                                            <span className="text-2xl font-bold text-white tracking-tight">{movie.rating || '0'}/10</span>
                                            <span className="text-xs font-medium text-white/70 ml-1">
                                                ({movie.voteCount > 1000 ? `${(movie.voteCount / 1000).toFixed(1)}K` : movie.voteCount} Votes)
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* ... Interest Logic Simplification ... */}
                                {!movie.isAvailable && (
                                    <div className="relative z-10 flex flex-wrap items-center justify-center md:justify-start gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
                                        <div className="flex items-center gap-3">
                                            <ThumbsUp className={`w-5 h-5 ${hasInterested ? 'text-green-500 fill-green-500' : 'text-white'}`} />
                                            <div className="text-left">
                                                <h3 className="text-sm md:text-base font-bold text-white leading-none">
                                                    {((movie.interestCount || 0) + interestOffset) > 1000
                                                        ? `${(((movie.interestCount || 0) + interestOffset) / 1000).toFixed(1)}K`
                                                        : ((movie.interestCount || 0) + interestOffset)}+ interested
                                                </h3>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleInterest}
                                            className={`px-4 py-1.5 rounded border text-xs font-bold uppercase tracking-wider transition-all ${hasInterested
                                                ? 'bg-transparent border-white/30 text-white/80'
                                                : 'bg-white text-black border-white hover:bg-gray-200'
                                                }`}
                                        >
                                            {hasInterested ? 'Undo' : "I'm Interested"}
                                        </button>
                                    </div>
                                )}


                                {(movie.format?.length > 0 || movie.language) && (
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        {movie.format?.map((f, i) => (
                                            <span key={i} className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-white text-black uppercase tracking-wide">
                                                {f.trim()}
                                            </span>
                                        ))}
                                        {movie.language?.split(',').map((l, i) => (
                                            <span key={i} className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-white text-black uppercase tracking-wide">
                                                {l.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 text-xs font-medium text-white/80">
                                    {movie.duration > 0 && (
                                        <>
                                            <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                                            <span className="w-1 h-1 rounded-full bg-white/40" />
                                        </>
                                    )}
                                    {movie.genre && (
                                        <>
                                            <span>{movie.genre}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/40" />
                                        </>
                                    )}
                                    {movie.certification && (
                                        <>
                                            <span className="px-1 py-px border border-white/30 rounded-[2px] text-[9px] uppercase">{movie.certification}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/40" />
                                        </>
                                    )}
                                    {movie.releaseDate && (
                                        <span>{new Date(movie.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    )}
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="pt-4 flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
                                <button
                                    onClick={handleBookingClick}
                                    disabled={!movie.isAvailable}
                                    className={`w-full md:w-auto px-10 py-3 rounded-lg font-bold text-sm transition-transform active:scale-95 ${movie.isAvailable
                                        ? 'bg-xynemaRose text-white'
                                        : 'bg-gray-600 text-white/50 cursor-not-allowed'
                                        }`}
                                >
                                    {movie.isAvailable ? 'Book Tickets' : 'Coming Soon'}
                                </button>

                                <div className="flex items-center justify-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={toggleFavorite}
                                        className={`flex-1 md:flex-none flex items-center justify-center w-11 h-11 rounded-lg border transition-all active:scale-90 ${isFavorite
                                            ? 'bg-white border-white text-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.2)]'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </button>

                                    <button
                                        onClick={handleShare}
                                        className="flex-1 md:flex-none flex items-center justify-center w-11 h-11 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-90"
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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className={`grid grid-cols-1 gap-8 ${movie.offers?.length > 0 ? 'lg:grid-cols-12' : 'lg:grid-cols-1'}`}>
                    {/* Left Column */}
                    <div className={`${movie.offers?.length > 0 ? 'lg:col-span-8' : 'w-full'} space-y-10 md:space-y-14`}>
                        <MovieContentSections
                            movie={movie}
                            onShowAllCast={() => setShowFullCast(true)}
                            onShowAllCrew={() => setShowFullCrew(true)}
                            onWriteReview={() => setIsReviewModalOpen(true)}
                        />
                    </div>

                    {/* Right Column */}
                    {/* {movie.offers?.length > 0 && (
                        <div className="lg:col-span-4 space-y-10">
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Available Offers</h3>
                                <div className="space-y-4">
                                    {movie.offers.map((offer, idx) => (
                                        <div key={idx} className="p-4 rounded-xl bg-premiumGold/5 border border-premiumGold/10 flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-premiumGold/10 flex items-center justify-center shrink-0">
                                                <Sparkles className="w-5 h-5 text-premiumGold" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{offer.title}</p>
                                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-1">{offer.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )} */}
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
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleBookingClick}
                    disabled={!movie.isAvailable}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 ${movie.isAvailable
                        ? 'bg-xynemaRose text-white shadow-xynemaRose/20'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-900 rotate-90 md:rotate-0" />
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
                                        <h4 className="font-bold text-gray-800 text-xs">{name}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{role}</p>
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

const MovieContentSections = ({ movie, onShowAllCast, onShowAllCrew, onWriteReview }) => {
    return (
        <div className="space-y-4 md:space-y-8">
            {/* About Section */}
            {movie.description && (
                <section id="about" className="space-y-6 animate-slide-up opacity-0 delay-100">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight text-center md:text-left w-full md:w-auto">Synopsis</h3>
                    </div>
                    <div className="space-y-6">
                        <p className="text-gray-600 leading-relaxed text-base md:text-lg text-center md:text-left">
                            {movie.description}
                        </p>
                        <div className="pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                            {movie.crew?.find(c => (c.role || '').toLowerCase().includes('director')) && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Director</p>
                                    <p className="text-sm font-black text-gray-900 line-clamp-1">
                                        {movie.crew?.find(c => (c.role || '').toLowerCase().includes('director'))?.name}
                                    </p>
                                </div>
                            )}
                            {movie.language && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Language</p>
                                    <p className="text-sm font-black text-gray-900 line-clamp-1">{movie.language}</p>
                                </div>
                            )}
                            {movie.certification && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Certification</p>
                                    <p className="text-sm font-black text-gray-900">{movie.certification}</p>
                                </div>
                            )}
                            {movie.format?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Format</p>
                                    <p className="text-sm font-black text-gray-900 line-clamp-1">{movie.format?.join(', ')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Cast Section */}
            {movie.cast?.length > 0 && (
                <section id="cast" className="space-y-6 animate-slide-up opacity-0 delay-200">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight text-center md:text-left w-full md:w-auto">Cast</h3>
                        {movie.cast?.length > 5 && (
                            <button
                                onClick={onShowAllCast}
                                className="text-[10px] font-black uppercase tracking-widest text-xynemaRose hover:opacity-80 transition-opacity hidden md:block"
                            >
                                See All
                            </button>
                        )}
                    </div>
                    <div className="flex overflow-x-auto gap-6 md:gap-10 pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                        {movie.cast.slice(0, 10).map((actor, idx) => {
                            const name = actor.name || '';
                            const role = actor.role || '';
                            const photoUrl = actor.photoUrl || '';

                            return (
                                <div key={idx} className="flex-shrink-0 w-28 flex flex-col items-center text-center space-y-3 group">
                                    <div className={`w-24 h-24 rounded-full overflow-hidden border-2 border-transparent transition-all shadow-sm group-hover:border-xynemaRose group-hover:shadow-md flex items-center justify-center ${!photoUrl || photoUrl.includes('ui-avatars') ? getAvatarColor(name) : ''}`}>
                                        {photoUrl && !photoUrl.includes('ui-avatars') ? (
                                            <img
                                                src={photoUrl}
                                                alt={name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-black text-white transition-colors tracking-tighter">
                                                {getInitials(name)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-gray-900 text-[13px] leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">{name}</h4>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{role}</p>
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
                                className="px-6 py-2 rounded-full border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                See All Cast
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Crew Section */}
            {movie.crew?.length > 0 && (
                <section id="crew" className="space-y-6 animate-slide-up opacity-0 delay-300">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight text-center md:text-left w-full md:w-auto">Crew</h3>
                        {movie.crew?.length > 5 && (
                            <button
                                onClick={onShowAllCrew}
                                className="text-[10px] font-black uppercase tracking-widest text-xynemaRose hover:opacity-80 transition-opacity hidden md:block"
                            >
                                See All
                            </button>
                        )}
                    </div>
                    <div className="flex overflow-x-auto gap-6 md:gap-10 pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                        {movie.crew.slice(0, 10).map((member, idx) => {
                            const name = member.name || '';
                            const role = member.role || '';
                            const photoUrl = member.photoUrl || '';

                            return (
                                <div key={idx} className="flex-shrink-0 w-28 flex flex-col items-center text-center space-y-3 group">
                                    <div className={`w-24 h-24 rounded-full overflow-hidden border-2 border-transparent transition-all shadow-sm group-hover:border-xynemaRose group-hover:shadow-md flex items-center justify-center ${!photoUrl || photoUrl.includes('ui-avatars') ? getAvatarColor(name) : ''}`}>
                                        {photoUrl && !photoUrl.includes('ui-avatars') ? (
                                            <img
                                                src={photoUrl}
                                                alt={name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-black text-white transition-colors tracking-tighter">
                                                {getInitials(name)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-gray-900 text-[13px] leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">{name}</h4>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{role}</p>
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
                                className="px-6 py-2 rounded-full border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                            >
                                See All Crew
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Similar Movies Section */}
            <SimilarMovies currentMovie={movie} />

            {/* Reviews Section */}
            {(movie.reviews?.length > 0 || movie.isAvailable) && movie.rating > 0 && (
                <section id="reviews" className="space-y-6 animate-slide-up opacity-0 delay-400">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Top reviews</h3>
                            <p className="text-xs text-gray-400">Summary of {movie.reviews?.length} reviews.</p>
                        </div>
                        {movie.reviews?.length > 0 && (
                            <Link
                                to={`/movie/${movie.slug}/reviews`}
                                state={{ movieId: movie.id, movieName: movie.title }}
                                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-xynemaRose hover:opacity-80 transition-opacity"
                            >
                                {movie.reviews.length} reviews
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>



                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-6 snap-x">
                        {movie.reviews?.map((review, idx) => (
                            <div key={idx} className="flex-shrink-0 w-full md:w-[450px] p-5 rounded-2xl border-2 border-black/10 hover:border-black transition-all snap-start">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${review.user.name || 'User'}&background=random&color=fff`}
                                                    alt="User"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm tracking-tight">{review.user.name || 'Verified User'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            <span className="text-sm font-black text-gray-900">{review.rating}/10</span>
                                        </div>
                                    </div>
                                    <p className="text-black text-sm leading-relaxed font-medium line-clamp-4">
                                        {review.comment}
                                    </p>
                                </div>

                                <div className="flex items-center justify-end pt-3 border-t border-gray-50 mt-1">
                                    <span className="text-[10px] text-black-100 font-bold uppercase tracking-widest">
                                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )
            }
        </div >
    );
};

const SimilarMovies = ({ currentMovie }) => {
    const { movies, latestMovies } = useData();
    const navigate = useNavigate();

    // Filter logic: Same genre, exclude current movie
    const allMovies = [...(movies || []), ...(latestMovies || [])];
    const similarMovies = allMovies.filter(m => {
        if (m.id === currentMovie.id || m._id === currentMovie._id) return false;

        // Check for genre overlap
        const currentGenres = (currentMovie.genre || '').toLowerCase().split(',').map(g => g.trim());
        const movieGenres = (m.genre || '').toLowerCase().split(',').map(g => g.trim());

        return currentGenres.some(g => g && movieGenres.includes(g));
    }).filter((movie, index, self) =>
        index === self.findIndex((t) => t.id === movie.id)
    ).slice(0, 5); // Limit to 5 recommendations

    if (similarMovies.length === 0) return null;

    return (
        <section className="space-y-6 animate-slide-up opacity-0 delay-400">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">You Might Also Like</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {similarMovies.map(movie => (
                    <Link
                        key={movie.id || movie._id}
                        to={`/movie/${movie.slug}`}
                        onClick={() => window.scrollTo(0, 0)}
                        className="group cursor-pointer space-y-3 block"
                    >
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100 relative">
                            <img
                                src={optimizeImage(movie.posterUrl, { width: 400 })}
                                alt={movie.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-white text-xynemaRose text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    View Details
                                </span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-xynemaRose transition-colors">
                                {movie.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1 line-clamp-1">
                                {movie.genre}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section >
    );
};

// Loading states consolidated into global LoadingSpinner

// DetailErrorState removed - replaced with shared ErrorState



const ReviewModal = ({ movie, onClose, onSubmit, isSubmitting }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Rate {movie.title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
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
                                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Experience (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us what you liked or didn't like..."
                            className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xynemaRose/20 focus:border-xynemaRose transition-all resize-none"
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100">
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
        </div>
    );
};

export default MovieDetailsPage;
