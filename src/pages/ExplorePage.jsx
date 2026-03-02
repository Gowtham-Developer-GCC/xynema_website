import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Sliders, Star, Loader, X, ArrowLeft, TrendingUp, MapPin, Calendar, Clock, Ticket, ChevronRight, PartyPopper, Shield, Send, Users, Info } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import { animationStyles } from '../styles/components';
import * as api from '../services/api';
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

    // Sync tab with prop
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);


            const [eventData] = await Promise.all([
                api.getEvents(selectedCity).catch(err => {
                    console.error('Events fetch error:', err);
                    return [];
                })
            ]);

            const allEvents = eventData || [];

            setEvents(allEvents);
            setFilteredEvents(allEvents);

            // Extract available filters for events
            const tags = Array.from(new Set(allEvents.flatMap(e => e.tags))).sort();
            const cities = Array.from(new Set(allEvents.map(e => e.city).filter(c => c))).sort();
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
            let filtered = events;
            if (eventSearchQuery.trim()) {
                filtered = filtered.filter(e =>
                    e.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                    e.description.toLowerCase().includes(eventSearchQuery.toLowerCase())
                );
            }
            if (eventFilters.city !== 'All') {
                filtered = filtered.filter(e => e.city === eventFilters.city);
            }
            if (eventFilters.tags.length > 0) {
                filtered = filtered.filter(e =>
                    e.tags.some(tag => eventFilters.tags.includes(tag))
                );
            }
            setFilteredEvents(filtered);
        } catch (err) {
            console.error('Event filter error:', err);
        }
    }, [events, eventSearchQuery, eventFilters]);

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

    if (loading) return <LoadingSpinner message="Scanning Library" />;
    if (error) return <ErrorState error={error} onRetry={fetchData} title="Access Interrupted" buttonText="Try Refreshing" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA]">
            <SEO
                title="Explore Events - XYNEMA"
                description="Discover live events near you"
            />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-xynemaRose transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl h-10">
                        {[
                            { id: 'public_events', label: 'Public Events' },
                            { id: 'private_events', label: 'Private Events' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-4 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-xynemaRose shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab !== 'private_events' && (
                    <>
                        {/* Search & Filter Bar */}
                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="w-full flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={eventSearchQuery}
                                        onChange={(e) => setEventSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-xynemaRose transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${showFilters ? 'bg-xynemaRose text-white border-xynemaRose' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm'}`}
                                >
                                    <Sliders className="w-5 h-5" />
                                    Advanced Filters
                                    {(eventFilters.city !== 'All' || eventFilters.tags.length > 0) && (
                                        <span className="w-2 h-2 rounded-full bg-current animate-pulse ml-1" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filters Panel */}
                        {showFilters && (
                            <FilterPanel
                                filters={eventFilters}
                                availableTags={availableEventTags}
                                availableCities={availableEventCities}
                                onFilterChange={setEventFilters}
                                onReset={resetFilters}
                            />
                        )}

                        {/* Active Filter Chips */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {eventFilters.city !== 'All' && <FilterChip label={eventFilters.city} onRemove={() => setEventFilters({ ...eventFilters, city: 'All' })} />}
                            {eventFilters.status !== 'All' && <FilterChip label={eventFilters.status} onRemove={() => setEventFilters({ ...eventFilters, status: 'All' })} />}
                            {eventFilters.date !== 'All' && <FilterChip label={eventFilters.date} onRemove={() => setEventFilters({ ...eventFilters, date: 'All' })} />}
                            {eventFilters.tags.map(tag => (
                                <FilterChip key={tag} label={tag} onRemove={() => setEventFilters({ ...eventFilters, tags: eventFilters.tags.filter(t => t !== tag) })} />
                            ))}
                        </div>
                    </>
                )}

                {/* Content Rendering */}

                {activeTab === 'public_events' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map((event, idx) => (
                                <EventCard key={event.id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
                            ))
                        ) : <EmptyState onReset={resetFilters} />}
                    </div>
                )}

                {activeTab === 'private_events' && <PrivateEventsSection />}
            </div>
        </div>
    );
};

// ============= COMPONENTS =============

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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Location</label>
                    <select
                        value={filters.city}
                        onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-xynemaRose outline-none transition-all"
                    >
                        <option value="All">All Cities</option>
                        {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['All', 'Active', 'Sold Out', 'Upcoming'].map(status => (
                            <button
                                key={status}
                                onClick={() => onFilterChange({ ...filters, status })}
                                className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${filters.status === status ? 'bg-xynemaRose text-white border-xynemaRose' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Timeframe</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['All', 'Today', 'Tomorrow', 'Weekend'].map(date => (
                            <button
                                key={date}
                                onClick={() => onFilterChange({ ...filters, date })}
                                className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${filters.date === date ? 'bg-xynemaRose text-white border-xynemaRose' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                {date}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Categories</label>
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
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${isSelected ? 'bg-xynemaRose/10 border-xynemaRose text-xynemaRose' : 'bg-white border-gray-100 text-gray-400'}`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                <button onClick={onReset} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-xynemaRose transition-colors">Reset All</button>
                <button
                    onClick={() => onFilterChange(filters)}
                    className="px-8 py-3 rounded-xl bg-xynemaRose text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-xynemaRose/20"
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
            const options = { day: 'numeric', month: 'short', year: 'numeric' };

            if (event.eventType === 'multi-day' && event.endDate && event.endDate !== event.startDate) {
                const end = new Date(event.endDate);
                if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
                }
                if (start.getFullYear() === end.getFullYear()) {
                    return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                }
                return `${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`;
            }
            return start.toLocaleDateString('en-IN', options);
        } catch (e) {
            return event.startDate;
        }
    };

    const formattedDate = getFormattedDate();

    return (
        <div
            onClick={() => navigate(`/event/${event.slug}`, { state: { event } })}
            className={`group cursor-pointer flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-2xl hover:translate-y-[-4px] animate-slide-up opacity-0 ${event.delayClass || ''}`}
        >
            <div className="relative aspect-[16/9] overflow-hidden">
                <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                <div className="absolute top-4 left-4 flex gap-2">
                    {event.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-[9px] font-black text-white uppercase tracking-wider">
                            #{tag}
                        </span>
                    ))}
                    {event.eventType === 'multi-day' && (
                        <span className="px-2.5 py-1 rounded-lg bg-xynemaRose text-[9px] font-bold text-white uppercase tracking-wider">
                            Multi-Day
                        </span>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em] mb-1">STARTING FROM</p>
                    <p className="text-xl font-black text-white">₹{event.price || 'Free'}</p>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <h3 className="text-xl font-display font-black text-gray-900 group-hover:text-xynemaRose transition-colors line-clamp-1 tracking-tight uppercase">
                    {event.name}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">DATE</p>
                            <p className="text-xs font-bold text-gray-700">{formattedDate}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">TIME</p>
                            <p className="text-xs font-bold text-gray-700">{event.startTime || 'TBA'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">VENUE</p>
                            <p className="text-xs font-bold text-gray-700 truncate">{event.venue}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                            <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">CITY</p>
                            <p className="text-xs font-bold text-gray-700">{event.city}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PrivateEventsSection = () => (
    <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        {/* Ultra-Minimal Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-6 pt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-xynemaRose/5 text-xynemaRose rounded-full text-[10px] font-black uppercase tracking-widest">
                <PartyPopper className="w-3 h-3" />
                <span>Private & Exclusive</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-display font-black text-gray-900 tracking-tight leading-[0.95] uppercase">
                Host It <br />
                <span className="text-xynemaRose">Your Way.</span>
            </h2>

            <p className="text-lg text-gray-500 font-medium leading-relaxed">
                The ultimate platform for private screenings and corporate events.
                Simple, secure, and completely branded.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <button className="w-full sm:w-auto px-10 py-4 rounded-xl bg-xynemaRose text-white font-display font-black uppercase tracking-widest shadow-xl shadow-xynemaRose/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Start Planning
                </button>
                {/* <button className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white text-xynemaRose border-2 border-xynemaRose/10 font-bold uppercase tracking-widest hover:border-xynemaRose hover:bg-xynemaRose/5 transition-all">
                    See Demo
                </button> */}
            </div>
        </div>

        {/* Clean Process Steps (Restored 5-step flow) */}
        <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
                <h3 className="text-2xl font-display font-black uppercase tracking-tight text-gray-900">
                    How It Works
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
                {/* Desktop Connecting Line */}
                <div className="hidden md:block absolute top-[2.5rem] left-[10%] right-[10%] h-0.5 bg-gray-100" />

                {[
                    { title: 'Inquiry', desc: 'Contact our concierge to start planning.', icon: Clock },
                    { title: 'Details', desc: 'Submit date, venue, and guest counts.', icon: Info },
                    { title: 'Secure QR', desc: 'System generates unique encrypted codes.', icon: Shield },
                    { title: 'Invites', desc: 'Distribute via App, SMS, or Email.', icon: Send },
                    { title: 'Day Of', desc: 'Instant verification at the gates.', icon: Shield }
                ].map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-4 group">
                        <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center text-gray-400 group-hover:border-xynemaRose group-hover:text-xynemaRose group-hover:shadow-lg group-hover:shadow-xynemaRose/10 transition-all duration-300">
                            <step.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Step 0{idx + 1}</div>
                            <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-2">{step.title}</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed px-2">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Minimal Features Grid (Restored Content) */}
        <div className="bg-gray-50 rounded-[40px] p-8 md:p-16">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-display font-black uppercase tracking-tight text-gray-900">
                        Premium <span className="text-xynemaRose">Standard.</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {[
                        { title: 'Secure Entry', desc: 'QR-based access control with real-time logs.', icon: Shield },
                        { title: 'Multi-Channel', desc: 'WhatsApp, Email & In-App notification delivery.', icon: Send },
                        { title: 'Total Control', desc: 'Dedicated dashboard to manage guest lists.', icon: Shield },
                        { title: 'Full Scalability', desc: 'Optimized for small groups or massive festivals.', icon: Users }
                    ].map((feat, i) => (
                        <div key={i} className="text-center space-y-3 group">
                            <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center text-xynemaRose group-hover:scale-110 transition-transform">
                                <feat.icon className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-wider text-gray-900">{feat.title}</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);


const EmptyState = ({ onReset }) => (
    <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-200 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Search className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight">Nothing Found</h3>
        <p className="text-gray-500 text-sm mt-2 font-medium">Try adjusting your search or filters to see more.</p>
        <button
            onClick={onReset}
            className="mt-8 px-8 py-3 bg-xynemaRose text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
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
