import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    MapPin, Star, Clock, Users, Calendar, ArrowLeft, ArrowRight,
    ChevronLeft, ChevronRight, Info, CheckCircle2, ShoppingBag, Tag, Share2,
    ShieldCheck, X
} from 'lucide-react';
import { getParkBySlug, getAllParks } from '../services/parkService';
import { useData } from '../context/DataContext';
import LoadingScreen from '../components/LoadingScreen';
import apiCacheManager from '../services/apiCacheManager';
import SEO from '../components/SEO';
import ParkCard from '../components/ParkCard';
import StoreCard from '../components/StoreCard';
import RideCard from '../components/RideCard';
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
        const list = cachedParks?.parks || (Array.isArray(cachedParks) ? cachedParks : []);
        const found = list.find(p => p.slug === slug || p.id === slug || p._id === slug);
        if (found) return found;
        return null;
    });
    const [allParks, setAllParks] = useState(() => {
        const cached = apiCacheManager.get(`parks_${selectedCity || 'all'}`);
        return cached?.parks || (Array.isArray(cached) ? cached : []);
    });
    const [loading, setLoading] = useState(!park);
    const [activeGalleryIdx, setActiveGalleryIdx] = useState(null);
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
                if (parks) {
                    const parksList = parks.parks || (Array.isArray(parks) ? parks : []);
                    setAllParks(parksList.filter(p => p.slug !== slug && p.id !== slug));
                }
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

    const ridesToRender = park.topRides && park.topRides.length > 0 ? park.topRides : MOCK_TOP_RIDES;
    const galleryToRender = park.gallery && park.gallery.length > 0
        ? (park.gallery.length === 1 ? [...park.gallery, ...MOCK_GALLERY.slice(0, 3)] : park.gallery)
        : MOCK_GALLERY;

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

            {/* ── FIGMA HERO / BANNER ── */}
            <div className="relative w-full bg-[#1a1c23] dark:bg-[#0f1115] md:py-20 py-10 flex items-center justify-center overflow-hidden min-h-[480px]">
                {/* Ambient Blurred Dynamic Background mimicking Figma's thematic fill */}
                <div className="absolute inset-0 z-0 select-none">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                        style={{
                            backgroundImage: `url(${park.bannerImage})`,
                            filter: 'contrast(100%) brightness(1) saturate(1.1) url(#sharpen-filter)',
                            imageRendering: '-webkit-optimize-contrast',
                            opacity: 0.5
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                </div>

                {/* Floating Navigation Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-105 transition-all shadow-md"
                    title="Go Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Floating Navigation Share Button */}
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
                    className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-105 transition-all shadow-md"
                    title="Share Park"
                >
                    <Share2 className="w-4 h-4" />
                </button>

                {/* Hero Content Layout */}
                <div className="max-w-5xl mx-auto w-full px-6 relative z-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">
                    {/* Figma Rounded Poster */}
                    <div className="w-full md:w-[300px] shrink-0 aspect-[2/3] rounded-md overflow-hidden shadow-2xl border border-white/10 animate-in fade-in duration-700">
                        <img
                            src={park.posterImage}
                            alt={park.name}
                            className="w-full h-full object-cover select-none"
                            style={{
                                filter: 'contrast(100%) brightness(1.2) saturate(1)',
                                imageRendering: '-webkit-optimize-contrast'
                            }}
                            loading="eager"
                        />
                    </div>

                    {/* Figma Translucent Box Layout Wrapper */}
                    <div className="w-full md:w-[460px] flex flex-col gap-6 relative animate-in slide-in-from-right-8 duration-700 select-none">
                        {/* Glassmorphic Card */}
                        <div className="w-full bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-8 shadow-[0_24px_50px_rgba(0,0,0,0.25)] flex flex-col justify-between min-h-[240px]">
                            <div className="space-y-4">
                                {/* Category Badge */}
                                <div className="self-start inline-block px-4 py-1.5 bg-primary/90 rounded-full shadow-md">
                                    <span className="text-[11px] font-bold tracking-wide text-white uppercase select-none">
                                        {park.type}
                                    </span>
                                </div>

                                {/* Name */}
                                <h1 className="text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-md">
                                    {park.name}
                                </h1>

                                {/* Ratings & Loc Row */}
                                <div className="space-y-3 pt-1">
                                    <div className="flex items-center gap-2 text-white/90 drop-shadow-sm">
                                        <Star className="w-4 h-4 text-rose-500 fill-current" />
                                        <span className="text-sm font-bold">{park.rating || '4.8'}/5</span>
                                        <span className="text-xs text-white/60 font-medium">({park.reviewCount || '2.5K'} ratings)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/80 drop-shadow-sm">
                                        <MapPin className="w-4 h-4 text-white/70" />
                                        <span className="text-sm font-semibold tracking-wide">{park.city}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Full Width Figma CTA Button Placed OUT OF BOTTOM from the Glasscard */}
                        <button
                            onClick={() => navigate(`/park/${slug}/tickets`, { state: { park } })}
                            className="w-full py-5 bg-primary text-white font-extrabold tracking-wider rounded-md shadow-[0_12px_32px_rgba(239,68,68,0.4)] hover:shadow-[0_16px_40px_rgba(239,68,68,0.6)] hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] transition-all text-sm text-center uppercase flex items-center justify-center"
                        >
                            Book Tickets
                        </button>
                    </div>
                </div>
            </div>

            {/* ── FIGMA QUICK STATS BAR ── */}
            <div className="border-b border-gray-100 dark:border-gray-800 py-8 bg-white dark:bg-[#16181d] select-none relative z-20">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: "Opening Hours", value: park.openingHours },
                            { label: "Best For", value: park.bestFor },
                            { label: "Minimum Age", value: park.topTime },
                            { label: "Peak Season", value: park.bestSeason }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wide uppercase">{stat.label}</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CONTENT BODY CONTAINER ── */}
            <div className="bg-white dark:bg-[#0f1115] transition-colors duration-300 pb-28">
                <div className="max-w-5xl mx-auto px-6 pt-8 space-y-10">

                    {/* Figma About Section */}
                    <section className="space-y-4 animate-in fade-in duration-500">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            About {park.shortName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium text-justify md:text-justify">
                            {park.description}
                        </p>
                    </section>

                    {/* Figma Location Box */}
                    <section className="animate-in fade-in duration-500">
                        <div className="border border-gray-100 dark:border-gray-800 rounded-md p-4 bg-[#fcfcfc] dark:bg-[#13151a] space-y-6 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Location</h2>
                            <div className="flex flex-row justify-between gap-6">
                                <div className="flex items-start md:items-center gap-3">
                                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {park.location}
                                    </p>
                                </div>
                                <a
                                    href={park.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-md hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20 w-fit text-center uppercase tracking-wide"
                                >
                                    Get directions
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Figma Top Rides Carousel Slider */}
                    <section className="space-y-6 animate-in fade-in duration-500 group/rides relative select-none">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                Top rides
                            </h2>
                            {/* A simple arrow sitting on the right of the header as requested in Figma layout */}
                            <ChevronRight className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                        </div>

                        <div className="relative">
                            <Swiper
                                modules={[Navigation]}
                                slidesPerView={1}
                                spaceBetween={20}
                                navigation={{
                                    nextEl: '.park-rides-next',
                                    prevEl: '.park-rides-prev',
                                }}
                                breakpoints={{
                                    640: { slidesPerView: 2, spaceBetween: 20 },
                                    1024: { slidesPerView: 3, spaceBetween: 20 },
                                }}
                                className="!pb-4"
                            >
                                {ridesToRender.map((ride, idx) => (
                                    <SwiperSlide key={idx} className="!h-auto flex">
                                        <RideCard ride={ride} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Floating Right Navigation Toggle EXACTLY mimicking the Figma design */}
                            <button className="park-rides-next absolute right-[-28px] top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white dark:bg-gray-900 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-lg border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-800 dark:text-gray-200 transition-all disabled:hidden [&.swiper-button-disabled]:hidden hover:scale-105 active:scale-95">
                                <ChevronRight className="w-6 h-6" />
                            </button>

                            <button className="park-rides-prev absolute left-[-28px] top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white dark:bg-gray-900 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-lg border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-800 dark:text-gray-200 transition-all disabled:hidden [&.swiper-button-disabled]:hidden hover:scale-105 active:scale-95">
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                        </div>
                    </section>

                    {/* Figma Important Info */}
                    {((park.rules && park.rules.length > 0) || park.safetyText) && (
                        <section className="space-y-6 animate-in fade-in duration-500">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Important info</h2>
                            <div className="space-y-3">
                                {park.rules && park.rules.length > 0 ? (
                                    park.rules.map((rule, idx) => (
                                        <div key={idx} className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 animate-pulse" />
                                            <p className="text-sm font-semibold text-gray-800 dark:text-rose-100">{rule}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                                        <div className="w-2 h-2 bg-primary rounded-full shrink-0 animate-pulse" />
                                        <p className="text-sm font-semibold text-gray-800 dark:text-rose-100">{park.safetyText}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Facilities Available */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Facilities available</h2>
                        <div className="flex flex-wrap gap-3">
                            {park.facilities?.map((fac, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 px-5 py-3.5 bg-[#fafafa] dark:bg-[#16181d] rounded-full border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary/30 transition-all select-none group">
                                    <CheckCircle2 className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-bold tracking-wide text-gray-600 dark:text-gray-300 uppercase">
                                        {fac}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Visual Gallery */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Visual Gallery</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[200px] gap-4">
                            {galleryToRender.slice(0, 4).map((imgUrl, idx) => {
                                const spans = [
                                    "col-span-2 row-span-2", // feature
                                    "col-span-2 row-span-1",
                                    "col-span-1 row-span-1",
                                    "col-span-1 row-span-1"

                                ];
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveGalleryIdx(idx)}
                                        className={`relative group overflow-hidden rounded-md shadow-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 cursor-pointer ${spans[idx % spans.length]}`}
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`Gallery detail ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-1 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-500 flex items-center justify-center">
                                            {/* <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                                                <ArrowRight className="w-5 h-5 rotate-[-45deg]" />
                                            </div> */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Store Section */}
                    {(() => {
                        const storeItemsToRender = park.storeItems && park.storeItems.length > 0 ? park.storeItems : MOCK_STORE_ITEMS;
                        return storeItemsToRender && storeItemsToRender.length > 0 && (
                            <section className="relative group/store space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Explore the store</h3>
                                    <Link to="/store" className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4" />
                                        Visit Store
                                    </Link>
                                </div>

                                <div className="relative">
                                    <Swiper
                                        modules={[Navigation]}
                                        slidesPerView={2}
                                        spaceBetween={10}
                                        navigation={{
                                            nextEl: '.park-store-next',
                                            prevEl: '.park-store-prev',
                                        }}
                                        breakpoints={{
                                            640: { slidesPerView: 3, spaceBetween: 12 },
                                            768: { slidesPerView: 3, spaceBetween: 12 },
                                            1024: { slidesPerView: 4, spaceBetween: 12 },
                                        }}
                                        className="!pb-6 !px-1"
                                    >
                                        {storeItemsToRender.map((item, idx) => (
                                            <SwiperSlide key={item.id || idx} className="!h-auto">
                                                <StoreCard item={{ ...item, imageUrl: item.imageUrl || item.image }} />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>

                                    {/* Navigation Arrows */}
                                    <button className="park-store-prev absolute left-2 md:left-0 md:-ml-4 top-[40%] -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 dark:bg-gray-800/90 rounded-full shadow border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-300 hover:text-primary transition-all opacity-100 disabled:hidden [&.swiper-button-disabled]:hidden">
                                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                                    </button>
                                    <button className="park-store-next absolute right-2 md:right-0 md:-mr-4 top-[40%] -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 dark:bg-gray-800/90 rounded-full shadow border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-300 hover:text-primary transition-all opacity-100 disabled:hidden [&.swiper-button-disabled]:hidden">
                                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>
                            </section>
                        );
                    })()}

                    {/* Similar Picks */}
                    <section className="relative group/similar space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Similar picks</h2>
                            <div className="flex gap-2">
                                <button className="similar-parks-prev w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary hover:border-primary transition-all disabled:opacity-30 bg-white dark:bg-gray-900 shadow-sm">
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                <button className="similar-parks-next w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary hover:border-primary transition-all disabled:opacity-30 bg-white dark:bg-gray-900 shadow-sm">
                                    <ChevronRight className="w-4 h-4" />
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
                                    640: { slidesPerView: 2, spaceBetween: 24 },
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
            {/* ── FIGMA FULLSCREEN IMAGE LIGHTBOX OVERLAY ── */}
            {activeGalleryIdx !== null && (
                <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center select-none animate-in fade-in duration-300" onClick={() => setActiveGalleryIdx(null)}>

                    {/* Top Controls */}
                    <div className="absolute top-6 right-6 left-6 flex items-center justify-between text-white z-50">
                        <span className="text-sm font-bold text-white/60 font-display tracking-wider">
                            {activeGalleryIdx + 1} / {galleryToRender.slice(0, 4).length}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveGalleryIdx(null); }}
                            className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 hover:rotate-90 duration-300 shadow-md"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Left Navigation Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveGalleryIdx(prev => prev === 0 ? galleryToRender.slice(0, 4).length - 1 : prev - 1);
                        }}
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10 shadow-2xl"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    {/* Right Navigation Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveGalleryIdx(prev => prev === galleryToRender.slice(0, 4).length - 1 ? 0 : prev + 1);
                        }}
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10 shadow-2xl"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    {/* The Full Screen Image Frame */}
                    <div className="w-full max-w-5xl max-h-[85vh] p-4 flex items-center justify-center relative animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={galleryToRender.slice(0, 4)[activeGalleryIdx]}
                            alt={`Fullscreen visual view`}
                            className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-[0_24px_60px_rgba(0,0,0,0.7)] select-none border border-white/10"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const MOCK_TOP_RIDES = [
    {
        name: "Roller Coaster",
        image: "https://www.l-tron.com/wp-content/uploads/2017/07/roller-coaster2.jpg",
        description: "Zoom down the steepest coaster track ever built in South India. A thrilling experience!"
    },
    {
        name: "Wave Pool",
        image: "https://wildwaters.in/images/land-rides/4.webp",
        description: "Feel the rush of the ocean as you ride the waves! Our massive wave pool creates thrilling currents and splashes for endless fun."
    },
    {
        name: "Break Dance",
        image: "https://tiimg.tistatic.com/fp/1/009/634/amusement-rides-093.jpg",
        description: "Break Dance is a classic fairground ride known for its energetic rotation and spinning motion."
    },
    {
        name: "Rajasaurus River Adventure",
        image: "https://www.imagicaaworld.com/wp-content/uploads/2023/08/banner_rajasaurusriveradventure_2.jpg",
        description: "Get ready for a wild river ride as you escape from the claws of the mighty Rajasaurus. Brace yourself for thrilling twists and turns as you navigate the raging river."
    }
];

const MOCK_GALLERY = [
    "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=1000",
    "https://images.unsplash.com/photo-1531266752426-adf4776427f3?q=80&w=1000",
    "https://images.unsplash.com/photo-1572508589584-94d778209dd9?q=80&w=1000",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000"
];

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