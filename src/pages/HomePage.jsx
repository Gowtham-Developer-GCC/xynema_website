import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';
import { ChevronRight, Star, Heart, TrendingUp, ThumbsUp, AlertCircle, X, CheckCircle, Calendar, MapPin, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ErrorState from '../components/ErrorState';
import { optimizeImage } from '../utils/helpers';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import StoreCard from '../components/StoreCard';
import MovieCard from '../components/MovieCard';

const HomePage = ({ selectedCity }) => {
    const { movies, latestMovies, upcomingMovies, highlightsMovies, events, loading, error, refreshData, toggleInterestOptimistic, getInterestOffset, interestedMovieIds } = useData();

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
        // 1. Try dedicated highlights from new API
        if (highlightsMovies?.length) return highlightsMovies.slice(0, 6);

        // 2. Fallback to promoted movies if API is still loading or empty
        if (!movies?.length) return [];
        const promoted = movies.filter(m => m.isPromoted);
        return promoted.length > 0 ? promoted.slice(0, 5) : movies.slice(0, 5);
    }, [highlightsMovies, movies]);

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
    const displayedUpcoming = useMemo(() => {
        if (!upcomingMovies?.length) return [];
        return upcomingMovies.slice(0, 5);
    }, [upcomingMovies]);

    // Loading State -> Skeleton
    if (loading && !movies?.length) return <HomeSkeleton />;

    // Error State
    if (error && !movies?.length) return <ErrorState error={error} onRetry={refreshData} title="Connection Failed" />;

    return (
        <div className="min-h-screen bg-transparent text-black dark:text-gray-100 overflow-x-hidden font-sans transition-colors duration-300">
            <SEO
                title={`${selectedCity} - Book Movie Tickets Online | XYNEMA`}
                description="Book your favorite movies with ease and elegance."
            />

            {/* Flat Carousel Banner */}
            <div className="w-full bg-white dark:bg-[#1a1c23] pt-0.2 transition-colors duration-300">
                <HeroCarousel movies={bannerMovies} />
            </div>

            <main className="w-[85%] mx-auto pb-8 space-y-12 overflow-hidden">
                {/* Now Showing Section */}
                <section className="relative group/nowshowing">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            Now showing
                        </h2>
                        <Link to="/movies" className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <div className="relative">
                        <Swiper
                            modules={[Navigation]}
                            spaceBetween={10}
                            slidesPerView={2.3}
                            navigation={{
                                nextEl: '.now-showing-next',
                                prevEl: '.now-showing-prev',
                            }}
                            breakpoints={{
                                640: { slidesPerView: 3.5, spaceBetween: 10 },
                                768: { slidesPerView: 4.5, spaceBetween: 12 },
                                1024: { slidesPerView: 6.5, spaceBetween: 12 },
                            }}
                            className="!pb-4 !overflow-visible"
                        >
                            {recommendedMovies.map((movie, idx) => (
                                <SwiperSlide key={movie.id}>
                                    <MovieCard
                                        movie={{ ...movie, delayClass: `delay-[${(idx + 1) * 100}ms]` }}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Custom Navigation Arrows */}
                        <button className="now-showing-prev absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:shadow-xl transition-all hidden md:flex opacity-0 group-hover/nowshowing:opacity-100 disabled:opacity-0">
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <button className="now-showing-next absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:shadow-xl transition-all hidden md:flex opacity-0 group-hover/nowshowing:opacity-100 disabled:opacity-0">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </section>

                {/* Recommended for you Section */}
                {upcomingMovies.length > 0 && (
                    <section id="recommended-section" className="relative mt-12 group/recommended">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Recommended for you
                            </h2>
                            <Link to="/upcoming-movies" className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="relative">
                            <Swiper
                                modules={[Navigation]}
                                spaceBetween={12}
                                slidesPerView={2.2}
                                navigation={{
                                    nextEl: '.recommended-next',
                                    prevEl: '.recommended-prev',
                                }}
                                breakpoints={{
                                    640: { slidesPerView: 3.2, spaceBetween: 12 },
                                    768: { slidesPerView: 4.2, spaceBetween: 12 },
                                    1024: { slidesPerView: 6.2, spaceBetween: 12 },
                                }}
                                className="!pb-4 !overflow-visible"
                            >
                                {latestMovies.map((movie, idx) => (
                                    <SwiperSlide key={`latest-${movie.id}`}>
                                        <MovieCard
                                            movie={{ ...movie, delayClass: `delay-[${(idx + 1) * 100}ms]` }}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Custom Navigation Arrows */}
                            <button className="recommended-prev absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:shadow-xl transition-all hidden md:flex opacity-0 group-hover/recommended:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                            <button className="recommended-next absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:shadow-xl transition-all hidden md:flex opacity-0 group-hover/recommended:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Upcoming Movies Section */}
                {upcomingMovies.length > 0 && (
                    <section className="relative mt-16 group/upcoming">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Upcoming movies
                            </h2>
                            <Link to="/upcoming-movies" className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="relative">
                            <Swiper
                                modules={[Navigation]}
                                spaceBetween={12}
                                slidesPerView={2.2}
                                navigation={{
                                    nextEl: '.upcoming-next',
                                    prevEl: '.upcoming-prev',
                                }}
                                breakpoints={{
                                    640: { slidesPerView: 3.2, spaceBetween: 12 },
                                    768: { slidesPerView: 4.2, spaceBetween: 12 },
                                    1024: { slidesPerView: 6.2, spaceBetween: 12 },
                                }}
                                className="!pb-4 !overflow-visible"
                            >
                                {displayedUpcoming.map((movie, idx) => (
                                    <SwiperSlide key={`upcoming-new-${movie.id}`}>
                                        {/* Using the same MovieCard to benefit from the newly added glass effect */}
                                        <MovieCard
                                            movie={{ ...movie, delayClass: `delay-[${(idx + 1) * 100}ms]` }}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Custom Navigation Arrows designed based on visual high-contrast */}
                            <button className="upcoming-prev absolute -left-4 top-[40%] -translate-y-1/2 -translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-xynemaRose dark:hover:text-pink-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/upcoming:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                            <button className="upcoming-next absolute -right-4 top-[40%] -translate-y-1/2 translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-xynemaRose dark:hover:text-pink-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/upcoming:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Highlight Banner Section (16:9) */}
                {highlightsMovies?.length > 0 && (
                    <section className="relative mt-16 group/highlight-banner">
                        <div className="relative rounded-2xl overflow-hidden shadow-lg">
                            <Swiper
                                modules={[Navigation]}
                                spaceBetween={24}
                                slidesPerView={1}
                                navigation={{
                                    nextEl: '.highlight-banner-next',
                                    prevEl: '.highlight-banner-prev',
                                }}
                            >
                                {highlightsMovies.map((movie, idx) => {
                                    const linkUrl = movie.linkUrl || (movie.slug || movie.id ? `/movie/${movie.slug || movie.id}` : '#');

                                    return (
                                        <SwiperSlide key={`highlight-section-${movie.id}-${idx}`}>
                                            <a
                                                href={linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full aspect-video md:aspect-[4/3] lg:aspect-[21/2] relative overflow-hidden group/slide cursor-pointer"
                                            >
                                                <img
                                                    src={optimizeImage(movie.sectionImageUrl || movie.bannerImageUrl || movie.backdropUrl, { width: 1920, quality: 85 })}
                                                    alt={movie.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover transition-transform duration-700 ease-out"
                                                />
                                                {/* Optional gradient overlay for text readability if titles are added later */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300"></div>
                                            </a>
                                        </SwiperSlide>
                                    );
                                })}
                            </Swiper>

                            {/* Banner Navigation Arrows - visually distinct, inside the banner */}
                            <button className="highlight-banner-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/30 backdrop-blur-md rounded-full shadow-lg border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-all hidden md:flex opacity-0 group-hover/highlight-banner:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                            <button className="highlight-banner-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/30 backdrop-blur-md rounded-full shadow-lg border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition-all hidden md:flex opacity-0 group-hover/highlight-banner:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Trending Events Section */}
                {events?.length > 0 && (
                    <section className="relative mt-16 group/events">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Trending events
                            </h2>
                            <Link to="/events" className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="relative">
                            <Swiper
                                modules={[Navigation]}
                                spaceBetween={24}
                                slidesPerView={1}
                                navigation={{
                                    nextEl: '.events-next',
                                    prevEl: '.events-prev',
                                }}
                                breakpoints={{
                                    640: { slidesPerView: 2, spaceBetween: 24 },
                                    768: { slidesPerView: 3, spaceBetween: 24 },
                                    1024: { slidesPerView: 4, spaceBetween: 24 },
                                    1280: { slidesPerView: 4, spaceBetween: 24 },
                                }}
                                className="!pb-6"
                            >
                                {events.map((event, idx) => (
                                    <SwiperSlide key={`event-${event.id || idx}`}>
                                        <EventCard event={event} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Custom Navigation Arrows */}
                            <button className="events-prev absolute -left-4 top-[40%] -translate-y-1/2 -translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-[#2563EB] dark:hover:text-blue-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/events:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                            <button className="events-next absolute -right-4 top-[40%] -translate-y-1/2 translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-[#2563EB] dark:hover:text-blue-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/events:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Official Merchandise Section */}
                {MOCK_STORE_ITEMS.length > 0 && (
                    <section className="relative mt-16 mb-8 group/store">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Official merchandise
                            </h2>
                            <Link to="/store" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center gap-2 font-medium text-sm">
                                <ShoppingBag className="w-4 h-4" />
                                Visit Store
                            </Link>
                        </div>

                        <div className="relative">
                            <Swiper
                                modules={[Navigation]}
                                spaceBetween={24}
                                slidesPerView={2}
                                navigation={{
                                    nextEl: '.store-next',
                                    prevEl: '.store-prev',
                                }}
                                breakpoints={{
                                    640: { slidesPerView: 3, spaceBetween: 24 },
                                    768: { slidesPerView: 3, spaceBetween: 24 },
                                    1024: { slidesPerView: 4, spaceBetween: 24 },
                                    1280: { slidesPerView: 4, spaceBetween: 24 },
                                }}
                                className="!pb-6"
                            >
                                {MOCK_STORE_ITEMS.map((item, idx) => (
                                    <SwiperSlide key={`store-item-${item.id || idx}`}>
                                        <StoreCard item={item} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Custom Navigation Arrows */}
                            <button className="store-prev absolute -left-4 top-[40%] -translate-y-1/2 -translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-[#2563EB] dark:hover:text-blue-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                            <button className="store-next absolute -right-4 top-[40%] -translate-y-1/2 translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-[#2563EB] dark:hover:text-blue-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

// --- New EventCard Component ---
const EventCard = memo(({ event }) => {
    // Format the date precisely as requested
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(event.startDate || Date.now()));

    // Use absolute routing for events based on slug or ID
    const eventLink = `/event/${event.slug || event.id}`;

    return (
        <div className="bg-white dark:bg-[#1a1c23] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-all duration-300 cursor-pointer">
            <Link to={eventLink} className="block w-full">
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                        src={optimizeImage(event.imageUrl, { width: 600, height: 375, quality: 80 }) || 'https://via.placeholder.com/600x375?text=No+Image'}
                        alt={event.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                    />
                </div>
            </Link>
            <div className="p-5 flex flex-col flex-grow">
                <Link to={eventLink} className="mb-2 block">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-[1.05rem] leading-snug truncate transition-colors">
                        {event.name}
                    </h3>
                </Link>

                <div className="flex flex-col gap-2 mb-5">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="truncate">{event.city}</span>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                    <span className="font-bold text-[#1a5b8a] dark:text-blue-400 text-lg">
                        ₹{event.price ? event.price.toLocaleString() : 'Free'}
                    </span>
                    <Link
                        to={eventLink}
                        className="px-5 py-2 bg-[#427cae] text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </div>
    );
});

// ============= COMPONENT: HeroCarousel =============
const HeroCarousel = memo(({ movies }) => {
    if (!movies?.length) return null;

    return (
        <section className="w-full relative px-2">
            <style>
                {`
                .hero-swiper {
                    padding-bottom: 3rem !important; /* Space for pagination */
                }
                .hero-swiper .swiper-pagination-bullet {
                    width: 8px;
                    height: 8px;
                    background: #cbd5e1;
                    opacity: 1;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }
                .hero-swiper .swiper-pagination-bullet-active {
                    width: 32px;
                    background: #475e7a;
                }
                .dark .hero-swiper .swiper-pagination-bullet {
                    background: #475569;
                }
                .dark .hero-swiper .swiper-pagination-bullet-active {
                    background: #94a3b8;
                }
                `}
            </style>
            <Swiper
                modules={[Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1.15} // Adjusted to peek sides exactly like Figma
                centeredSlides={true}
                loop={true}
                speed={500}
                autoplay={{
                    delay: 1500,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: false,
                }}
                breakpoints={{
                    320: { slidesPerView: 1.1, spaceBetween: 12 },
                    640: { slidesPerView: 1.15, spaceBetween: 16 },
                    1024: { slidesPerView: 1.25, spaceBetween: 24 }, // Slightly wider peek on desktop
                }}
                className="hero-swiper w-full max-w-[1800px] mx-auto"
            >
                {movies.map((movie, index) => {
                    const linkUrl = movie.linkUrl || (movie.slug || movie.id ? `/movie/${movie.slug || movie.id}` : '#');

                    return (
                        <SwiperSlide key={`${movie.id}-${index}`}>
                            <div className="w-full aspect-[2/1] md:aspect-[21/6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <a
                                    href={linkUrl}
                                    className="block w-full h-full cursor-pointer"
                                >
                                    <img
                                        src={optimizeImage(movie.bannerImageUrl || movie.backdropUrl || movie.posterUrl, { width: 1400, quality: 85 }) || 'https://via.placeholder.com/1400x400?text=No+Image'}
                                        alt={movie.title}
                                        className="w-full h-full object-cover object-center"
                                        loading={index === 0 ? "eager" : "lazy"}
                                    />
                                </a>
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </section>
    );
});

// MovieCard moved to standalone component

// ============= COMPONENT: Skeleton Loader =============

const HomeSkeleton = () => (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0f1115] transition-colors duration-300">
        {/* MATCH HERO CAROUSEL */}
        <div className="w-full bg-[#f5f5f5] dark:bg-[#0f1115] pt-[10px] pb-[25px]">
            <div className="max-w-[1088px] mx-auto px-4 lg:px-0">
                <div
                    className="w-full bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse aspect-[16/9] md:aspect-[21/6]"
                />
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
            {/* RECOMMENDED SECTION SKELETON */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
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
                    <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex flex-col space-y-3">
                            <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-11/12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// --- StoreCard Component removed - moved to standalone component ---

// --- Mock Data ---


const MOCK_STORE_ITEMS = [
    {
        id: "store-1",
        name: "Cold white Tshirt",
        price: 849,
        sellers: 3,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=95&w=800"
    },
    {
        id: "store-2",
        name: "Charlie movie shirt",
        price: 849,
        sellers: 3,
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=95&w=800"
    },
    {
        id: "store-3",
        name: "Spiderverse T Shirt",
        price: 849,
        sellers: 3,
        imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=95&w=800"
    },
    {
        id: "store-4",
        name: "Premium Black Tee",
        price: 849,
        sellers: 3,
        imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=95&w=800"
    }
];

export default HomePage;

