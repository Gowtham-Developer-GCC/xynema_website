import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Sliders, Star, Loader, X, ArrowLeft, TrendingUp, MapPin, Calendar, Clock, Ticket, ChevronRight, ChevronDown, PartyPopper, Shield, Send, Users, Info, Check, ArrowRight, Sparkles, Building } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { animationStyles } from '../styles/components';
import { getEvents, getAllEventsList, submitPrivateEventEnquiry } from '../services/eventService';
import { useData } from '../context/DataContext';
import { errorHandler, optimizeImage } from '../utils/helpers';
import { memo } from 'react';
import apiCacheManager from '../services/apiCacheManager';

const ExplorePage = ({ initialTab = 'public_events' }) => {
    const navigate = useNavigate();
    const { selectedCity } = useData();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [events, setEvents] = useState([]);


    // Events State
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [eventFilters, setEventFilters] = useState({
        city: 'All',
        status: 'All',
        date: 'All',
        tags: []
    });
    const [availableEventTags, setAvailableEventTags] = useState([]);
    const [availableEventCities, setAvailableEventCities] = useState([]);

    const [allGlobalEvents, setAllGlobalEvents] = useState([]);
    const [filteredGlobalEvents, setFilteredGlobalEvents] = useState([]);
    const [loadingGlobalEvents, setLoadingGlobalEvents] = useState(true);
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
    const moreFiltersRef = useRef(null);

    // Sync tab with prop
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);


            const [eventData, globalEventData] = await Promise.all([
                apiCacheManager.getOrFetchEvents(selectedCity, () => getEvents(selectedCity)).catch(err => {
                    console.error('Events fetch error:', err);
                    return [];
                }),
                apiCacheManager.getOrFetchEvents(null, () => getAllEventsList()).catch(err => {
                    console.error('Global Events fetch error:', err);
                    return [];
                })
            ]);

            const allEvents = eventData || [];

            setEvents(allEvents);
            setFilteredEvents(allEvents);
            setAllGlobalEvents(globalEventData || []);
            setFilteredGlobalEvents(globalEventData || []);
            setLoadingGlobalEvents(false);

            // Extract available filters for events from both local and global sources
            const allAvailableEvents = [...allEvents, ...(globalEventData || [])];
            const tags = Array.from(new Set(allAvailableEvents.flatMap(e => e.tags || []).filter(t => t))).sort();
            const cities = Array.from(new Set(allAvailableEvents.map(e => e.city).filter(c => c))).sort();
            setAvailableEventTags(tags);
            setAvailableEventCities(cities);

        } catch (err) {
            console.error('Explore page fetch failed:', err);
            setError(err.message || 'Failed to load content library');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        try {
            fetchData();
            const category = searchParams.get('category');
            if (category) {
                setEventFilters(prev => ({
                    ...prev,
                    tags: [category]
                }));
            } else {
                setEventFilters(prev => ({
                    ...prev,
                    tags: []
                }));
            }
        } catch (err) {
            console.error('Effect fetch error:', err);
        }
    }, [searchParams, selectedCity]);


    // Filter Logic for Events
    useEffect(() => {
        try {
            const filterData = (data) => {
                let filtered = data;
                if (eventSearchQuery.trim()) {
                    filtered = filtered.filter(e =>
                        (e.name || "").toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                        (e.description || "").toLowerCase().includes(eventSearchQuery.toLowerCase())
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
            setFilteredGlobalEvents(filterData(allGlobalEvents));
        } catch (err) {
            console.error('Event filter error:', err);
        }
    }, [events, allGlobalEvents, eventSearchQuery, eventFilters]);

    const resetFilters = () => {
        try {
            setEventFilters({ city: 'All', tags: [] });
            setEventSearchQuery('');
        } catch (err) {
            console.error('Reset filters error:', err);
        }
    };

    const handleTabChange = (tabId) => {
        try {
            setActiveTab(tabId);
            setShowFilters(false);
        } catch (err) {
            console.error('Tab change error:', err);
        }
    };

    if (loading) return <LoadingScreen message="Scanning Library" />;
    if (error) return <ErrorState error={error} onRetry={fetchData} title="Access Interrupted" buttonText="Try Refreshing" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title="Explore Events - XYNEMA"
                description="Discover live events near you"
            />

            {/* Header */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#111827] dark:text-gray-100 mb-2 tracking-tight">Events</h1>
                        <p className="text-[#6B7280] dark:text-gray-400 text-sm md:text-base font-sans">Discover curated experiences near you.</p>
                    </div>
                    <button
                        onClick={() => handleTabChange('private_events')}
                        className="flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-display"
                    >
                        <Sparkles className="w-4 h-4" />
                        Host Your Event
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            {activeTab !== 'private_events' && (
                <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 relative z-[20]">
                    <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center gap-2 sm:gap-3">
                        {/* Scrollable Pills Area */}
                        <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                            {/* Static "All" Pill */}
                            <button
                                onClick={() => {
                                    setEventFilters(prev => ({ ...prev, tags: [] }));
                                    setIsMoreFiltersOpen(false);
                                }}
                                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border font-display ${eventFilters.tags.length === 0
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-white dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                            >
                                All
                            </button>

                            {/* Progressive Dynamic Tags */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                {availableEventTags.slice(0, 4).map((tag, idx) => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setEventFilters(prev => ({ ...prev, tags: [tag] }));
                                            setIsMoreFiltersOpen(false);
                                        }}
                                        className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border font-display max-w-[120px] sm:max-w-[180px] truncate ${idx === 0 ? 'inline-block' : // Tag 1 always visible if possible
                                            idx === 1 ? 'hidden xs:inline-block' :
                                                idx === 2 ? 'hidden sm:inline-block' :
                                                    'hidden md:inline-block' // Tag 4+
                                            } ${eventFilters.tags.length === 1 && eventFilters.tags.includes(tag)
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                                : 'bg-white dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dropdown - Dynamically hides what's already on the screen */}
                        <div className="relative shrink-0" ref={moreFiltersRef}>
                            <button
                                onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 sm:gap-2 font-display ${eventFilters.tags.length > 0
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-white dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                            >
                                <span className="hidden sm:inline">More </span><span>Filters</span>
                            </button>

                            {isMoreFiltersOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-3 z-[100] animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2 text-left">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase">Categories</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto scrollbar-hide px-2">
                                        {/* Show all available tags in dropdown for simplicity, especially those that might be hidden by breakpoints */}
                                        {availableEventTags.map(tag => (
                                            <label
                                                key={tag}
                                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg cursor-pointer transition-colors group"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer appearance-none w-4 h-4 rounded border border-gray-300 dark:border-gray-600 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                                        checked={eventFilters.tags.includes(tag)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setEventFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                                                            } else {
                                                                setEventFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
                                                            }
                                                        }}
                                                    />
                                                    <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors font-display tracking-tight truncate">
                                                    {tag}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {eventFilters.tags.length > 0 && (
                                        <div className="px-3 pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => {
                                                    setEventFilters(prev => ({ ...prev, tags: [] }));
                                                }}
                                                className="w-full py-1.5 text-[10px] font-bold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 text-center transition-colors"
                                            >
                                                Clear selection
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {activeTab !== 'private_events' && (
                    <div className="mb-6 mt-2">
                        <h2 className="text-2xl font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight">Trending Events</h2>
                        <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">Popular right now</p>
                    </div>
                )}

                {/* Content Rendering */}

                {activeTab === 'public_events' && (
                    <>
                        {/* Trending Row (All local filtered events) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event, idx) => (
                                    <EventCard key={event.id || event._id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
                                ))
                            ) : <EmptyState onReset={resetFilters} />}
                        </div>
                        {/* Private Event Banner injected after the first row (or at the bottom if fewer than 3 trending events) */}
                        <div className="my-16">
                            <PrivateEventBanner onNavigate={() => handleTabChange('private_events')} />
                        </div>

                        {/* All Global Events */}
                        {!loadingGlobalEvents && filteredGlobalEvents.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-[24px] sm:text-[28px] font-display font-bold text-[#111827] dark:text-gray-100 tracking-tight mb-6 sm:mb-8">All events</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                    {filteredGlobalEvents.map((event, idx) => (
                                        <EventCard key={event.id || event._id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {filteredEvents.length === 0 && filteredGlobalEvents.length === 0 && (
                            <EmptyState onReset={resetFilters} />
                        )}
                    </>
                )}

                {activeTab === 'private_events' && (
                    <PrivateEventsSection onCancel={() => handleTabChange('public_events')} />
                )}
            </div>
        </div>
    );
};

// ============= COMPONENTS =============

const PrivateEventBanner = ({ onNavigate }) => {
    return (
        <div className="w-full bg-[#1E2532] dark:bg-[#1a1d24] border border-white/10 rounded-xl text-white p-6 sm:p-10 md:p-14 overflow-hidden relative shadow-2xl">
            {/* Subtle background glow effect if desired */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4 tracking-tight">Host Your Private Event</h2>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-10 max-w-2xl font-sans">
                    From corporate gatherings to private screenings, we help you create memorable
                    experiences. Submit your request and our team will reach out to you.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
                    <div className="flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Flexible Dates</h4>
                            <p className="text-xs text-blue-100/70">Choose your preferred timing</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Premium Venues</h4>
                            <p className="text-xs text-blue-100/70">Multiple locations available</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Custom Experience</h4>
                            <p className="text-xs text-blue-100/70">Tailored to your needs</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onNavigate}
                    className="bg-primary text-white px-8 py-3.5 rounded-lg text-sm font-black font-roboto tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    Submit Request
                </button>
            </div>
        </div>
    );
};

const FilterChip = ({ label, onRemove }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20 animate-in fade-in zoom-in duration-200 font-display">
        <span className="tracking-wider">{label}</span>
        <button onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5">
            <X className="w-3 h-3" />
        </button>
    </div>
);

const FilterPanel = ({ filters, availableTags, availableCities, onFilterChange, onReset }) => {

    return (
        <div className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl mb-8 animate-in slide-in-from-top-4 duration-300 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Location</label>
                    <select
                        value={filters.city}
                        onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-xynemaRose dark:focus:ring-blue-500 outline-none transition-all dark:text-gray-100"
                    >
                        <option value="All">All Cities</option>
                        {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['All', 'Active', 'Sold Out', 'Upcoming'].map(status => (
                            <button
                                key={status}
                                onClick={() => onFilterChange({ ...filters, status })}
                                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border font-display ${filters.status === status ? 'bg-primary text-white border-primary shadow-md' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Timeframe</label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                        {['All', 'Today', 'Tomorrow', 'Weekend'].map(date => (
                            <button
                                key={date}
                                onClick={() => onFilterChange({ ...filters, date })}
                                className={`px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border font-display ${filters.date === date ? 'bg-primary text-white border-primary shadow-md' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'}`}
                            >
                                {date}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Categories</label>
                    <div className="flex flex-wrap gap-1.5">
                        {availableTags.slice(0, 6).map(tag => {
                            const isSelected = filters.tags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        const nextTags = isSelected
                                            ? filters.tags.filter(t => t !== tag)
                                            : [...filters.tags, tag];
                                        onFilterChange({ ...filters, tags: nextTags });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border font-display ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center transition-colors">
                <button onClick={onReset} className="text-[10px] font-black text-gray-300 dark:text-gray-600 tracking-widest hover:text-primary transition-colors font-display">Reset All</button>
                <button
                    onClick={() => onFilterChange(filters)}
                    className="px-8 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 font-display"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

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
        <div className={`bg-white dark:bg-[#1a1c23] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full transition-all duration-300 cursor-pointer group ${event.delayClass || ''}`}>
            <Link to={eventLink} className="block w-full">
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                        src={optimizeImage(event.imageUrl, { width: 600, height: 375, quality: 80 }) || 'https://via.placeholder.com/600x375?text=No+Image'}
                        alt={event.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                </div>
            </Link>
            <div className="p-4 sm:p-5 flex flex-col flex-grow ">
                <Link to={eventLink} className="mb-2 block">
                    <h3 className="font-bold line-clamp-2 text-gray-900 dark:text-white text-[0.95rem] sm:text-[1.05rem] leading-snug transition-colors font-roboto group-hover:text-primary ">
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
                        <span className="truncate">{event.city || event.venue}</span>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <span className="font-bold text-primary dark:text-primary text-[13px] sm:text-lg min-w-0 truncate">
                        ₹{event.price ? event.price.toLocaleString() : 'Free'}
                    </span>
                    <Link
                        to={eventLink}
                        className="flex-shrink-0 px-3 sm:px-5 py-2 bg-primary text-white text-[9px] sm:text-[10px] font-bold rounded-lg shadow-lg shadow-primary/20 transition-all font-roboto tracking-widest sm:tracking-wider hover:brightness-110 active:scale-95 whitespace-nowrap uppercase"
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </div>
    );
});

const PrivateEventsSection = ({ onCancel }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        eventType: '',
        eventDescription: ''
    });
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });
        try {
            const success = await submitPrivateEventEnquiry(formData);
            if (success) {
                setStatusMessage({ type: 'success', text: 'Enquiry submitted! Our team will contact you shortly.' });
                setFormData({ fullName: '', phone: '', email: '', eventType: '', eventDescription: '' });
                // Optional: Navigate back after success
                // setTimeout(() => onCancel(), 3000);
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: errorHandler.getUserMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 bg-[#F5F7F9] dark:bg-[#0f1115]">
            {/* Dark Blue Hero Banner - No margins around it */}
            <div className="w-full bg-[#1E2532] dark:bg-[#1a1d24] text-white overflow-hidden relative border-b border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="text-center max-w-2xl mx-auto pt-24 pb-32 px-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 rounded-full text-[10px] font-black tracking-widest mb-8 border border-primary/30 font-roboto">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-white">PRIVATE EVENT HOSTING</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6">
                        Host Your Private Event
                    </h2>

                    <p className="text-lg text-gray-300 leading-relaxed font-sans">
                        Create unforgettable experiences with our premium venues and personalized event management. Fill out the form below and our team will craft the perfect event for you.
                    </p>
                </div>

            </div>

            {/* Form Section Floating on top */}
            <div id="enquiry-form" className="relative z-10 -mt-16 max-w-4xl mx-auto px-4">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-lg p-8 md:p-12 border border-white/40 dark:border-gray-700 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
                    <div className="mb-10 text-left border-b border-gray-100 dark:border-gray-700 pb-6">
                        <h3 className="text-[28px] font-roboto font-black text-gray-900 dark:text-gray-100 ">
                            Event Request Form
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-sans">
                            Please provide us with the details of your event and we'll get back to you shortly.
                        </p>
                    </div>

                    {statusMessage.text && (
                        <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'} backdrop-blur-md border border-white/20`}>
                            {statusMessage.type === 'success' ? <Check className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                            <span className="text-sm font-medium">{statusMessage.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                                    placeholder="Enter your email address"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Type <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        name="eventType"
                                        value={formData.eventType}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none font-sans ${formData.eventType ? 'text-gray-900 dark:text-gray-100' : 'text-[#9CA3AF] dark:text-gray-400'}`}
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Select event type</option>
                                        <option value="public-event" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Public Event</option>
                                        <option value="private-event" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Private Event</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Description</label>
                            <textarea
                                name="eventDescription"
                                value={formData.eventDescription}
                                onChange={handleChange}
                                required
                                rows="4"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y font-sans"
                                placeholder="Tell us about your event, requirements, preferences, or special arrangements..."
                            />
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4 border-t border-white/20 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ fullName: '', phone: '', email: '', eventType: '', eventDescription: '' });
                                    if (onCancel) onCancel();
                                }}
                                className="w-full sm:w-auto px-8 py-3.5 bg-white/30 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 border border-white/40 dark:border-gray-700 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 font-medium transition-colors backdrop-blur-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-10 py-3.5 bg-primary text-white rounded-lg font-black font-roboto tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span>Submit Request</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="max-w-4xl mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
                {/* 1 */}
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Quick Response</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Our team will review your request and contact you within 24-48 hours.</p>
                </div>
                {/* 2 */}
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <Building className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Premium Venues</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Access to exclusive venues across multiple cities and locations.</p>
                </div>
                {/* 3 */}
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Custom Experience</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Fully customizable event packages tailored to your needs.</p>
                </div>
            </div>
        </div>
    );
};


const EmptyState = ({ onReset }) => (
    <div className="col-span-full py-24 text-center bg-white dark:bg-[#1a1c23] rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-500 transition-colors">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-600">
            <Search className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black tracking-tight dark:text-gray-100">Nothing Found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">Try adjusting your search or filters to see more.</p>
        <button
            onClick={onReset}
            className="mt-8 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 font-roboto"
        >
            Reset Explore
        </button>
    </div>
);

// ErrorState removed - imported from components

const LoadingState = () => (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col items-center justify-center space-y-8 p-8">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: '#FD4960' }} />
        </div>
        <div className="text-center space-y-1">
            <p className="text-xynemaRose font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Scanning Library</p>
            <h2 className="text-3xl font-black text-gray-300 uppercase letter-spacing-tight">XYNEMA</h2>
        </div>
    </div>
);

export default ExplorePage;
