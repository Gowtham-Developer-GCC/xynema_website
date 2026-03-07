import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Sliders, Star, Loader, X, ArrowLeft, TrendingUp, MapPin, Calendar, Clock, Ticket, ChevronRight, ChevronDown, PartyPopper, Shield, Send, Users, Info, Check, ArrowRight, Sparkles, Building } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { animationStyles } from '../styles/components';
import { getEvents, getAllEventsList, submitPrivateEventEnquiry } from '../services/eventService';
import { useData } from '../context/DataContext';

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
                getEvents(selectedCity).catch(err => {
                    console.error('Events fetch error:', err);
                    return [];
                }),
                getAllEventsList().catch(err => {
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
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-display font-medium text-[#111827] dark:text-gray-100 mb-2 tracking-tight">Events</h1>
                        <p className="text-[#6B7280] dark:text-gray-400 text-sm md:text-base">Discover curated experiences near you.</p>
                    </div>
                    <button
                        onClick={() => handleTabChange('private_events')}
                        className="flex items-center gap-2 text-sm font-semibold text-[#374151] dark:text-gray-300 hover:text-[#00296b] dark:hover:text-blue-400 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Host Your Event
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            {activeTab !== 'private_events' && (
                <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 relative z-[20]">
                    <div className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3">
                        {/* Scrollable Pills Area */}
                        <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar">
                            {/* Static "All" Pill */}
                            <button
                                onClick={() => {
                                    setEventFilters(prev => ({ ...prev, tags: [] }));
                                    setIsMoreFiltersOpen(false);
                                }}
                                className={`px-6 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${eventFilters.tags.length === 0
                                    ? 'bg-[#00296B] dark:bg-blue-600 text-white border-[#00296B] dark:border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                            >
                                All
                            </button>

                            {/* First 4 Dynamic Tags */}
                            {availableEventTags.slice(0, 4).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        setEventFilters(prev => ({ ...prev, tags: [tag] }));
                                        setIsMoreFiltersOpen(false);
                                    }}
                                    className={`px-6 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${eventFilters.tags.length === 1 && eventFilters.tags.includes(tag)
                                        ? 'bg-[#00296B] dark:bg-blue-600 text-white border-[#00296B] dark:border-blue-600 shadow-sm'
                                        : 'bg-white dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Fixed "More Filters" Dropdown */}
                        {availableEventTags.length > 4 && (
                            <div className="relative shrink-0" ref={moreFiltersRef}>
                                <button
                                    onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                                    className={`px-6 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${eventFilters.tags.some(t => availableEventTags.slice(4).includes(t))
                                        ? 'bg-[#00296B] dark:bg-blue-600 text-white border-[#00296B] dark:border-blue-600 shadow-sm'
                                        : 'bg-white dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                                        }`}
                                >
                                    <span>More Filters</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMoreFiltersOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-3 z-[100] animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2 text-left">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Additional Categories</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto no-scrollbar px-2">
                                            {availableEventTags.slice(4).map(tag => (
                                                <label
                                                    key={tag}
                                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg cursor-pointer transition-colors group"
                                                >
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="peer appearance-none w-4 h-4 rounded border border-gray-300 dark:border-gray-600 checked:bg-[#00296B] dark:checked:bg-blue-600 checked:border-[#00296B] dark:checked:border-blue-600 transition-all cursor-pointer"
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
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#00296B] dark:group-hover:text-blue-400 transition-colors">
                                                        {tag}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        {eventFilters.tags.some(t => availableEventTags.slice(4).includes(t)) && (
                                            <div className="px-3 pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                                                <button
                                                    onClick={() => {
                                                        const otherTags = eventFilters.tags.filter(t => !availableEventTags.slice(4).includes(t));
                                                        setEventFilters(prev => ({ ...prev, tags: otherTags }));
                                                    }}
                                                    className="w-full py-1.5 text-[10px] font-bold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 text-center uppercase tracking-wider transition-colors"
                                                >
                                                    Clear selection
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab !== 'private_events' && (
                    <div className="mb-6 mt-2">
                        <h2 className="text-2xl font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight">Trending Events</h2>
                        <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">Popular right now</p>
                    </div>
                )}

                {/* Content Rendering */}

                {activeTab === 'public_events' && (
                    <>
                        {/* Trending Row (First 3 events) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredEvents.length > 0 ? (
                                filteredEvents.slice(0, 3).map((event, idx) => (
                                    <EventCard key={event.id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
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
                                <h2 className="text-[28px] font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight mb-8">All events</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredGlobalEvents.map((event, idx) => (
                                        <EventCard key={event.id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
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
        <div className="w-full bg-[#1E4B6E] rounded-xl text-white p-10 md:p-14 overflow-hidden relative shadow-lg">
            {/* Subtle background glow effect if desired */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-display font-medium mb-4 tracking-tight">Host Your Private Event</h2>
                <p className="text-blue-100/80 text-sm md:text-base leading-relaxed mb-10 max-w-2xl">
                    From corporate gatherings to private screenings, we help you create memorable
                    experiences. Submit your request and our team will reach out to you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
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
                    className="bg-white text-[#1E4B6E] px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                >
                    Submit Request
                </button>
            </div>
        </div>
    );
};

const FilterChip = ({ label, onRemove }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-xynemaRose/10 text-xynemaRose text-[10px] font-bold border border-xynemaRose/20 animate-in fade-in zoom-in duration-200">
        <span className="uppercase tracking-wider">{label}</span>
        <button onClick={onRemove} className="hover:bg-xynemaRose/20 rounded-full p-0.5">
            <X className="w-3 h-3" />
        </button>
    </div>
);

const FilterPanel = ({ filters, availableTags, availableCities, onFilterChange, onReset }) => {

    return (
        <div className="bg-white dark:bg-[#1a1c23] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl mb-8 animate-in slide-in-from-top-4 duration-300 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Location</label>
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
                                className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${filters.status === status ? 'bg-xynemaRose dark:bg-blue-600 text-white border-xynemaRose dark:border-blue-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Timeframe</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['All', 'Today', 'Tomorrow', 'Weekend'].map(date => (
                            <button
                                key={date}
                                onClick={() => onFilterChange({ ...filters, date })}
                                className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${filters.date === date ? 'bg-xynemaRose dark:bg-blue-600 text-white border-xynemaRose dark:border-blue-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'}`}
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
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${isSelected ? 'bg-xynemaRose/10 dark:bg-blue-500/10 border-xynemaRose dark:border-blue-500 text-xynemaRose dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center transition-colors">
                <button onClick={onReset} className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest hover:text-xynemaRose dark:hover:text-blue-400 transition-colors">Reset All</button>
                <button
                    onClick={() => onFilterChange(filters)}
                    className="px-8 py-3 rounded-xl bg-xynemaRose dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-xynemaRose/20 dark:shadow-blue-900/40"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

const EventCard = ({ event }) => {
    const navigate = useNavigate();

    const getFormattedDate = () => {
        if (!event.startDate) return 'TBA';
        try {
            const start = new Date(event.startDate);
            const options = { day: 'numeric', month: 'long', year: 'numeric' };

            if (event.eventType === 'multi-day' && event.endDate && event.endDate !== event.startDate) {
                const end = new Date(event.endDate);
                if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
                }
                if (start.getFullYear() === end.getFullYear()) {
                    return `${start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                }
                return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
            }
            return start.toLocaleDateString('en-US', options);
        } catch (e) {
            return event.startDate;
        }
    };

    const formattedDate = getFormattedDate();

    // Figma Design details:
    // - Clean white card with rounded border
    // - No dark gradient
    // - Simple "View details ↗"
    return (
        <div
            onClick={() => navigate(`/event/${event.slug}`, { state: { event } })}
            className={`group cursor-pointer flex flex-col bg-white dark:bg-[#1a1c23] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 ${event.delayClass || ''}`}
        >
            <div className="relative aspect-[3/2] overflow-hidden">
                <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-medium text-[#111827] dark:text-gray-100 mb-6 tracking-tight line-clamp-2">
                    {event.name}
                </h3>

                <div className="space-y-3 mt-auto mb-5">
                    <div className="flex items-center gap-3 text-[#4B5563] dark:text-gray-400">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                        <span className="text-sm font-medium">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#4B5563] dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                        <span className="text-sm font-medium truncate">{event.city || event.venue}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-medium text-[#006699] dark:text-blue-400">₹{event.price || 'Free'}</span>
                        <span className="text-xs font-medium text-[#6B7280] dark:text-gray-500">onwards</span>
                    </div>
                    <div className="text-xs font-semibold text-[#4B5563] dark:text-gray-400 flex items-center gap-1 group-hover:text-[#111827] dark:group-hover:text-white transition-colors">
                        View details
                        <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7" />
                            <path d="M7 7h10v10" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
            setStatusMessage({ type: 'error', text: err.message || 'Failed to submit enquiry. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 bg-[#F5F7F9] dark:bg-[#0f1115]">
            {/* Dark Blue Hero Banner - No margins around it */}
            <div className="w-full bg-[#1E4B6E] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="text-center max-w-2xl mx-auto pt-24 pb-32 px-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-xs font-semibold tracking-wider mb-8">
                        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                        <span className="text-white">PRIVATE EVENT HOSTING</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6">
                        Host Your Private Event
                    </h2>

                    <p className="text-lg text-blue-100/90 leading-relaxed font-normal">
                        Create unforgettable experiences with our premium venues and personalized event management. Fill out the form below and our team will craft the perfect event for you.
                    </p>
                </div>

            </div>

            {/* Form Section Floating on top */}
            <div id="enquiry-form" className="relative z-10 -mt-16 max-w-4xl mx-auto px-4">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-lg p-8 md:p-12 border border-white/40 dark:border-gray-700 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
                    <div className="mb-10 text-left border-b border-white/20 dark:border-gray-700 pb-6">
                        <h3 className="text-[28px] font-display font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                            Event Request Form
                        </h3>
                        <p className="text-gray-600/90 dark:text-gray-400 text-base mt-2">
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
                                    className="w-full px-4 py-3 bg-white/40 dark:bg-gray-900/40 border border-white/60 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3B6A8B] focus:ring-1 focus:ring-[#3B6A8B] transition-colors"
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
                                    className="w-full px-4 py-3 bg-white/40 dark:bg-gray-900/40 border border-white/60 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3B6A8B] focus:ring-1 focus:ring-[#3B6A8B] transition-colors"
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
                                    className="w-full px-4 py-3 bg-white/40 dark:bg-gray-900/40 border border-white/60 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3B6A8B] focus:ring-1 focus:ring-[#3B6A8B] transition-colors"
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
                                        className={`w-full px-4 py-3 bg-white/40 dark:bg-gray-900/40 border border-white/60 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#3B6A8B] focus:ring-1 focus:ring-[#3B6A8B] transition-colors appearance-none ${formData.eventType ? 'text-gray-900 dark:text-gray-100' : 'text-[#9CA3AF] dark:text-gray-400'}`}
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
                                className="w-full px-4 py-3 bg-white/40 dark:bg-gray-900/40 border border-white/60 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#3B6A8B] focus:ring-1 focus:ring-[#3B6A8B] transition-colors resize-y"
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
                                className="w-full sm:w-auto px-10 py-3.5 bg-[#3B6A8B] text-white rounded-lg font-medium hover:bg-[#2A516E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-[#1E4B6E] dark:text-blue-300 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Quick Response</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Our team will review your request and contact you within 24-48 hours.</p>
                </div>
                {/* 2 */}
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-[#1E4B6E] dark:text-blue-300 rounded-full flex items-center justify-center mb-4">
                        <Building className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Premium Venues</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Access to exclusive venues across multiple cities and locations.</p>
                </div>
                {/* 3 */}
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-[#1E4B6E] dark:text-blue-300 rounded-full flex items-center justify-center mb-4">
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
        <h3 className="text-2xl font-black uppercase tracking-tight dark:text-gray-100">Nothing Found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">Try adjusting your search or filters to see more.</p>
        <button
            onClick={onReset}
            className="mt-8 px-8 py-3 bg-xynemaRose dark:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg dark:shadow-blue-900/20"
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
            <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: '#00296b' }} />
        </div>
        <div className="text-center space-y-1">
            <p className="text-xynemaRose font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Scanning Library</p>
            <h2 className="text-3xl font-black text-gray-300 uppercase letter-spacing-tight">XYNEMA</h2>
        </div>
    </div>
);

export default ExplorePage;
