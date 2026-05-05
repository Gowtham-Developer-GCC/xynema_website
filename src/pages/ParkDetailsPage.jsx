import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    MapPin, Star, Clock, Users, Calendar, ArrowLeft, ArrowRight,
    ChevronLeft, ChevronRight, Info, CheckCircle2, ShoppingBag, Tag
} from 'lucide-react';
import { getParkBySlug, getAllParks } from '../services/parkService';
import LoadingScreen from '../components/LoadingScreen';
import SEO from '../components/SEO';
import ParkCard from '../components/ParkCard';

const ParkDetailsPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [park, setPark] = useState(location.state?.park || null);
    const [allParks, setAllParks] = useState([]);
    const [loading, setLoading] = useState(!park);
    const [storeScrollIdx, setStoreScrollIdx] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                if (!park) setLoading(true);
                const [data, parks] = await Promise.all([
                    getParkBySlug(slug),
                    getAllParks()
                ]);
                setPark(data);
                setAllParks(parks.filter(p => p.slug !== slug));
            } catch (err) {
                console.error("Error fetching park details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
        window.scrollTo(0, 0);
    }, [slug]);

    const visibleStoreItems = park?.storeItems?.slice(storeScrollIdx, storeScrollIdx + 4) || [];
    const canScrollLeft = storeScrollIdx > 0;
    const canScrollRight = park?.storeItems && storeScrollIdx + 4 < park.storeItems.length;

    if (loading) return <LoadingScreen message="Loading park details..." />;
    if (!park) return (
        <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
            Park not found
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f1115] transition-colors duration-300">
            <SEO title={`${park.name} - Xynema`} description={park.description} />

            {/* ── HERO / BANNER ── */}
            <div className="relative pt-24 md:pt-32 pb-0 overflow-hidden">
                {/* Blurred background */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={park.bannerImage}
                        alt=""
                        className="w-full h-[500px] object-cover blur-3xl scale-125 opacity-40 dark:opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white dark:via-[#0f1115]/60 dark:to-[#0f1115]" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start text-center md:text-left pb-12">

                        {/* Poster */}
                        <div className="w-56 md:w-72 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 ring-4 ring-white/10 shrink-0">
                            <img
                                src={park.posterImage}
                                alt={park.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-2 md:pt-6">
                            {/* Type badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 backdrop-blur-md rounded-full mb-4">
                                <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                                    {park.type}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-5 leading-tight">
                                {park.name}
                            </h1>

                            {/* Meta */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-700 dark:text-gray-300">
                                    <Star className="w-4 h-4 text-primary fill-current" />
                                    <span className="text-sm font-bold">{park.rating}/5</span>
                                    <span className="text-xs text-gray-400 font-medium">({park.reviewCount} ratings)</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-700 dark:text-gray-300">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-bold">{park.city}</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => navigate(`/park/${slug}/tickets`, { state: { park } })}
                                className="w-full md:w-auto px-14 py-4 bg-primary text-white font-black tracking-widest uppercase rounded-xl shadow-xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all text-sm"
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
                {park.storeItems && park.storeItems.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-black text-gray-900 dark:text-white">Explore the store</h2>
                            <Link
                                to="/store"
                                className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Visit Store
                            </Link>
                        </div>

                        {/* Scrollable store row */}
                        <div className="relative">
                            {/* Left Arrow */}
                            {canScrollLeft && (
                                <button
                                    onClick={() => setStoreScrollIdx(i => Math.max(0, i - 1))}
                                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white dark:bg-[#1a1c21] border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                            )}

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                {visibleStoreItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white dark:bg-[#16181d] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden group cursor-pointer hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
                                    >
                                        <div className="aspect-[3/4] bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-3.5">
                                            <h4 className="text-[10px] font-black text-gray-800 dark:text-gray-200 line-clamp-1 mb-1.5">
                                                {item.name}
                                            </h4>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-black text-gray-900 dark:text-white">
                                                    ₹{item.price}
                                                </p>
                                                <div className="flex items-center gap-1 opacity-60">
                                                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                                                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">
                                                        {item.reviews}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Arrow */}
                            {canScrollRight && (
                                <button
                                    onClick={() => setStoreScrollIdx(i => i + 1)}
                                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white dark:bg-[#1a1c21] border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Similar Picks */}
                <section>
                    <h2 className="text-base font-black text-gray-900 dark:text-white mb-6">Similar picks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                        {allParks.slice(0, 3).map((p) => (
                            <ParkCard key={p.id} park={p} />
                        ))}
                    </div>
                </section>
            </div>

            {/* ── MOBILE BOTTOM BAR ── */}
            <div className="md:hidden fixed bottom-16 left-4 right-4 z-40">
                <button
                    onClick={() => navigate(`/park/${slug}/tickets`, { state: { park } })}
                    className="w-full py-4 bg-primary text-white font-black tracking-widest uppercase rounded-xl shadow-2xl shadow-primary/40 text-sm active:scale-95 transition-transform"
                >
                    Book Tickets
                </button>
            </div>
        </div>
    );
};

export default ParkDetailsPage;