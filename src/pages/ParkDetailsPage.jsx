import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    MapPin, Star, Clock, Users, Calendar, ArrowLeft, ArrowRight,
    ChevronLeft, ChevronRight, Info, CheckCircle2, ShoppingBag, Tag, Share2
} from 'lucide-react';
import { getParkBySlug, getAllParks } from '../services/parkService';
import { useData } from '../context/DataContext';
import LoadingScreen from '../components/LoadingScreen';
import apiCacheManager from '../services/apiCacheManager';
import SEO from '../components/SEO';
import ParkCard from '../components/ParkCard';
import StoreCard from '../components/StoreCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const ParkDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedCity } = useData();
    const [park, setPark] = useState(() => {
        if (location.state?.park) return location.state.park;
        const directDetails = apiCacheManager.get(`park_details_${slug}`);
        if (directDetails) return directDetails;
        const cachedParks = apiCacheManager.get(`parks_${selectedCity || 'all'}`);
        if (Array.isArray(cachedParks)) {
            const found = cachedParks.find(p => p.slug === slug || p.id === slug || p._id === slug);
            if (found) return found;
        }
        return null;
    });
    const [allParks, setAllParks] = useState(() => {
        const cached = apiCacheManager.get(`parks_${selectedCity || 'all'}`);
        return Array.isArray(cached) ? cached : [];
    });
    const [loading, setLoading] = useState(!park);

    const heroButtonRef = useRef(null);
    const [heroButtonVisible, setHeroButtonVisible] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setHeroButtonVisible(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        if (heroButtonRef.current) {
            observer.observe(heroButtonRef.current);
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 800);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (heroButtonRef.current) {
                observer.unobserve(heroButtonRef.current);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, [park]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const statePark = location.state?.park;
                const hasMatchingStatePark = statePark && (statePark.slug === slug || statePark.id === slug || statePark._id === slug);
                
                if (!hasMatchingStatePark) {
                    setLoading(true);
                }

                const fetchParkTask = (!hasMatchingStatePark || !statePark.description) 
                    ? apiCacheManager.getOrFetchParkDetails(slug, () => getParkBySlug(slug)) 
                    : Promise.resolve(statePark);
                
                const [data, parks] = await Promise.all([
                    fetchParkTask,
                    apiCacheManager.getOrFetchParks(selectedCity || 'Kochi', () => getAllParks({ city: selectedCity || 'Kochi' }))
                ]);
                
                if (data) setPark(data);
                if (parks) setAllParks(parks.filter(p => p.slug !== slug && p.id !== slug));
            } catch (err) {
                console.error("Error fetching park details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
        window.scrollTo(0, 0);
    }, [slug, selectedCity, location.state]);



    if (loading) return <LoadingScreen message="Loading park details..." />;
    if (!park) return (
        <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
            Park not found
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <SEO title={`${park.name} - Xynema`} description={park.description} />

            {/* Sharpness Filter Definition */}
            <svg style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <filter id="sharpen-filter">
                    <feConvolveMatrix
                        order="3"
                        kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"
                        preserveAlpha="true"
                    />
                </filter>
            </svg>

            {/* ── HERO / BANNER ── */}
            <div className="relative pt-32 md:pt-40 pb-16 overflow-hidden">
                {/* Background Image with Blur and Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={park.bannerImage}
                        alt=""
                        width="3840"
                        height="2400"
                        className="w-full h-full object-cover scale-1 transition-all duration-700"
                        style={{
                            filter: 'contrast(100%) brightness(0.8) saturate(1.2) url(#sharpen-filter)',
                            imageRendering: '-webkit-optimize-contrast'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md"
                    title="Go Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Share Button */}
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: park.name,
                                text: park.description,
                                url: window.location.href,
                            }).catch(err => console.error(err));
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Link copied to clipboard!");
                        }
                    }}
                    className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md"
                    title="Share Park"
                >
                    <Share2 className="w-4 h-4" />
                </button>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-end">
                        
                        {/* Poster with Glow – now using 2000x3160 aspect ratio */}
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-64 md:w-80 aspect-[2000/3160] rounded-[32px] overflow-hidden shadow-2xl shadow-black/50 relative border border-white/10">
                                <img
                                    src={park.posterImage}
                                    alt={park.name}
                                    width="2000"
                                    height="3160"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-1"
                                    style={{
                                        filter: 'contrast(100%) brightness(1.3) saturate(1.2) ',
                                        imageRendering: '-webkit-optimize-contrast'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Info Card - Glassmorphism */}
                        <div className="flex-1 w-full md:w-auto">
                            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 md:p-10 shadow-2xl mb-6">
                                {/* Type badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary rounded-full mb-4">
                                    <span className="text-[10px] font-black tracking-widest text-white uppercase">
                                        {park.type}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight drop-shadow-sm">
                                    {park.name}
                                </h1>

                                {/* Meta */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-white/90">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="text-sm font-bold">{park.rating || '4.8'}/5</span>
                                        </div>
                                        <span className="text-xs text-white/60 font-medium">({park.reviewCount || '2.5K'} ratings)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/80">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-bold tracking-wide">{park.city}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                ref={heroButtonRef}
                                onClick={() => navigate(`/park/${slug}/tickets`, { state: { park } })}
                                className="w-full py-5 bg-primary text-white font-black tracking-[0.2em] uppercase rounded-2xl shadow-2xl shadow-primary/40 hover:brightness-110 hover:-translate-y-1 active:scale-95 transition-all text-sm"
                            >
                                Book Tickets
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── QUICK STATS ROW ── */}
            <div className="border-y border-gray-100 dark:border-gray-800 py-5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Opening Hours</p>
                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">{park.openingHours}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Best For</p>
                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">{park.bestFor}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Minimum Age</p>
                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">{park.topTime}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Peak Season</p>
                            <p className="text-xs font-black text-gray-700 dark:text-gray-300">{park.bestSeason}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONTENT BODY ── */}
            <div className="max-w-7xl mx-auto px-6 space-y-14 pb-28 pt-10">

                {/* About */}
                <section>
                    <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">
                        About {park.shortName}
                    </h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed max-w-4xl">
                        {park.description}
                    </p>
                </section>

                {/* Location */}
                <section>
                    <div className="bg-gray-50 dark:bg-gray-800/20 rounded-2xl p-7 border border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white mb-5">Location</h2>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 max-w-md leading-snug">
                                    {park.location}
                                </p>
                            </div>
                            <a
                                href={park.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 px-5 py-2.5 bg-primary text-white text-[10px] font-black tracking-widest uppercase rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
                            >
                                Get Directions
                            </a>
                        </div>
                    </div>
                </section>

                {/* Top Rides */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-black text-gray-900 dark:text-white">Top rides</h2>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {park.topRides?.map((ride, idx) => (
                            <div key={idx} className="group">
                                <div className="aspect-video rounded-xl overflow-hidden mb-3 border border-gray-100 dark:border-gray-800">
                                    <img
                                        src={ride.image}
                                        alt={ride.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="font-black text-gray-800 dark:text-gray-200 text-sm mb-1">{ride.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2">{ride.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Important Info */}
                <section>
                    <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Important info</h2>
                    <div className="bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{park.safetyText}</p>
                    </div>
                </section>

                {/* Facilities */}
                <section className="bg-gray-50 dark:bg-gray-800/20 rounded-2xl px-8 py-9 border border-gray-100 dark:border-gray-800">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white mb-7">Facilities available</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-7 gap-x-10">
                        {park.facilities?.map((fac, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-primary/30 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-tight text-gray-600 dark:text-gray-400">
                                    {fac}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Gallery */}
                <section>
                    <h2 className="text-base font-black text-gray-900 dark:text-white mb-6">Gallery</h2>
                    <div className="max-w-xs">
                        <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
                            <img
                                src={park.gallery?.[0] || park.bannerImage}
                                alt="Gallery"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </section>

                {/* Store Section */}
                {(() => {
                    const storeItemsToRender = park.storeItems && park.storeItems.length > 0 ? park.storeItems : MOCK_STORE_ITEMS;
                    return storeItemsToRender && storeItemsToRender.length > 0 && (
                        <section className=" relative group/store">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Explore the store</h3>
                                <Link to="/store" className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    Visit Store
                                </Link>
                            </div>

                            <div className="relative">
                                <Swiper
                                    modules={[Navigation]}
                                    slidesPerView={2}
                                    spaceBetween={16}
                                    navigation={{
                                        nextEl: '.park-store-next',
                                        prevEl: '.park-store-prev',
                                    }}
                                    breakpoints={{
                                        640: { slidesPerView: 3, spaceBetween: 24 },
                                        768: { slidesPerView: 3, spaceBetween: 24 },
                                        1024: { slidesPerView: 4, spaceBetween: 24 },
                                    }}
                                    className="!pb-6 !px-1"
                                >
                                    {storeItemsToRender.map((item, idx) => (
                                        <SwiperSlide key={item.id || idx} className="!h-auto">
                                            <StoreCard item={{ ...item, imageUrl: item.imageUrl || item.image }} />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>

                                {/* Custom Navigation Arrows */}
                                <button className="park-store-prev absolute -left-4 top-[40%] -translate-y-1/2 -translate-x-12 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0 xl:-translate-x-full">
                                    <ChevronRight className="w-6 h-6 rotate-180" />
                                </button>
                                <button className="park-store-next absolute -right-4 top-[40%] -translate-y-1/2 translate-x-12 z-10 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[#1E2532] dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hidden md:flex opacity-0 group-hover/store:opacity-100 disabled:opacity-0 xl:translate-x-full">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </section>
                    );
                })()}

                {/* Similar Picks */}
                <section className="relative group/similar">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-black text-gray-900 dark:text-white">Similar picks</h2>
                        <div className="flex gap-2">
                            <button className="similar-parks-prev w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary hover:border-primary transition-all disabled:opacity-30 disabled:pointer-events-none bg-white dark:bg-gray-900 shadow-sm">
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                            <button className="similar-parks-next w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary hover:border-primary transition-all disabled:opacity-30 disabled:pointer-events-none bg-white dark:bg-gray-900 shadow-sm">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Swiper
                            modules={[Navigation]}
                            slidesPerView={1}
                            spaceBetween={16}
                            navigation={{
                                nextEl: '.similar-parks-next',
                                prevEl: '.similar-parks-prev',
                            }}
                            breakpoints={{
                                640: { slidesPerView: 3, spaceBetween: 24 },
                                768: { slidesPerView: 3, spaceBetween: 24 },
                                1024: { slidesPerView: 4, spaceBetween: 24 },
                            }}
                            className="!pb-6 !px-1"
                        >
                            {allParks.map((p) => (
                                <SwiperSlide key={p.id} className="!h-auto">
                                    <ParkCard park={p} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </section>
            </div>

            {/* ── MOBILE BOTTOM BAR ── */}
            {(!heroButtonVisible || isScrolled) && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] animate-in slide-in-from-bottom duration-300 pb-safe">
                    <div className="bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800 shadow-[0_-15px_50px_rgba(0,0,0,0.12)] p-4">
                        <button
                            onClick={() => navigate(`/park/${slug}/tickets`, { state: { park } })}
                            className="w-full py-4 bg-primary text-white font-black tracking-widest uppercase rounded-2xl shadow-xl shadow-primary/20 text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <span>Book Tickets</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MOCK_STORE_ITEMS = [
    {
        id: "store-1",
        name: "Confetti paper 250g",
        price: 250,
        sellers: 3,
        imageUrl: "https://img.freepik.com/premium-photo/colorful-background-with-confetti-place-party_577115-136303.jpg"
    },
    {
        id: "store-2",
        name: "Magician hat",
        price: 1599,
        sellers: 3,
        imageUrl: "https://thumbs.dreamstime.com/b/magician-top-hat-magic-wand-shiny-grey-background-332855369.jpg"
    },
    {
        id: "store-3",
        name: "Casual Dress set",
        price: 4399,
        sellers: 3,
        imageUrl: "https://crocodile.in/cdn/shop/files/2_67bc818f-423e-4730-b639-e97cbc7b1533.jpg?v=1756896672&width=1672"
    },
    {
        id: "store-4",
        name: "Painting kit",
        price: 1000,
        sellers: 3,
        imageUrl: "https://p9artboutique.co.uk/cdn/shop/files/oil_paint_set_amazon_new_version_2000x2000_6a185091-8142-46ac-b4e4-1ee6e6b6d976.png?v=1756616128&width=1946"
    }
];

export default ParkDetailsPage;