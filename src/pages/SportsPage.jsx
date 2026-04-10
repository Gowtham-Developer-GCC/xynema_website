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
import SportCard from '../components/SportCard';

const SportsPage = () => {
    const navigate = useNavigate();
    const { selectedCity, turfs, loading: dataLoading, error: dataError, refreshData } = useData();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState(null);

    // Sync context error to local error
    useEffect(() => {
        if (dataError) setError(dataError);
    }, [dataError]);

    const [searchQuery, setSearchQuery] = useState('');
    const [eventFilters, setEventFilters] = useState({
        city: 'All',
        status: 'Active',
        date: 'All',
        tags: []
    });
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
    const moreFiltersRef = useRef(null);

    // Define Main Tabs in specific order
    const mainTabs = ["Box Cricket", "Football", "Tennis", "Swimming"];

    // Dynamic Tags Extraction for all filters
    const availableEventTags = useMemo(() => {
        const dynamicTags = Array.from(new Set(turfs.flatMap(t => t.tags || []))).filter(t => t);
        // Combine with defaults and remove duplicates
        return Array.from(new Set([...mainTabs, ...dynamicTags])).sort();
    }, [turfs]);

    // Filter Logic - Memoized for optimization
    const filteredEvents = useMemo(() => {
        let filtered = turfs;
        if (searchQuery.trim()) {
            filtered = filtered.filter(e =>
                (e.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.venue || "").toLowerCase().includes(searchQuery.toLowerCase())
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
    }, [turfs, searchQuery, eventFilters]);

    useEffect(() => {
        // Handle category from URL if present
        const category = searchParams.get('category');
        if (category) {
            setEventFilters(prev => ({ ...prev, tags: [category] }));
        }
    }, [searchParams]);

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

    const resetFilters = () => {
        setEventFilters({ city: 'All', status: 'Active', date: 'All', tags: [] });
        setSearchQuery('');
    };

    if (dataLoading && turfs.length === 0) return <LoadingScreen message="Finding Available Venues" />;
    if (error) return <ErrorState error={error} onRetry={() => refreshData(1)} title="Transmission Interrupted" />;

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
                        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#111827] dark:text-gray-100 mb-2 tracking-tight uppercase">Sports</h1>
                        <p className="text-[#6B7280] dark:text-gray-400 text-[11px] font-black uppercase tracking-widest">Discover sports and book slots near you.</p>
                    </div>
                </div>
            </div>

            {/* Quick Filter Section */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] transition-all duration-300 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-0">
                        <button
                            onClick={() => setEventFilters(prev => ({ ...prev, tags: [] }))}
                            className={`py-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${eventFilters.tags.length === 0 ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                        >
                            All
                            {eventFilters.tags.length === 0 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left-2" />}
                        </button>
                        
                        {/* Specific Sports Tabs in Requested Order */}
                        {mainTabs.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => {
                                    setEventFilters(prev => ({ ...prev, tags: [tag] }));
                                    setIsMoreFiltersOpen(false);
                                }}
                                className={`py-4 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${eventFilters.tags.includes(tag) ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
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
                            className={`py-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group whitespace-nowrap ${eventFilters.tags.some(t => !mainTabs.includes(t)) ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                        >
                            <span>More Filters</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isMoreFiltersOpen && (
                            <div className="absolute top-full right-0 mt-0 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-b-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none py-4 z-[100] animate-in fade-in slide-in-from-top-2">
                                <div className="px-6 py-2 border-b border-gray-50 dark:border-gray-800 mb-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    All Categories
                                </div>
                                <div className="max-h-64 overflow-y-auto px-2 custom-scrollbar">
                                    {availableEventTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => {
                                                setEventFilters(prev => ({
                                                    ...prev,
                                                    tags: [tag] // Switch to single tag for simplicity in this view
                                                }));
                                                setIsMoreFiltersOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors mb-1 ${eventFilters.tags.includes(tag) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 min-h-[50vh]">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, idx) => (
                            <SportCard key={event.id} event={event} />
                        ))
                    ) : <EmptyState onReset={resetFilters} />}
                </div>
            </div>
        </div>
    );
};

// ============= COMPONENTS =============


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
