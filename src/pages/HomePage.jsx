import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { ChevronRight, Star, Heart, TrendingUp, ThumbsUp, AlertCircle, X, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ErrorState from '../components/ErrorState';
import { optimizeImage } from '../utils/helpers';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const HomePage = ({ selectedCity }) => {
    const { movies, latestMovies, loading, error, refreshData, toggleInterestOptimistic, getInterestOffset, interestedMovieIds } = useData();

    // Favorites State
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
            return [];
        }
    });

    const toggleFavorite = useCallback((movieId) => {
        setFavorites(prev => {
            const isAdding = !prev.includes(movieId);
            const updated = isAdding
                ? [...prev, movieId]
                : prev.filter(id => id !== movieId);

            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Data Filtering
    const bannerMovies = useMemo(() => {
        if (!movies?.length) return [];
        // Prioritize promoted movies for banner
        const promoted = movies.filter(m => m.isPromoted);
        return promoted.length > 0 ? promoted.slice(0, 5) : movies.slice(0, 5);
    }, [movies]);

    const recommendedMovies = useMemo(() => {
        if (!movies?.length) return [];
        // 1. Get Promoted Movies
        const promoted = movies.filter(m => m.isPromoted);

        // 2. If less than 5, fill with top rated/other movies
        if (promoted.length < 5) {
            const others = movies.filter(m => !m.isPromoted);
            return [...promoted, ...others].slice(0, 5);
        }

        return promoted.slice(0, 5);
    }, [movies]);

    // Filter Upcoming Movies by Availability
    const upcomingMovies = useMemo(() => {
        if (!latestMovies?.length) return [];
        return latestMovies.slice(0, 5);
    }, [latestMovies]);

    // Loading State -> Skeleton
    if (loading && !movies?.length) return <HomeSkeleton />;

    // Error State
    if (error && !movies?.length) return <ErrorState error={error} onRetry={refreshData} title="Connection Failed" />;

    return (
        <div className="min-h-screen bg-[#f5f5f5] text-black overflow-x-hidden font-sans">
            <SEO
                title={`${selectedCity} - Book Movie Tickets Online | XYNEMA`}
                description="Book your favorite movies with ease and elegance."
            />

            {/* Hero Carousel */}
            <div className="relative">
                <HeroCarousel
                    movies={bannerMovies}
                />
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
                {/* Recommended Section */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Recommended Movies
                        </h2>
                        <Link to="/movies" className="text-sm font-semibold text-xynemaRose flex items-center gap-1 transition-colors">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {recommendedMovies.map((movie, idx) => (
                            <MovieCard
                                key={movie.id}
                                movie={{ ...movie, delayClass: `delay-[${(idx + 1) * 100}ms]` }}
                                isFavorite={favorites.includes(movie.id)}
                                onToggleFavorite={toggleFavorite}
                                displayType="rating"
                            />
                        ))}
                    </div>

                    {/* Upcoming Movies Section */}
                    {upcomingMovies.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mb-3 mt-8">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    Upcoming Movies
                                </h2>
                                <Link to="/upcoming-movies" className="text-sm font-semibold text-xynemaRose flex items-center gap-1 transition-colors">
                                    View All <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {upcomingMovies.map((movie, idx) => (
                                    <MovieCard
                                        key={`upcoming-${movie.id}`}
                                        movie={{ ...movie, delayClass: `delay-[${(idx + 1) * 100}ms]` }}
                                        isFavorite={favorites.includes(movie.id)}
                                        onToggleFavorite={toggleFavorite}
                                        displayType="interest"
                                        onToggleInterest={toggleInterestOptimistic}
                                        isInterested={interestedMovieIds.has(movie.id)}
                                        interestOffset={getInterestOffset(movie.id)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

// ============= COMPONENT: HeroCarousel =============

const HeroCarousel = memo(({ movies }) => {
    if (!movies?.length) return null;

    // Duplicate movies to ensure seamless infinite loop esp. on large screens
    // Swiper's loop mode sometimes needs more slides than slidesPerView * 2
    const displayMovies = useMemo(() => {
        if (!movies?.length) return [];
        let result = [...movies];
        // Repeat until we have a comfortable number of slides for looping (e.g. > 10)
        // This ensures sequence integrity (no partial cuts like 1,2,3...1,2)
        while (result.length < 10) {
            result = [...result, ...movies];
        }
        return result;
    }, [movies]);

    return (
        <section className="w-full bg-[#f5f5f5]">
            <div className="w-full">
                <Swiper
                    modules={[Autoplay, Pagination, Navigation]}
                    spaceBetween={16}
                    slidesPerView={'auto'}
                    centeredSlides={true}
                    loop={true}
                    speed={800}
                    autoplay={{
                        delay: 1000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }}
                    navigation={true}
                    className="w-full h-[140px] sm:h-[180px] md:h-[240px] lg:h-[320px] hero-swiper"
                >
                    {displayMovies.map((movie, index) => (
                        <SwiperSlide
                            // Use unique key for duplicates using index
                            key={`${movie.id}-${index}`}
                            className="relative h-full transition-all duration-300 !w-[90%] md:!w-[85%] lg:!w-[1088px] flex items-center justify-center"
                        >
                            {/* Slide Content with rounded corners */}
                            <div className="w-full h-full rounded-xl overflow-hidden relative bg-gray-200 select-none shadow-lg">
                                <Link
                                    to={`/movie/${movie.slug || movie.id}`}
                                    className="block w-full h-full cursor-pointer"
                                >
                                    <img
                                        src={movie.backdropUrl || movie.posterUrl}
                                        alt={movie.title}
                                        className="w-full h-full object-cover"
                                        loading="eager"
                                        draggable="false"
                                    />
                                </Link>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .hero-swiper {
                    padding-bottom: 25px !important;
                    padding-top: 10px;
                }
                .hero-swiper .swiper-slide {
                    transform: scale(0.96);
                    opacity: 1; 
                    transition: transform 0.4s ease;
                }
                .hero-swiper .swiper-slide-active {
                    transform: scale(1);
                    z-index: 10;
                }
                /* Custom Navigation Arrows */
                .hero-swiper .swiper-button-next,
                .hero-swiper .swiper-button-prev {
                    color: white;
                    width: 40px;
                    height: 40px;
                    background: rgba(0,0,0,0.6);
                    border-radius: 4px;
                    transition: background 0.2s;
                    backdrop-filter: blur(2px);
                    margin-top: -12px;
                }
                .hero-swiper .swiper-button-next:hover,
                .hero-swiper .swiper-button-prev:hover {
                    background: rgba(0,0,0,0.9);
                }
                .hero-swiper .swiper-button-next:after,
                .hero-swiper .swiper-button-prev:after {
                    font-size: 18px;
                    font-weight: bold;
                }
                .hero-swiper .swiper-button-prev {
                    left: 10px;
                }
                .hero-swiper .swiper-button-next {
                    right: 10px;
                }
                /* Pagination Dots */
                .hero-swiper .swiper-pagination-bullet {
                    background: white;
                    opacity: 0.5;
                    width: 6px;
                    height: 6px;
                }
                .hero-swiper .swiper-pagination-bullet-active {
                    opacity: 1;
                    background: white;
                }
            `}} />
        </section>
    );
});

// ============= COMPONENT: Movie Card =============

const MovieCard = memo(({
    movie,
    isFavorite,
    onToggleFavorite,
    displayType = 'rating',
    onToggleInterest,
    isInterested,
    interestOffset = 0
}) => (
    <Link
        to={`/movie/${movie.slug || movie.id}`}
        className={`group relative flex flex-col space-y-3 animate-slide-up opacity-0 ${movie.delayClass || ''}`}
    >
        <div className="aspect-[2/3] rounded-lg overflow-hidden relative bg-gray-200 transition-all group-hover:shadow-lg">
            <img
                src={optimizeImage(movie.posterUrl, { width: 400, quality: 75 })}
                alt={movie.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Minimal Bottom Rating Badge */}
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded flex items-center gap-1 z-10">
                {displayType === 'rating' ? (
                    <>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold">{movie.rating > 0 ? movie.rating.toFixed(1) : '0.0'}</span>
                        <span className="text-[10px] text-white/80 ml-1">
                            {(movie.voteCount || 0) > 1000 ? `${(movie.voteCount / 1000).toFixed(1)}K` : movie.voteCount} Votes
                        </span>
                    </>
                ) : (
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleInterest?.(movie.id); }}
                        className={`flex items-center gap-1 transition-all active:scale-95 ${isInterested ? 'text-emerald-400' : 'text-white/70 hover:text-white'}`}
                    >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isInterested ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                        <span className="text-[10px] font-bold">
                            {(movie.interestCount || 0) + interestOffset > 1000
                                ? `${(((movie.interestCount || 0) + interestOffset) / 1000).toFixed(1)}K`
                                : (movie.interestCount || 0) + interestOffset}+
                        </span>
                    </button>
                )}
            </div>

            <button
                onClick={(e) => { e.preventDefault(); onToggleFavorite(movie.id); }}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-20 active:scale-90 ${isFavorite ? 'bg-white text-rose-600 shadow-sm' : 'bg-black/30 text-white hover:bg-black/50'}`}
                aria-label="Toggle Favorite"
            >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
        </div>

        <div className="px-1">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-xynemaRose transition-colors leading-tight line-clamp-1">
                {movie.title}
            </h3>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1 line-clamp-1">
                {movie.genre}
            </p>
        </div>
    </Link>
));

// ============= COMPONENT: Skeleton Loader =============

const HomeSkeleton = () => (
    <div className="min-h-screen bg-[#f5f5f5]">
        {/* MATCH HERO CAROUSEL */}
        <div className="w-full bg-[#f5f5f5] pt-[10px] pb-[25px]">
            <div className="max-w-[1088px] mx-auto px-4 lg:px-0">
                <div
                    className="w-full bg-gray-200 rounded-xl animate-pulse"
                    style={{ height: 'max(140px, min(320px, 30vw))' }}
                />
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
            {/* RECOMMENDED SECTION SKELETON */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex flex-col space-y-3">
                            <div className="aspect-[2/3] bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-11/12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* UPCOMING SECTION SKELETON */}
            <div className="pt-2">
                <div className="flex justify-between items-center mb-3">
                    <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex flex-col space-y-3">
                            <div className="aspect-[2/3] bg-gray-200 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-11/12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default HomePage;
