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
import HeroCarousel from '../components/HeroCarousel';
import LoadingScreen from '../components/LoadingScreen';

const HomePage = ({ selectedCity }) => {
    const { movies, latestMovies, upcomingMovies, highlightsMovies, events, loading, error, refreshData, toggleInterestOptimistic, getInterestOffset, interestedMovieIds } = useData();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        if (!highlightsMovies?.length) return [];

        return highlightsMovies.filter(m => {
            const mobileImg = m.mobileBannerImage?.url || m.mobileBannerImage;
            const desktopImg = m.bannerImageUrl?.url || m.bannerImageUrl;
            if (isMobile) {
                // Use mobile specific banner activation flag
                return m.isActive && m.isMobileBannerImageUrlActive && mobileImg;
            } else {
                // Per user: in desktop view use isBannerImageUrlActive is true then show
                return m.isActive && m.isBannerImageUrlActive && desktopImg;
            }
        });
    }, [highlightsMovies, isMobile]);

    const randomSectionBanner = useMemo(() => {
        if (!highlightsMovies?.length) return null;

        const activeBanners = highlightsMovies.filter(m => {
            const mobileSection = m.mobileSectionImage?.url || m.mobileSectionImage;
            const desktopSection = m.sectionImageUrl?.url || m.sectionImageUrl;
            if (isMobile) {
                return m.isActive && m.isMobileSectionImageUrlActive && mobileSection;
            } else {
                return m.isActive && m.isSectionImageUrlActive && desktopSection;
            }
        });

        if (activeBanners.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * activeBanners.length);
        return activeBanners[randomIndex];
    }, [highlightsMovies, isMobile]);

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

    // Loading State -> Common Loading Animation
    if (loading && !movies?.length) return <LoadingScreen message="Finding the best movies for you..." />;

    // Error State
    if (error && !movies?.length) return <ErrorState error={error} onRetry={refreshData} title="Connection Failed" />;

    return (
        <div className="min-h-screen bg-transparent text-black dark:text-gray-100 overflow-x-hidden font-sans transition-colors duration-300">
            <SEO
                title={`${selectedCity} - Book Movie Tickets Online | XYNEMA`}
                description="Book your favorite movies with ease and elegance."
                preloads={bannerMovies.map(m => (m.mobileBannerImage?.url || m.mobileBannerImage) || (m.bannerImageUrl?.url || m.bannerImageUrl) || (m.backdropUrl?.url || m.backdropUrl) || (m.posterUrl?.url || m.posterUrl)).filter(Boolean).map(url => optimizeImage(url, { width: 1400, quality: 85 }))}
            />

            {/* Flat Carousel Banner */}
            <div className="w-full bg-white dark:bg-[#1a1c23] pt-0.5 transition-colors duration-300">
                <HeroCarousel movies={bannerMovies} isMobile={isMobile} />
            </div>

            <main className="max-w-[1440px] w-full mx-auto pb-20 lg:pb-8 space-y-12 overflow-hidden px-4 sm:px-6 lg:px-8">
                {/* Now Showing Section */}
                {/* <section className="relative group/nowshowing">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-display uppercase">
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
                    */}
                {/* Custom Navigation Arrows */}
                {/*  <button className="now-showing-prev absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:shadow-xl transition-all hidden md:flex opacity-0 group-hover/nowshowing:opacity-100 disabled:opacity-0">
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <button className="now-showing-next absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:shadow-xl transition-all hidden md:flex opacity-0 group-hover/nowshowing:opacity-100 disabled:opacity-0">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </section> */}

                {/* Recommended for you Section */}
                {upcomingMovies.length > 0 && (
                    <section id="recommended-section" className="relative mt-12 group/recommended">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-roboto">
                                Recommended for you
                            </h2>
                            <Link to="/movies?tab=now-showing" className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="relative">
                            <Swiper
                                modules={[Navigation]}
                                spaceBetween={16}
                                slidesPerView={2}
                                navigation={{
                                    nextEl: '.recommended-next',
                                    prevEl: '.recommended-prev',
                                }}
                                breakpoints={{
                                    320: { slidesPerView: 2, spaceBetween: 16 },
                                    480: { slidesPerView: 2, spaceBetween: 16 },
                                    640: { slidesPerView: 3, spaceBetween: 24 },
                                    768: { slidesPerView: 3, spaceBetween: 24 },
                                    1024: { slidesPerView: 4, spaceBetween: 32 },
                                    1280: { slidesPerView: 5, spaceBetween: 34 },
                                    1536: { slidesPerView: 5, spaceBetween: 34 },
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
                            <button className="recommended-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 md:w-12 md:h-12 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary transition-all hidden md:flex opacity-0 group-hover/recommended:opacity-100 disabled:opacity-0 -ml-4">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                            <button className="recommended-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 md:w-12 md:h-12 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary transition-all hidden md:flex opacity-0 group-hover/recommended:opacity-100 disabled:opacity-0 -mr-4">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Upcoming Movies Section */}
                {/* {upcomingMovies.length > 0 && (
                    <section className="relative mt-16 group/upcoming">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-display uppercase">
                                Upcoming movies
                            </h2>
                            <Link to="/movies?tab=upcoming" className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
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
                            >*/}
                {/*  {displayedUpcoming.map((movie, idx) => (
                                    <SwiperSlide key={`upcoming-new-${movie.id}`}>*/}
                {/* Using the same MovieCard to benefit from the newly added glass effect */}
                {/*  <MovieCard
                                            movie={{ ...movie, delayClass: `delay-[${(idx + 1) * 100}ms]` }}
                                        />
                                    </SwiperSlide>
                                ))} 
                            </Swiper>*/}

                {/* Custom Navigation Arrows designed based on visual high-contrast */}
                {/* <button className="upcoming-prev absolute -left-4 top-[40%] -translate-y-1/2 -translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/upcoming:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                            <button className="upcoming-next absolute -right-4 top-[40%] -translate-y-1/2 translate-x-full z-10 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/upcoming:opacity-100 disabled:opacity-0">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </section>
                )} */}

                {/* Highlight Banner Section (16:9) - Random Single Banner */}
                {randomSectionBanner && (
                    <section className="relative mt-16 group/highlight-banner">
                        <div className="relative rounded-xl overflow-hidden shadow-md">
                            <a
                                href={randomSectionBanner.linkUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full aspect-video md:aspect-[21/2] lg:aspect-[21/2] relative overflow-hidden group/slide cursor-pointer"
                            >
                                <img
                                    src={optimizeImage(isMobile ? (randomSectionBanner.mobileSectionImage?.url || randomSectionBanner.mobileSectionImage) : (randomSectionBanner.sectionImageUrl?.url || randomSectionBanner.sectionImageUrl), { width: 1920, quality: 100 })}
                                    alt={randomSectionBanner.title}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out"
                                />
                                {/* Optional gradient overlay for text readability if titles are added later */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300"></div>
                            </a>
                        </div>
                    </section>
                )}

                {/* Trending Events Section */}
                {events?.length > 0 && (
                    <section className="relative mt-16 group/events">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-roboto">
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
                                    320: { slidesPerView: 1, spaceBetween: 16 },
                                    480: { slidesPerView: 1, spaceBetween: 16 },
                                    640: { slidesPerView: 2, spaceBetween: 20 },
                                    768: { slidesPerView: 2, spaceBetween: 24 },
                                    1024: { slidesPerView: 3, spaceBetween: 24 },
                                    1280: { slidesPerView: 3, spaceBetween: 24 },
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
                            <button className="events-prev absolute left-0 top-[40%] -translate-y-1/2 z-20 w-10 md:w-14 md:h-14 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-300 hover:text-primary transition-all hidden md:flex opacity-0 group-hover/events:opacity-100 disabled:opacity-0 -ml-4">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
                            </button>
                            <button className="events-next absolute right-0 top-[40%] -translate-y-1/2 z-20 w-10 md:w-14 md:h-14 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-300 hover:text-primary transition-all hidden md:flex opacity-0 group-hover/events:opacity-100 disabled:opacity-0 -mr-4">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                    </section>
                )}

                {/* Official Merchandise Section */}
                {MOCK_STORE_ITEMS.length > 0 && (
                    <section className="relative mt-16 mb-8 group/store">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-roboto">
                                Official merchandise
                            </h2>
                            <Link to="" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center gap-2 font-medium text-sm">
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
                                    320: { slidesPerView: 2, spaceBetween: 16 },
                                    480: { slidesPerView: 2, spaceBetween: 16 },
                                    640: { slidesPerView: 2, spaceBetween: 24 },
                                    768: { slidesPerView: 3, spaceBetween: 24 },
                                    1024: { slidesPerView: 3, spaceBetween: 24 },
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
                            <button className="store-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 md:h-14 md:w-14 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-white hover:text-primary transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0 -ml-4">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
                            </button>
                            <button className="store-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 md:h-14 md:w-14 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-white hover:text-primary transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0 -mr-4">
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
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
        <Link to={eventLink} className="group block w-full">
            <div className="bg-white dark:bg-[#1a1c23] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-all duration-300 cursor-pointer hover:shadow-md">
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                        src={optimizeImage(event.imageUrl, { width: 600, height: 375, quality: 80 }) || 'https://via.placeholder.com/600x375?text=No+Image'}
                        alt={event.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-1"
                    />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-2 block">
                        <h3 className="font-bold text-gray-900 dark:text-white text-[1.05rem] leading-snug truncate transition-colors font-roboto group-hover:text-primary">
                            {event.name}
                        </h3>
                    </div>

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
                        <span className="font-bold text-primary dark:text-primary text-lg">
                            ₹{event.price ? event.price.toLocaleString() : 'Free'}
                        </span>
                        <div
                            className="px-5 py-2 bg-primary text-white text-[10px] font-bold rounded-lg shadow-lg shadow-primary/20 transition-all font-roboto tracking-wider hover:brightness-110 active:scale-95"
                        >
                            Book Now
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});

// --- Standalone component extracted ---

// MovieCard moved to standalone component


// --- StoreCard Component removed - moved to standalone component ---

// --- Mock Data ---


const MOCK_STORE_ITEMS = [
    {
        id: "store-1",
        name: "Petta T-Shirt",
        price: 1499,
        sellers: 6,
        imageUrl: "https://gfashion.in/cdn/shop/products/petta-t-shirts_petta-movie-stills_1024x1024.jpg?v=1600843977"
    },
    {
        id: "store-2",
        name: "Salaar Wall frame",
        price: 5599,
        sellers: 2,
        imageUrl: "https://m.media-amazon.com/images/I/61R6HVFJ5iL.jpg"
    },
    {
        id: "store-3",
        name: "Spiderman Mask",
        price: 499,
        sellers: 4,
        imageUrl: "https://www.heartmades.in/web/image/product.product/1949/image_1024/"
    },
    {
        id: "store-4",
        name: "Marvel Mug",
        price: 55990,
        sellers: 1,
        imageUrl: "https://m.media-amazon.com/images/I/712PMgYmsNL._AC_UF894,1000_QL80_.jpg"
    }
];

export default HomePage;

