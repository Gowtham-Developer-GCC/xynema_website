import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Sliders, Star, Loader, X, ArrowLeft, TrendingUp, MapPin, Calendar, Clock, Ticket, ChevronRight, ChevronDown, PartyPopper, Shield, Send, Users, Info, Check, ArrowRight, Sparkles, Building } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { animationStyles } from '../styles/components';
import { useData } from '../context/DataContext';
import { errorHandler, optimizeImage } from '../utils/helpers';
import { getAvailableTurfs } from '../services/turfService';

const SportsPage = () => {
    const navigate = useNavigate();
    const { selectedCity } = useData();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [eventFilters, setEventFilters] = useState({
        city: 'All',
        status: 'Active',
        date: 'All',
        tags: []
    });
    const [availableEventTags, setAvailableEventTags] = useState(["Football", "Cricket", "Badminton", "Basketball", "Tennis"]);
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
    const moreFiltersRef = useRef(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch turfs based on selected city or all if 'All'
            const params = selectedCity && selectedCity !== 'All' ? { city: selectedCity } : {};
            const turfs = await getAvailableTurfs(params);
            
            setEvents(turfs);
            setFilteredEvents(turfs);
            
            // Dynamically extract unique sport types (tags)
            const tags = Array.from(new Set(turfs.flatMap(t => t.tags || []))).filter(t => t).sort();
            if (tags.length > 0) {
                setAvailableEventTags(tags);
            }
        } catch (err) {
            console.error('Sports page fetch failed:', err);
            setError(err.message || 'Failed to load sports venues');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Handle category from URL if present
        const category = searchParams.get('category');
        if (category) {
            setEventFilters(prev => ({ ...prev, tags: [category] }));
        }
    }, [selectedCity, searchParams]);

    // Handle clicks outside "More Filters" dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreFiltersRef.current && !moreFiltersRef.current.contains(event.target)) {
                setIsMoreFiltersOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Logic
    useEffect(() => {
        const filterData = (data) => {
            let filtered = data;
            if (eventSearchQuery.trim()) {
                filtered = filtered.filter(e =>
                    (e.name || "").toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                    (e.venue || "").toLowerCase().includes(eventSearchQuery.toLowerCase())
                );
            }
            if (eventFilters.city !== 'All') {
                filtered = filtered.filter(e => e.city === eventFilters.city);
            }
            if (eventFilters.tags.length > 0) {
                filtered = filtered.filter(e =>
                    (e.tags || []).some(tag => eventFilters.tags.includes(tag))
                );
            }
            return filtered;
        };

        setFilteredEvents(filterData(events));
    }, [events, eventSearchQuery, eventFilters]);

    const resetFilters = () => {
        setEventFilters({ city: 'All', status: 'Active', date: 'All', tags: [] });
        setEventSearchQuery('');
    };

    if (loading) return <LoadingScreen message="Finding Available Venues" />;
    if (error) return <ErrorState error={error} onRetry={fetchData} title="Connection Interrupted" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title="Sports - XYNEMA"
                description="Discover sports and book slots near you"
            />

            {/* Header */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#111827] dark:text-gray-100 mb-2 tracking-tight">Sports</h1>
                        <p className="text-[#6B7280] dark:text-gray-400 text-sm md:text-base font-sans">Discover sports and book slots near you.</p>
                    </div>
                </div>
            </div>

            {/* Quick Filter Section */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] transition-all duration-300 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-0">
                        <button
                            onClick={() => setEventFilters(prev => ({ ...prev, tags: [] }))}
                            className={`py-4 text-sm font-bold transition-all relative whitespace-nowrap ${eventFilters.tags.length === 0 ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            All
                            {eventFilters.tags.length === 0 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left-2" />}
                        </button>
                        {/* Progressive Dynamic Tags as Tabs */}
                        {availableEventTags.slice(0, 5).map((tag, idx) => (
                            <button
                                key={tag}
                                onClick={() => {
                                    setEventFilters(prev => ({ ...prev, tags: [tag] }));
                                    setIsMoreFiltersOpen(false);
                                }}
                                className={`py-4 text-sm font-bold transition-all relative whitespace-nowrap ${idx === 0 ? 'inline-block' :
                                    idx === 1 ? 'hidden xs:inline-block' :
                                        idx === 2 ? 'hidden sm:inline-block' :
                                            'hidden md:inline-block'
                                    } ${eventFilters.tags.includes(tag) ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                {tag}
                                {eventFilters.tags.includes(tag) && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left-2" />}
                            </button>
                        ))}
                    </div>

                    {/* More Filters Integrated */}
                    <div className="relative shrink-0 ml-8" ref={moreFiltersRef}>
                        <button
                            onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                            className={`py-4 text-xs font-bold transition-all flex items-center gap-2 group whitespace-nowrap ${eventFilters.tags.some(t => !["Football", "Badminton", "Basketball", "Cricket", "Tennis"].includes(t)) ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <span>More Filters</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isMoreFiltersOpen && (
                            <div className="absolute top-full right-0 mt-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-xl shadow-xl py-3 z-[100] animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Categories
                                </div>
                                <div className="max-h-64 overflow-y-auto px-2">
                                    {availableEventTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                setEventFilters(prev => ({
                                                    ...prev,
                                                    tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
                                                }));
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors mb-1 ${eventFilters.tags.includes(tag) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="mb-6 mt-2">
                    <h2 className="text-2xl font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight">All Sports</h2>
                    <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">Popular right now</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, idx) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : <EmptyState onReset={resetFilters} />}
                </div>
            </div>
        </div>
    );
};

// ============= COMPONENTS =============

const EventCard = memo(({ event }) => {
    const navigate = useNavigate();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(event.startDate || Date.now()));

    const handleNavigate = () => {
        const identifier = event.slug || event.id;
        navigate(`/sports/${identifier}`, { state: { sport: event } });
    };

    return (
        <div 
            onClick={handleNavigate}
            className="group bg-white dark:bg-[#1a1c23] rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col h-full cursor-pointer"
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                    src={event.imageUrl}
                    alt={event.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                />
            </div>
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
                {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {event.tags.slice(0, 2).map((tag, idx) => (
                            <span 
                                key={idx} 
                                className="text-[10px] font-black uppercase tracking-widest text-primary/90 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/20 whitespace-nowrap"
                            >
                                {tag}
                            </span>
                        ))}
                        {event.tags.length > 2 && (
                            <span className="text-[10px] font-black text-gray-400">
                                +{event.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}
                <h3 className="font-bold line-clamp-2 text-gray-900 dark:text-white text-[0.95rem] sm:text-[1.05rem] leading-snug transition-colors font-roboto mb-2 group-hover:text-primary">
                    {event.name}
                </h3>

                <div className="flex flex-col gap-2 mb-5">

                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                        <span className="truncate">{event.city || event.venue}</span>
                    </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex flex-col">
                        <span className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-medium mb-0.5">
                            Starting from
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-bold text-primary dark:text-primary text-base sm:text-xl">
                                ₹{event.price ? event.price.toLocaleString() : 'Free'}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-medium">/ hour</span>
                        </div>
                    </div>
                    <button
                        className="flex-shrink-0 px-3 sm:px-5 py-2.5 bg-primary text-white text-[9px] sm:text-[10px] font-black rounded-lg shadow-lg shadow-primary/20 transition-all font-roboto tracking-widest hover:brightness-110 active:scale-95 whitespace-nowrap uppercase"
                    >
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    );
});

const EmptyState = ({ onReset }) => (
    <div className="col-span-full py-24 text-center bg-white dark:bg-[#1a1c23] rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Search className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black tracking-tight dark:text-gray-100">Nothing Found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">Try adjusting your filters.</p>
        <button onClick={onReset} className="mt-8 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-primary/20">Reset Filters</button>
    </div>
);

export default SportsPage;
