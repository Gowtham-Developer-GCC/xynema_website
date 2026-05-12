import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { Search, Filter, Sliders, Star, Loader, X, ArrowLeft, TrendingUp, MapPin, Calendar, Clock, Ticket, ChevronRight, ChevronDown, PartyPopper, Shield, Send, Users, Info, Check, ArrowRight, Sparkles, Building, Heart } from 'lucide-react';
import SEO from '../components/SEO';
import { designSystem } from '../config/design-system';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { animationStyles } from '../styles/components';
import { getEvents, getAllEventsList, submitPrivateEventEnquiry, toggleEventInterest } from '../services/eventService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { errorHandler, optimizeImage } from '../utils/helpers';
import { memo } from 'react';
import apiCacheManager from '../services/apiCacheManager';
import EventCard from '../components/EventCard';
import {PAGE_LIMIT} from '../services/eventService'

const Cardslice = 6;
const EVENT_PAGE_LIMIT = PAGE_LIMIT;
const SECTION_TABS = ['Near for you', 'Global'];

const ExplorePage = ({ initialTab = 'public_events' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedCity } = useData();
    
    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabFromUrl || initialTab);
    const [activeSection, setActiveSection] = useState('Near for you');
    const [error, setError] = useState(null);

    // ── State: Local Events (Near for you) ────────────────────────────
    const [localEvents, setLocalEvents] = useState(() => {
        const cached = apiCacheManager.get(`events_local_${selectedCity || 'all'}`);
        return Array.isArray(cached) ? cached : (cached?.events || []);
    });
    const [localLoading, setLocalLoading] = useState(!localEvents.length);
    const [isAppendingLocal, setIsAppendingLocal] = useState(false);
    const [localPagination, setLocalPagination] = useState({ page: 1, total: 0, hasNextPage: false });

    // ── State: Global Events ──────────────────────────────────────────
    const [globalEvents, setGlobalEvents] = useState(() => {
        const cached = apiCacheManager.get('events_global');
        return Array.isArray(cached) ? cached : (cached?.events || []);
    });
    const [globalLoading, setGlobalLoading] = useState(!globalEvents.length);
    const [isAppendingGlobal, setIsAppendingGlobal] = useState(false);
    const [globalPagination, setGlobalPagination] = useState({ page: 1, total: 0, hasNextPage: false });

    // ── State: Filters & Derived Data ─────────────────────────────────
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [filteredGlobalEvents, setFilteredGlobalEvents] = useState([]);
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [eventFilters, setEventFilters] = useState({ city: 'All', status: 'All', date: 'All', tags: [] });
    const [availableEventTags, setAvailableEventTags] = useState([]);
    const [availableEventCities, setAvailableEventCities] = useState([]);
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
    const moreFiltersRef = useRef(null);

    // ── Refs: Local Scroll ────────────────────────────────────────────
    const prefetchedLocal = useRef(null);
    const isFetchingLocal = useRef(false);
    const isPrefetchingLocal = useRef(false);
    const localScrollTimerRef = useRef(null);
    const didLocalInitCheck = useRef(false);
    const localAppendRef = useRef(null);

    // ── Refs: Global Scroll ───────────────────────────────────────────
    const prefetchedGlobal = useRef(null);
    const isFetchingGlobal = useRef(false);
    const isPrefetchingGlobal = useRef(false);
    const globalScrollTimerRef = useRef(null);
    const didGlobalInitCheck = useRef(false);
    const globalAppendRef = useRef(null);

    // Sync tab with URL
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && (tabFromUrl === 'public_events' || tabFromUrl === 'private_events')) {
            setActiveTab(tabFromUrl);
        } else if (!tabFromUrl) {
            setActiveTab(initialTab);
        }
    }, [searchParams, initialTab]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreFiltersRef.current && !moreFiltersRef.current.contains(event.target)) setIsMoreFiltersOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // LOCAL EVENTS (Near for you)
    // ─────────────────────────────────────────────────────────────────
    const prefetchNextLocalPage = useCallback(async (nextPage) => {
        if (prefetchedLocal.current?.page === nextPage) return;
        if (isPrefetchingLocal.current) return;
        isPrefetchingLocal.current = true;
        const cacheKey = `events_local_${selectedCity || 'all'}_p${nextPage}`;
        try {
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getEvents(selectedCity, nextPage, EVENT_PAGE_LIMIT),
                1800, false
            );
            const eventsData = Array.isArray(response) ? response : (response?.events || response?.data || []);
            if (eventsData.length > 0) prefetchedLocal.current = { page: nextPage, data: response };
        } catch (e) {
            console.warn('[LocalPrefetch] Silent fail page', nextPage, e?.message);
        } finally {
            isPrefetchingLocal.current = false;
        }
    }, [selectedCity]);

    const fetchLocalEvents = useCallback(async (page = 1, append = false, force = false) => {
        if (isFetchingLocal.current && page !== 1) return;
        isFetchingLocal.current = true;
        try {
            if (page === 1 && !append) setLocalLoading(true);
            if (append) setIsAppendingLocal(true);

            const cacheKey = `events_local_${selectedCity || 'all'}_p${page}`;
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getEvents(selectedCity, page, EVENT_PAGE_LIMIT),
                1800, force
            );

            const eventsList = Array.isArray(response) ? response : (response?.events || []);
            const newPagination = response?.pagination || { page, total: eventsList.length, hasNextPage: eventsList.length >= EVENT_PAGE_LIMIT };

            if (append) setLocalEvents(prev => [...prev, ...eventsList]);
            else { setLocalEvents(eventsList); prefetchedLocal.current = null; }
            
            setLocalPagination(newPagination);
            if (newPagination.hasNextPage) prefetchNextLocalPage(page + 1);
        } catch (err) {
            console.error('Error fetching local events:', err);
            if (!append) setError('Failed to load events. Please try again.');
        } finally {
            setLocalLoading(false);
            setIsAppendingLocal(false);
            isFetchingLocal.current = false;
        }
    }, [selectedCity, prefetchNextLocalPage]);

    const handleLoadMoreLocal = useCallback(() => {
        if (localLoading || isFetchingLocal.current) return;
        if (!localPagination?.hasNextPage) return;
        const nextPage = (localPagination.currentPage || localPagination.page || 1) + 1;

        if (prefetchedLocal.current?.page === nextPage) {
            setIsAppendingLocal(true);
            setTimeout(() => {
                const { data } = prefetchedLocal.current;
                prefetchedLocal.current = null;
                
                const eventsList = Array.isArray(data) ? data : (data?.events || []);
                setLocalEvents(prev => [...prev, ...eventsList]);
                setLocalPagination(data.pagination || { page: nextPage, hasNextPage: false });
                
                setIsAppendingLocal(false);
                if (data.pagination?.hasNextPage) prefetchNextLocalPage(nextPage + 1);
            }, 400);
        } else {
            fetchLocalEvents(nextPage, true);
        }
    }, [localLoading, localPagination, fetchLocalEvents, prefetchNextLocalPage]);

    useEffect(() => { localAppendRef.current = handleLoadMoreLocal; }, [handleLoadMoreLocal]);

    useEffect(() => {
        prefetchedLocal.current = null;
        isPrefetchingLocal.current = false;
        isFetchingLocal.current = false;
        didLocalInitCheck.current = false;
        fetchLocalEvents(1, false);
    }, [fetchLocalEvents]);

    // Local Scroll Trigger
    useEffect(() => {
        if (activeSection !== 'Near for you') return;
        const isFiltering = eventSearchQuery.trim().length > 0 || eventFilters.tags.length > 0;
        if (isFiltering) return;
        if (!localPagination?.hasNextPage) return;

        const checkAndLoadLocal = () => {
            if (localLoading || isFetchingLocal.current || isPrefetchingLocal.current) return;
            if (!localPagination?.hasNextPage) return;
            
            const currentPos = window.scrollY + window.innerHeight;
            const scrollBuffer = Math.max(window.innerHeight * 2.5, 1000);
            const threshold = document.documentElement.scrollHeight - scrollBuffer;
            
            if (currentPos >= threshold) localAppendRef.current?.();
        };

        const onScroll = () => {
            if (localScrollTimerRef.current) clearTimeout(localScrollTimerRef.current);
            localScrollTimerRef.current = setTimeout(checkAndLoadLocal, 100);
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        if (!didLocalInitCheck.current) {
            didLocalInitCheck.current = true;
            const initTimer = setTimeout(checkAndLoadLocal, 500);
            return () => {
                clearTimeout(initTimer);
                clearTimeout(localScrollTimerRef.current);
                window.removeEventListener('scroll', onScroll);
            };
        }

        return () => {
            clearTimeout(localScrollTimerRef.current);
            window.removeEventListener('scroll', onScroll);
        };
    }, [activeSection, localPagination, eventSearchQuery, eventFilters, localLoading]);

    // ─────────────────────────────────────────────────────────────────
    // GLOBAL EVENTS
    // ─────────────────────────────────────────────────────────────────
    const prefetchNextGlobalPage = useCallback(async (nextPage) => {
        if (prefetchedGlobal.current?.page === nextPage) return;
        if (isPrefetchingGlobal.current) return;
        isPrefetchingGlobal.current = true;
        const cacheKey = `events_global_p${nextPage}`;
        try {
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getAllEventsList(nextPage, EVENT_PAGE_LIMIT),
                1800, false
            );
            const eventsData = Array.isArray(response) ? response : (response?.events || response?.data || []);
            if (eventsData.length > 0) prefetchedGlobal.current = { page: nextPage, data: response };
        } catch (e) {
            console.warn('[GlobalPrefetch] Silent fail page', nextPage, e?.message);
        } finally {
            isPrefetchingGlobal.current = false;
        }
    }, []);

    const fetchGlobalEvents = useCallback(async (page = 1, append = false, force = false) => {
        if (isFetchingGlobal.current && page !== 1) return;
        isFetchingGlobal.current = true;
        try {
            if (page === 1 && !append) setGlobalLoading(true);
            if (append) setIsAppendingGlobal(true);

            const cacheKey = `events_global_p${page}`;
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getAllEventsList(page, EVENT_PAGE_LIMIT),
                1800, force
            );

            const eventsList = Array.isArray(response) ? response : (response?.events || []);
            const newPagination = response?.pagination || { page, total: eventsList.length, hasNextPage: eventsList.length >= EVENT_PAGE_LIMIT };

            if (append) setGlobalEvents(prev => [...prev, ...eventsList]);
            else { setGlobalEvents(eventsList); prefetchedGlobal.current = null; }
            
            setGlobalPagination(newPagination);
            if (newPagination.hasNextPage) prefetchNextGlobalPage(page + 1);
        } catch (err) {
            console.error('Error fetching global events:', err);
        } finally {
            setGlobalLoading(false);
            setIsAppendingGlobal(false);
            isFetchingGlobal.current = false;
        }
    }, [prefetchNextGlobalPage]);

    const handleLoadMoreGlobal = useCallback(() => {
        if (globalLoading || isFetchingGlobal.current) return;
        if (!globalPagination?.hasNextPage) return;
        const nextPage = (globalPagination.currentPage || globalPagination.page || 1) + 1;

        if (prefetchedGlobal.current?.page === nextPage) {
            setIsAppendingGlobal(true);
            setTimeout(() => {
                const { data } = prefetchedGlobal.current;
                prefetchedGlobal.current = null;
                
                const eventsList = Array.isArray(data) ? data : (data?.events || []);
                setGlobalEvents(prev => [...prev, ...eventsList]);
                setGlobalPagination(data.pagination || { page: nextPage, hasNextPage: false });
                
                setIsAppendingGlobal(false);
                if (data.pagination?.hasNextPage) prefetchNextGlobalPage(nextPage + 1);
            }, 400);
        } else {
            fetchGlobalEvents(nextPage, true);
        }
    }, [globalLoading, globalPagination, fetchGlobalEvents, prefetchNextGlobalPage]);

    useEffect(() => { globalAppendRef.current = handleLoadMoreGlobal; }, [handleLoadMoreGlobal]);

    useEffect(() => {
        prefetchedGlobal.current = null;
        isPrefetchingGlobal.current = false;
        isFetchingGlobal.current = false;
        didGlobalInitCheck.current = false;
        fetchGlobalEvents(1, false);
    }, [fetchGlobalEvents]);

    // Global Scroll Trigger
    useEffect(() => {
        if (activeSection !== 'Global') return;
        const isFiltering = eventSearchQuery.trim().length > 0 || eventFilters.tags.length > 0;
        if (isFiltering) return;
        if (!globalPagination?.hasNextPage) return;

        const checkAndLoadGlobal = () => {
            if (globalLoading || isFetchingGlobal.current || isPrefetchingGlobal.current) return;
            if (!globalPagination?.hasNextPage) return;
            
            const currentPos = window.scrollY + window.innerHeight;
            const scrollBuffer = Math.max(window.innerHeight * 1.5, 1000);
            const threshold = document.documentElement.scrollHeight - scrollBuffer;
            
            if (currentPos >= threshold) globalAppendRef.current?.();
        };

        const onScroll = () => {
            if (globalScrollTimerRef.current) clearTimeout(globalScrollTimerRef.current);
            globalScrollTimerRef.current = setTimeout(checkAndLoadGlobal, 100);
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        if (!didGlobalInitCheck.current) {
            didGlobalInitCheck.current = true;
            const initTimer = setTimeout(checkAndLoadGlobal, 500);
            return () => {
                clearTimeout(initTimer);
                clearTimeout(globalScrollTimerRef.current);
                window.removeEventListener('scroll', onScroll);
            };
        }

        return () => {
            clearTimeout(globalScrollTimerRef.current);
            window.removeEventListener('scroll', onScroll);
        };
    }, [activeSection, globalPagination, eventSearchQuery, eventFilters, globalLoading]);

    // ─────────────────────────────────────────────────────────────────
    // Filter Logic & Tag Extraction
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const category = searchParams.get('category');
        if (category) setEventFilters(prev => ({ ...prev, tags: [category] }));
    }, [searchParams]);

    useEffect(() => {
        const allAvailableEvents = [...localEvents, ...globalEvents];
        const tags = Array.from(new Set(allAvailableEvents.flatMap(e => e.tags || []).filter(Boolean))).sort();
        const cities = Array.from(new Set(allAvailableEvents.map(e => e.city).filter(Boolean))).sort();
        setAvailableEventTags(tags);
        setAvailableEventCities(cities);
    }, [localEvents, globalEvents]);

    useEffect(() => {
        const filterData = (data) => {
            let filtered = data;
            if (eventSearchQuery.trim()) {
                filtered = filtered.filter(e =>
                    (e.name || "").toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                    (e.description || "").toLowerCase().includes(eventSearchQuery.toLowerCase())
                );
            }
            if (eventFilters.city !== 'All') filtered = filtered.filter(e => e.city === eventFilters.city);
            if (eventFilters.tags.length > 0) {
                filtered = filtered.filter(e => (e.tags || []).some(tag => eventFilters.tags.includes(tag)));
            }
            return filtered;
        };

        setFilteredEvents(filterData(localEvents));
        setFilteredGlobalEvents(filterData(globalEvents));
    }, [localEvents, globalEvents, eventSearchQuery, eventFilters]);

    const resetFilters = () => {
        setEventFilters({ city: 'All', status: 'All', date: 'All', tags: [] });
        setEventSearchQuery('');
    };

    const activeSectionTags = useMemo(() => {
        const sourceEvents = activeSection === 'Near for you' ? localEvents : globalEvents;
        return Array.from(new Set(sourceEvents.flatMap(e => e.tags || []).filter(Boolean))).sort();
    }, [activeSection, localEvents, globalEvents]);


    if (localLoading && localEvents.length === 0) return <LoadingScreen message="Scanning Library" />;
    if (error) return <ErrorState error={error} onRetry={() => { fetchLocalEvents(1, false, true); fetchGlobalEvents(1, false, true); }} title="Access Interrupted" buttonText="Try Refreshing" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title={activeTab === 'private_events' ? "Host Your Event - XYNEMA" : "Explore Events - XYNEMA"}
                description={activeTab === 'private_events' ? "Host your private event with XYNEMA" : "Discover live events near you"}
            />

            {/* Header */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#111827] dark:text-gray-100 mb-2 tracking-tight">
                            {activeTab === 'private_events' ? 'Host Your Event' : 'Events'}
                        </h1>
                        <p className="text-[#6B7280] dark:text-gray-400 text-sm md:text-base font-sans">
                            {activeTab === 'private_events' 
                                ? 'Create unforgettable experiences with our premium venues' 
                                : 'Discover curated experiences near you.'}
                        </p>
                    </div>
                    {activeTab === 'public_events' && (
                        <button
                            onClick={() => handleTabChange('private_events')}
                            className="flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-display"
                        >
                            <Sparkles className="w-4 h-4" />
                            Host Your Event
                        </button>
                    )}
                    {activeTab === 'private_events' && (
                        <button
                            onClick={() => handleTabChange('public_events')}
                            className="flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-display"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Events
                        </button>
                    )}
                </div>
            </div>

            {/* Section Tab Switcher: Near for you | Global */}
            {activeTab === 'public_events' && (
                <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors duration-300">
                    <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 overflow-x-auto no-scrollbar">
                        {SECTION_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveSection(tab);
                                    setIsMoreFiltersOpen(false);
                                }}
                                className={`py-4 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeSection === tab
                                        ? 'text-primary'
                                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                                {activeSection === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left-2" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {activeTab === 'public_events' && (
                    <>
                        {/* Category Filter Chips */}
                        <div className="relative flex items-center justify-between gap-6 pb-4 mb-8 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-1 py-1">
                                <button
                                    onClick={() => {
                                        setEventFilters(prev => ({ ...prev, tags: [] }));
                                        setIsMoreFiltersOpen(false);
                                    }}
                                    className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${eventFilters.tags.length === 0
                                            ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                            : 'bg-white dark:bg-gray-850 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800'
                                        }`}
                                >
                                    All
                                </button>
                                {activeSectionTags.slice(0, 4).map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setEventFilters(prev => ({ ...prev, tags: [tag] }));
                                            setIsMoreFiltersOpen(false);
                                        }}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${eventFilters.tags.length === 1 && eventFilters.tags.includes(tag)
                                                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                                : 'bg-white dark:bg-gray-850 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {activeSectionTags.length > 4 && (
                                <div className="relative shrink-0" ref={moreFiltersRef}>
                                    <button
                                        onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-all border ${isMoreFiltersOpen
                                                ? 'bg-gray-100 dark:bg-gray-750 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                                                : 'bg-white dark:bg-gray-850 text-gray-400 border-gray-200 dark:border-gray-800'
                                            }`}
                                    >
                                        More Filters
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isMoreFiltersOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-3 z-[100] animate-in fade-in slide-in-from-top-2">
                                            <div className="px-4 pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">All Categories</div>
                                            <div className="max-h-52 overflow-y-auto px-2">
                                                {activeSectionTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => {
                                                            setEventFilters(prev => ({ ...prev, tags: [tag] }));
                                                            setIsMoreFiltersOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors mb-1 ${eventFilters.tags.includes(tag)
                                                                ? 'bg-primary/10 text-primary font-bold'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ===== NEAR FOR YOU TAB ===== */}
                        {activeSection === 'Near for you' && (
                            <div>
                                <div className="mb-8">
                                    <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight flex items-center gap-2">
                                        {selectedCity && selectedCity !== 'All' ? `Events in ${selectedCity}` : 'Trending Events near you'}
                                    </h2>
                                    <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-1">Popular right now</p>
                                </div>

                                {filteredEvents.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                            {filteredEvents.slice(0, Cardslice).map((event, idx) => (
                                                <EventCard key={event.id || event._id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
                                            ))}
                                        </div>

                                        <div className="my-16">
                                            <PrivateEventBanner onNavigate={() => handleTabChange('private_events')} />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 min-h-[10vh]">
                                            {filteredEvents.length > Cardslice && (
                                                filteredEvents.slice(Cardslice).map((event, idx) => (
                                                    <EventCard key={event.id || event._id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
                                                ))
                                            )}
                                            
                                            {/* Scroll Skeletons */}
                                            {isAppendingLocal && (
                                                <>
                                                    <EventCardSkeleton />
                                                    <EventCardSkeleton />
                                                    <EventCardSkeleton />
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : localLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                        {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
                                    </div>
                                ) : <EmptyState onReset={resetFilters} />}
                            </div>
                        )}

                        {/* ===== GLOBAL TAB ===== */}
                        {activeSection === 'Global' && (
                            <div>
                                <div className="mb-8">
                                    <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight flex items-center gap-2">
                                        Global Events
                                    </h2>
                                    <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-1">Explore all events listed globally</p>
                                </div>

                                {filteredGlobalEvents.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                            {filteredGlobalEvents.slice(0, Cardslice).map((event, idx) => (
                                                <EventCard key={event.id || event._id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
                                            ))}
                                        </div>

                                        <div className="my-16">
                                            <PrivateEventBanner onNavigate={() => handleTabChange('private_events')} />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 min-h-[10vh]">
                                            {filteredGlobalEvents.length > Cardslice && (
                                                filteredGlobalEvents.slice(Cardslice).map((event, idx) => (
                                                    <EventCard key={event.id || event._id} event={{ ...event, delayClass: `delay-${(idx % 3) * 100}` }} />
                                                ))
                                            )}

                                            {/* Scroll Skeletons */}
                                            {isAppendingGlobal && (
                                                <>
                                                    <EventCardSkeleton />
                                                    <EventCardSkeleton />
                                                    <EventCardSkeleton />
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : globalLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                        {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
                                    </div>
                                ) : <EmptyState onReset={resetFilters} />}
                            </div>
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

const EventCardSkeleton = () => (
    <div className="bg-white dark:bg-[#1a1c23] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-full animate-pulse shadow-sm">
        <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-800 relative">
            <div className="absolute top-4 left-4 h-6 w-16 bg-white/40 dark:bg-black/20 rounded-md backdrop-blur-sm" />
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-md mb-3" />
            <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-md" />
            </div>
            <div className="flex items-center gap-2 mb-5">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
                <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-md" />
            </div>
            <div className="mt-auto flex items-center gap-2">
                <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800/50 rounded-full" />
                <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800/50 rounded-full" />
            </div>
        </div>
    </div>
);

const PrivateEventBanner = ({ onNavigate }) => {
    return (
        <div className="w-full bg-[#1E2532] dark:bg-[#1a1d24] border border-white/10 rounded-xl text-white p-6 sm:p-10 md:p-14 overflow-hidden relative shadow-2xl">
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

const PrivateEventsSection = ({ onCancel }) => {
    const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', eventType: '', eventDescription: '' });
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
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: errorHandler.getUserMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 bg-[#F5F7F9] dark:bg-[#0f1115]">
            <div className="w-full bg-[#1E2532] dark:bg-[#1a1d24] text-white overflow-hidden relative border-b border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="text-center max-w-2xl mx-auto pt-24 pb-32 px-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 rounded-full text-[10px] font-black tracking-widest mb-8 border border-primary/30 font-roboto">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-white">PRIVATE EVENT HOSTING</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6">Host Your Private Event</h2>
                    <p className="text-lg text-gray-300 leading-relaxed font-sans">
                        Create unforgettable experiences with our premium venues and personalized event management. Fill out the form below and our team will craft the perfect event for you.
                    </p>
                </div>
            </div>

            <div id="enquiry-form" className="relative z-10 -mt-16 max-w-4xl mx-auto px-4">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-lg p-8 md:p-12 border border-white/40 dark:border-gray-700 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
                    <div className="mb-10 text-left border-b border-gray-100 dark:border-gray-700 pb-6">
                        <h3 className="text-[28px] font-roboto font-black text-gray-900 dark:text-gray-100 ">Event Request Form</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-sans">Please provide us with the details of your event and we'll get back to you shortly.</p>
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
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans" placeholder="Enter your full name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number <span className="text-red-500">*</span></label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans" placeholder="Enter your phone number" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans" placeholder="Enter your email address" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Type <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select name="eventType" value={formData.eventType} onChange={handleChange} required className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none font-sans ${formData.eventType ? 'text-gray-900 dark:text-gray-100' : 'text-[#9CA3AF] dark:text-gray-400'}`} style={{ colorScheme: 'dark' }}>
                                        <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Select event type</option>
                                        <option value="public-event" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Public Event</option>
                                        <option value="private-event" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Private Event</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400"><ChevronDown className="w-4 h-4" /></div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Description</label>
                            <textarea name="eventDescription" value={formData.eventDescription} onChange={handleChange} required rows="4" className="w-full px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y font-sans" placeholder="Tell us about your event, requirements, preferences, or special arrangements..." />
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4 border-t border-white/20 dark:border-gray-700">
                            <button type="button" onClick={() => { setFormData({ fullName: '', phone: '', email: '', eventType: '', eventDescription: '' }); if (onCancel) onCancel(); }} className="w-full sm:w-auto px-8 py-3.5 bg-white/30 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 border border-white/40 dark:border-gray-700 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 font-medium transition-colors backdrop-blur-md">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="w-full sm:w-auto px-10 py-3.5 bg-primary text-white rounded-lg font-black font-roboto tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>Submit Request</span>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4"><Clock className="w-6 h-6" /></div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Quick Response</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Our team will review your request and contact you within 24-48 hours.</p>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4"><Building className="w-6 h-6" /></div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Premium Venues</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Access to exclusive venues across multiple cities and locations.</p>
                </div>
                <div className="bg-white dark:bg-[#1a1c23] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4"><Sparkles className="w-6 h-6" /></div>
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
        <button onClick={onReset} className="mt-8 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 font-roboto">
            Reset Explore
        </button>
    </div>
);



export default ExplorePage;