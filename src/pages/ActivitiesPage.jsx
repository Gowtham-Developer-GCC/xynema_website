import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, TreePine, Dumbbell, ArrowRight, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { useData } from '../context/DataContext';
import SportCard from '../components/SportCard';
import ParkCard from '../components/ParkCard';
import { getAllParks, PARK_PAGE_LIMIT } from '../services/parkService';
import { getAvailableTurfs, TURF_PAGE_LIMIT } from '../services/turfService';
import apiCacheManager from '../services/apiCacheManager';

// ─────────────── Constants ───────────────
const SECTION_TABS  = ['All', 'Turfs', 'Parks'];
const SPORT_TAGS    = ['Cricket', 'Football', 'Tennis', 'Swimming', 'Badminton'];

const formatSportTagLabel = (tag, isTitleCase = false) => {
    if (!tag || tag === 'All') return tag;
    const spaced = tag.replace(/_/g, ' ');
    if (isTitleCase) {
        return spaced.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return spaced;
};

const ActivitiesPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedCity, loading: dataLoading, refreshData: refreshGlobalData } = useData();

    const sectionFromUrl = searchParams.get('section') || 'All';
    const [activeSection, setActiveSection] = useState(
        SECTION_TABS.includes(sectionFromUrl) ? sectionFromUrl : 'All'
    );

    // ── State ─────────────────────────────────────────────────────────
    const [allTurfs, setAllTurfs] = useState(() => {
        const cached = apiCacheManager.get(`turfs_${selectedCity || 'all'}`);
        if (Array.isArray(cached)) return cached;
        return cached?.turfs || [];
    });
    const [allParks, setAllParks] = useState(() => {
        const cacheKey = `parks_${selectedCity || 'all'}_tall_p1_s`;
        const cached = apiCacheManager.get(cacheKey);
        if (Array.isArray(cached)) return cached;
        return cached?.parks || [];
    });
    const [error, setError]             = useState(null);
    const [turfsLoading, setTurfsLoading] = useState(() => {
        const cached = apiCacheManager.get(`turfs_${selectedCity || 'all'}`);
        const hasCache = Array.isArray(cached) ? cached.length > 0 : (cached?.turfs?.length > 0);
        return !hasCache;
    });
    const [parksLoading, setParksLoading] = useState(() => {
        const cacheKey = `parks_${selectedCity || 'all'}_tall_p1_s`;
        const cached = apiCacheManager.get(cacheKey);
        const hasCache = Array.isArray(cached) ? cached.length > 0 : (cached?.parks?.length > 0);
        return !hasCache;
    });
    const [isAppendingTurfs, setIsAppendingTurfs] = useState(false);
    const [isAppendingParks, setIsAppendingParks] = useState(false);
    const [turfsPagination, setTurfsPagination] = useState({ page: 1, total: 0, hasNextPage: false });
    const [parksPagination, setParksPagination] = useState({ page: 1, total: 0, hasNextPage: false });
    const [searchQuery, setSearchQuery]       = useState('');
    const [activeSportTag, setActiveSportTag] = useState('All');
    const [activeParkType, setActiveParkType] = useState('All');
    const [availableSportTypes, setAvailableSportTypes] = useState([]);
    const [availableParkTypes, setAvailableParkTypes] = useState([]);
    const [isMoreFiltersOpen, setIsMoreFiltersOpen]           = useState(false);
    const [isMoreParksFiltersOpen, setIsMoreParksFiltersOpen] = useState(false);

    // ── Refs ──────────────────────────────────────────────────────────
    const moreFiltersRef      = useRef(null);
    const moreParksFiltersRef = useRef(null);

    // Turf scroll refs
    const prefetchedTurfs    = useRef(null);
    const isFetchingTurfs    = useRef(false);
    const isPrefetchingTurfs = useRef(false);
    const scrollTimerRef     = useRef(null);
    const didInitCheck       = useRef(false);
    const appendHandlerRef   = useRef(null);

    // Park scroll refs
    const prefetchedParks    = useRef(null);
    const isFetchingParks    = useRef(false);
    const isPrefetchingParks = useRef(false);
    const parkScrollTimerRef = useRef(null);
    const didParkInitCheck   = useRef(false);
    const parkAppendRef      = useRef(null);

    // ─────────────────────────────────────────────────────────────────
    // TURFS — prefetch + fetch + load more
    // ─────────────────────────────────────────────────────────────────

    const prefetchNextTurfsPage = useCallback(async (nextPage) => {
        if (prefetchedTurfs.current?.page === nextPage) return;
        if (isPrefetchingTurfs.current) return;
        isPrefetchingTurfs.current = true;
        const activeTag = activeSportTag !== 'All' ? activeSportTag : null;
        const cacheKey = `turfs_${selectedCity || 'all'}_t${activeTag || 'all'}_p${nextPage}_s${searchQuery || ''}`;
        try {
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getAvailableTurfs({ city: selectedCity, search: searchQuery, page: nextPage, limit: TURF_PAGE_LIMIT, sportType: activeTag }),
                1800, false
            );
            if (response?.turfs) prefetchedTurfs.current = { page: nextPage, data: response };
        } catch (e) {
            console.warn('[TurfPrefetch] Silent fail page', nextPage, e?.message);
        } finally {
            isPrefetchingTurfs.current = false;
        }
    }, [selectedCity, searchQuery, activeSportTag]);

    const fetchTurfs = useCallback(async (page = 1, append = false, force = false) => {
        if (isFetchingTurfs.current && page !== 1) return;
        isFetchingTurfs.current = true;
        try {
            if (page === 1 && !append) setTurfsLoading(true);
            if (append) setIsAppendingTurfs(true);
            const activeTag = activeSportTag !== 'All' ? activeSportTag : null;
            const cacheKey = `turfs_${selectedCity || 'all'}_t${activeTag || 'all'}_p${page}_s${searchQuery || ''}`;
            
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getAvailableTurfs({ city: selectedCity, search: searchQuery, page, limit: TURF_PAGE_LIMIT, sportType: activeTag }),
                1800, force
            );
            if (response?.turfs) {
                const newPagination = response.pagination || { page, total: 0, hasNextPage: false };
                if (append) setAllTurfs(prev => [...prev, ...response.turfs]);
                else { setAllTurfs(response.turfs); prefetchedTurfs.current = null; }
                setTurfsPagination(newPagination);
                if (newPagination.hasNextPage && activeSection === 'Turfs') prefetchNextTurfsPage(page + 1);
                
                if (response.availableSportTypes && response.availableSportTypes.length > 0) {
                    setAvailableSportTypes(response.availableSportTypes);
                }
            }
        } catch (err) {
            console.error('Error fetching turfs:', err);
        } finally {
            setTurfsLoading(false);
            setIsAppendingTurfs(false);
            isFetchingTurfs.current = false;
        }
    }, [selectedCity, searchQuery, activeSportTag, activeSection, prefetchNextTurfsPage]);

    const handleLoadMoreTurfs = useCallback(() => {
        if (turfsLoading || isFetchingTurfs.current) return;
        if (!turfsPagination?.hasNextPage) return;
        const nextPage = (turfsPagination.page || 1) + 1;

        if (prefetchedTurfs.current?.page === nextPage) {
            // 1. Instantly show the skeletons
            setIsAppendingTurfs(true);
            
            // 2. Deliberately allow visual duration for grounding
            setTimeout(() => {
                const { data } = prefetchedTurfs.current;
                prefetchedTurfs.current = null;
                setAllTurfs(prev => [...prev, ...data.turfs]);
                setTurfsPagination(data.pagination || { page: nextPage, hasNextPage: false });
                
                // 3. Disperse skeletons smoothly
                setIsAppendingTurfs(false);
                if (data.pagination?.hasNextPage) prefetchNextTurfsPage(nextPage + 1);
            }, 400);
        } else {
            fetchTurfs(nextPage, true);
        }
    }, [turfsLoading, turfsPagination, fetchTurfs, prefetchNextTurfsPage]);

    // Keep appendHandlerRef in sync
    useEffect(() => { appendHandlerRef.current = handleLoadMoreTurfs; }, [handleLoadMoreTurfs]);

    // Turfs useEffect — reset + load on city/search change
    useEffect(() => {
        if (activeSection !== 'All' && activeSection !== 'Turfs') return;
        prefetchedTurfs.current    = null;
        isPrefetchingTurfs.current = false;
        isFetchingTurfs.current    = false;
        didInitCheck.current       = false;
        fetchTurfs(1, false);
    }, [fetchTurfs, activeSection]);

    // ─── Turf scroll trigger ──────────────────────────────────────────
    useEffect(() => {
        if (activeSection !== 'Turfs') return;
        const isFiltering = searchQuery.trim().length > 0;
        if (isFiltering) return;
        if (!turfsPagination?.hasNextPage) return;

        const checkAndLoad = () => {
            if (turfsLoading || isFetchingTurfs.current || isPrefetchingTurfs.current) return;
            if (!turfsPagination?.hasNextPage) return;
            const currentPos = window.scrollY + window.innerHeight;
            
            // Responsive threshold: Triggers 1.5 screens away from bottom, minimum 1000px buffer
            const scrollBuffer = Math.max(window.innerHeight * 2.5, 1000);
            const threshold = document.documentElement.scrollHeight - scrollBuffer;
            
            if (currentPos >= threshold) appendHandlerRef.current?.();
        };

        const onScroll = () => {
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
            scrollTimerRef.current = setTimeout(checkAndLoad, 150);
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        if (!didInitCheck.current) {
            didInitCheck.current = true;
            const initTimer = setTimeout(checkAndLoad, 500);
            return () => {
                clearTimeout(initTimer);
                clearTimeout(scrollTimerRef.current);
                window.removeEventListener('scroll', onScroll);
            };
        }

        return () => {
            clearTimeout(scrollTimerRef.current);
            window.removeEventListener('scroll', onScroll);
        };
    }, [activeSection, turfsPagination?.page, turfsPagination?.hasNextPage, activeSportTag, searchQuery, turfsLoading]);

    // Reset turf init check on city/search change
    useEffect(() => { didInitCheck.current = false; }, [selectedCity, searchQuery]);

    // ─────────────────────────────────────────────────────────────────
    // PARKS — exact same pattern as turfs
    // ─────────────────────────────────────────────────────────────────

    const prefetchNextParksPage = useCallback(async (nextPage) => {
        if (prefetchedParks.current?.page === nextPage) return;
        if (isPrefetchingParks.current) return;
        isPrefetchingParks.current = true;
        const typeTag = activeParkType !== 'All' ? activeParkType : null;
        const cacheKey = `parks_${selectedCity || 'all'}_t${typeTag || 'all'}_p${nextPage}_s${searchQuery || ''}`;
        try {
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getAllParks({ city: selectedCity, search: searchQuery, page: nextPage, limit: PARK_PAGE_LIMIT, parkType: typeTag }),
                1800, false
            );
            const parks = response.parks || (Array.isArray(response) ? response : []);
            if (parks.length > 0) prefetchedParks.current = { page: nextPage, data: response };
        } catch (e) {
            console.warn('[ParkPrefetch] Silent fail page', nextPage, e?.message);
        } finally {
            isPrefetchingParks.current = false;
        }
    }, [selectedCity, searchQuery, activeParkType]);

    const fetchParks = useCallback(async (page = 1, append = false, force = false) => {
        if (isFetchingParks.current && page !== 1) return;
        isFetchingParks.current = true;
        try {
            if (page === 1 && !append) setParksLoading(true);
            if (append) setIsAppendingParks(true);
            
            // Fix 2: Separate page 1 from generic context cache key
            const typeTag = activeParkType !== 'All' ? activeParkType : null;
            const cacheKey = `parks_${selectedCity || 'all'}_t${typeTag || 'all'}_p${page}_s${searchQuery || ''}`;
            
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getAllParks({ city: selectedCity, search: searchQuery, page, limit: PARK_PAGE_LIMIT, parkType: typeTag }),
                1800, force
            );
            
            const parksArray = response.parks || (Array.isArray(response) ? response : []);
            const rawPagination = response.pagination;
            
            const hasNextPage = rawPagination ? rawPagination.hasNextPage : (parksArray.length >= PARK_PAGE_LIMIT); 

            const newPagination = {
                page,
                total: rawPagination ? rawPagination.total : (hasNextPage ? 9999 : (page - 1) * PARK_PAGE_LIMIT + parksArray.length),
                hasNextPage,
            };

            if (append) setAllParks(prev => [...prev, ...parksArray]);
            else { setAllParks(parksArray); prefetchedParks.current = null; }
            
            setParksPagination(newPagination);
            if (hasNextPage && activeSection === 'Parks') prefetchNextParksPage(page + 1);

            if (response.availableParkTypes && response.availableParkTypes.length > 0) {
                setAvailableParkTypes(response.availableParkTypes);
            }
        } catch (err) {
            console.error('Error fetching parks:', err);
            if (!append) setError('Failed to load parks. Please try again.');
        } finally {
            setParksLoading(false);
            setIsAppendingParks(false);
            isFetchingParks.current = false;
        }
    }, [selectedCity, searchQuery, activeParkType, activeSection, prefetchNextParksPage]);

    const handleLoadMoreParks = useCallback(() => {
        if (parksLoading || isFetchingParks.current) return;
        if (!parksPagination?.hasNextPage) return;
        const nextPage = (parksPagination.page || 1) + 1;

        if (prefetchedParks.current?.page === nextPage) {
            // 1. Instantly show the skeletons
            setIsAppendingParks(true);
            
            // 2. Deliberately allow visual duration for grounding
            setTimeout(() => {
                const { data } = prefetchedParks.current;
                prefetchedParks.current = null;
                
                const parksArray = data.parks || (Array.isArray(data) ? data : []);
                setAllParks(prev => [...prev, ...parksArray]);
                
                const rawPagination = data.pagination;
                const hasNextPage = rawPagination ? rawPagination.hasNextPage : (parksArray.length >= PARK_PAGE_LIMIT);
                setParksPagination({
                    page: nextPage,
                    total: rawPagination ? rawPagination.total : (hasNextPage ? 9999 : (nextPage - 1) * PARK_PAGE_LIMIT + parksArray.length),
                    hasNextPage,
                });
                
                // 3. Disperse skeletons smoothly
                setIsAppendingParks(false);
                if (hasNextPage) prefetchNextParksPage(nextPage + 1);
            }, 400);
        } else {
            fetchParks(nextPage, true);
        }
    }, [parksLoading, parksPagination, fetchParks, prefetchNextParksPage]);

    // Keep parkAppendRef in sync
    useEffect(() => { parkAppendRef.current = handleLoadMoreParks; }, [handleLoadMoreParks]);

    // Parks useEffect — reset + load on city/search change
    useEffect(() => {
        if (activeSection !== 'All' && activeSection !== 'Parks') return;
        prefetchedParks.current    = null;
        isPrefetchingParks.current = false;
        isFetchingParks.current    = false;
        didParkInitCheck.current   = false;
        fetchParks(1, false);
    }, [fetchParks, activeSection]);

    // ─── Park scroll trigger — exact mirror of turf scroll ────────────
    useEffect(() => {
        if (activeSection !== 'Parks') return;
        const isFiltering = searchQuery.trim().length > 0 || activeParkType !== 'All';
        if (isFiltering) return;
        if (!parksPagination?.hasNextPage) return;

        const checkAndLoadParks = () => {
            if (parksLoading || isFetchingParks.current || isPrefetchingParks.current) return;
            if (!parksPagination?.hasNextPage) return;
            const currentPos = window.scrollY + window.innerHeight;
            
            // Responsive threshold: Triggers 1.5 screens away from bottom, minimum 1000px buffer
            const scrollBuffer = Math.max(window.innerHeight * 1.5, 1000);
            const threshold = document.documentElement.scrollHeight - scrollBuffer;
            
            if (currentPos >= threshold) parkAppendRef.current?.();
        };

        const onParkScroll = () => {
            if (parkScrollTimerRef.current) clearTimeout(parkScrollTimerRef.current);
            parkScrollTimerRef.current = setTimeout(checkAndLoadParks, 150);
        };

        window.addEventListener('scroll', onParkScroll, { passive: true });

        if (!didParkInitCheck.current) {
            didParkInitCheck.current = true;
            const initTimer = setTimeout(checkAndLoadParks, 500);
            return () => {
                clearTimeout(initTimer);
                clearTimeout(parkScrollTimerRef.current);
                window.removeEventListener('scroll', onParkScroll);
            };
        }

        return () => {
            clearTimeout(parkScrollTimerRef.current);
            window.removeEventListener('scroll', onParkScroll);
        };
    }, [activeSection, parksPagination?.page, parksPagination?.hasNextPage, activeParkType, searchQuery, parksLoading]);

    // Reset park init check on city/search change
    useEffect(() => { didParkInitCheck.current = false; }, [selectedCity, searchQuery]);

    // ─────────────────────────────────────────────────────────────────
    // Retry
    // ─────────────────────────────────────────────────────────────────
    const handleRetry = () => {
        setError(null);
        refreshGlobalData(1);
        fetchParks(1, false, true);
        fetchTurfs(1, false, true);
    };

    // ─────────────────────────────────────────────────────────────────
    // Derived / filtered data
    // ─────────────────────────────────────────────────────────────────

    const availableSportTags = useMemo(() => {
        if (availableSportTypes && availableSportTypes.length > 0) {
            return availableSportTypes;
        }
        const dynamicTags = Array.from(new Set(allTurfs.flatMap(t => t.tags || []))).filter(Boolean);
        return Array.from(new Set([...SPORT_TAGS, ...dynamicTags])).sort();
    }, [allTurfs, availableSportTypes]);

    const filteredTurfs = useMemo(() => {
        let list = allTurfs;
        if (searchQuery.trim()) list = list.filter(e =>
            (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.venue || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        // Note: Backend handles activeSportTag now
        return list;
    }, [allTurfs, searchQuery]);

    const mainSportTags    = useMemo(() => availableSportTags.slice(0, 4), [availableSportTags]);
    const dropdownSportTags = useMemo(() => availableSportTags.slice(4), [availableSportTags]);

    const parkTypesOnly = useMemo(() => {
        if (availableParkTypes && availableParkTypes.length > 0) {
            return availableParkTypes;
        }
        return Array.from(new Set(allParks.map(p => p.type))).filter(Boolean).sort();
    }, [allParks, availableParkTypes]);
    const mainParkTypes  = useMemo(() => parkTypesOnly.slice(0, 4), [parkTypesOnly]);
    const dropdownParkTypes = useMemo(() => parkTypesOnly.slice(4), [parkTypesOnly]);

    const filteredParks = useMemo(() => {
        let list = allParks;
        if (searchQuery.trim()) list = list.filter(p =>
            (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        // Note: Backend handles parkType filtration now
        return list;
    }, [allParks, searchQuery]);

    // ─────────────────────────────────────────────────────────────────
    // Tab + filter handlers
    // ─────────────────────────────────────────────────────────────────

    const handleSectionChange = (section) => {
        setActiveSection(section);
        setSearchParams({ section });
        setSearchQuery('');
        setActiveSportTag('All');
        setActiveParkType('All');
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target))
                setIsMoreFiltersOpen(false);
            if (moreParksFiltersRef.current && !moreParksFiltersRef.current.contains(e.target))
                setIsMoreParksFiltersOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial Load Check
    const isInitialActivitiesLoading = 
        (activeSection === 'All' && (turfsLoading || parksLoading) && allTurfs.length === 0 && allParks.length === 0) ||
        (activeSection === 'Turfs' && turfsLoading && allTurfs.length === 0) ||
        (activeSection === 'Parks' && parksLoading && allParks.length === 0);

    if (isInitialActivitiesLoading) return <LoadingScreen message="Finding activities near you" />;
    if (error) return <ErrorState error={error} onRetry={handleRetry} title="Connection Issue" />;

    // ─────────────────────────────────────────────────────────────────
    // JSX
    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO
                title="Activities - XYNEMA"
                description="Explore Turfs and Parks near you. Book slots, play sports, and enjoy outdoor activities."
            />

            {/* ── Page Header ── */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#111827] dark:text-gray-100 mb-1 tracking-tight uppercase">
                        Activities
                    </h1>
                    <p className="text-[#6B7280] dark:text-gray-400 text-[11px] font-medium uppercase tracking-widest">
                        Discover activities near you
                    </p>
                </div>
            </div>

            {/* ── Section Tabs ── */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 sticky top-[64px] md:top-[80px] z-30">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {SECTION_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleSectionChange(tab)}
                            className={`py-4 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                                activeSection === tab
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

            {/* ── Content ── */}
            <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ===== ALL TAB ===== */}
                {activeSection === 'All' && (
                    <div className="space-y-12">
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight">Turfs near you</h2>
                                <button onClick={() => handleSectionChange('Turfs')} className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                                    view all <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {allTurfs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allTurfs.slice(0, 3).map((turf) => <SportCard key={turf.id || turf._id} event={turf} />)}
                                </div>
                            ) : <TurfEmptyState />}
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight">Amusement parks</h2>
                                <button onClick={() => handleSectionChange('Parks')} className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                                    view all <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {/* Utilize local allParks collection to ensure immediate preview rendering */}
                            {allParks && allParks.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allParks.slice(0, 3).map((park) => <ParkCard key={park.id} park={park} />)}
                                </div>
                            ) : <ParksComingSoon compact />}
                        </section>
                    </div>
                )}

                {/* ===== TURFS TAB ===== */}
                {activeSection === 'Turfs' && (
                    <div>
                        {/* Sport filter chips */}
                        <div className="relative flex items-center justify-between gap-6 pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar flex-1">
                                <button
                                    onClick={() => setActiveSportTag('All')}
                                    className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                        activeSportTag === 'All'
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                    }`}
                                >All</button>
                                {mainSportTags.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveSportTag(tag)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                            activeSportTag === tag
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                        }`}
                                    >{formatSportTagLabel(tag)}</button>
                                ))}
                            </div>
                            {dropdownSportTags.length > 0 && (
                                <div className="relative shrink-0" ref={moreFiltersRef}>
                                    <button
                                        onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                                            isMoreFiltersOpen
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                                                : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        More
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isMoreFiltersOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-3 z-[100] animate-in fade-in slide-in-from-top-2">
                                            <div className="px-4 pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">All Categories</div>
                                            <div className="max-h-52 overflow-y-auto px-2">
                                                {dropdownSportTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => { setActiveSportTag(tag); setIsMoreFiltersOpen(false); }}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors mb-1 ${
                                                            activeSportTag === tag
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                        }`}
                                                    >{formatSportTagLabel(tag)}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <h2 className="text-2xl font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight">
                                {activeSportTag === 'All' ? 'All Turfs' : formatSportTagLabel(activeSportTag, true)}
                            </h2>
                            <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">
                                {(() => {
                                    const total = turfsPagination?.total;
                                    const count = (total && total < 9999) ? total : filteredTurfs.length;
                                    return `${count} ${count === 1 ? 'venue' : 'venues'} available`;
                                })()}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[40vh]">
                            {filteredTurfs.length > 0
                                ? filteredTurfs.map((turf) => <SportCard key={turf.id || turf._id} event={turf} />)
                                : turfsLoading 
                                    ? Array.from({ length: 6 }).map((_, i) => <SportCardSkeleton key={i} />)
                                    : <TurfEmptyState onReset={() => { setSearchQuery(''); setActiveSportTag('All'); }} />
                            }
                            
                            {/* Inline loader for seamless layout integration */}
                            {isAppendingTurfs && (
                                <>
                                    <SportCardSkeleton />
                                    <SportCardSkeleton />
                                    <SportCardSkeleton />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== PARKS TAB ===== */}
                {activeSection === 'Parks' && (
                    <div>
                        {/* Park type filter chips */}
                        <div className="relative flex items-center justify-between gap-6 pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar flex-1">
                                <button
                                    onClick={() => setActiveParkType('All')}
                                    className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                        activeParkType === 'All'
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                    }`}
                                >All</button>
                                {mainParkTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveParkType(type)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                            activeParkType === type
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                        }`}
                                    >{type}</button>
                                ))}
                            </div>
                            {dropdownParkTypes.length > 0 && (
                                <div className="relative shrink-0" ref={moreParksFiltersRef}>
                                    <button
                                        onClick={() => setIsMoreParksFiltersOpen(!isMoreParksFiltersOpen)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                                            isMoreParksFiltersOpen
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                                                : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        More
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreParksFiltersOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isMoreParksFiltersOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-3 z-[100] animate-in fade-in slide-in-from-top-2">
                                            <div className="px-4 pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">All Categories</div>
                                            <div className="max-h-52 overflow-y-auto px-2">
                                                {dropdownParkTypes.map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => { setActiveParkType(type); setIsMoreParksFiltersOpen(false); }}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors mb-1 ${
                                                            activeParkType === type
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                        }`}
                                                    >{type}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <h2 className="text-2xl font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight">
                                {activeParkType === 'All' ? 'All nearby parks' : activeParkType}
                            </h2>
                            <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">
                                {(() => {
                                    const total = parksPagination?.total;
                                    const count = (total && total < 9999) ? total : filteredParks.length;
                                    return `${count} ${count === 1 ? 'park' : 'parks'} available`;
                                })()}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[40vh]">
                            {filteredParks.length > 0
                                ? filteredParks.map((park) => <ParkCard key={park.id} park={park} />)
                                : parksLoading 
                                    ? Array.from({ length: 6 }).map((_, i) => <ParkCardSkeleton key={i} />)
                                    : (
                                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                                        <p className="text-lg font-bold mb-2">No parks found</p>
                                        <button
                                            onClick={() => { setSearchQuery(''); setActiveParkType('All'); }}
                                            className="text-xs text-primary font-bold uppercase tracking-wider hover:underline"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                )
                            }

                            {/* Inline loader for seamless layout integration */}
                            {isAppendingParks && (
                                <>
                                    <ParkCardSkeleton />
                                    <ParkCardSkeleton />
                                    <ParkCardSkeleton />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────── Sub-components ───────────────

const TurfEmptyState = ({ onReset }) => (
    <div className="col-span-full py-24 text-center bg-white dark:bg-[#1a1c23] rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Dumbbell className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black tracking-tight dark:text-gray-100">Nothing Found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">Try adjusting your filters.</p>
        {onReset && (
            <button
                onClick={onReset}
                className="mt-8 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black tracking-widest shadow-lg shadow-primary/20"
            >
                Reset Filters
            </button>
        )}
    </div>
);

const ParksComingSoon = ({ compact = false }) => (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30 border border-emerald-200/60 dark:border-emerald-800/30 ${compact ? 'py-16' : 'py-32'} text-center`}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-200/30 dark:bg-emerald-700/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-teal-200/30 dark:bg-teal-700/20 blur-3xl pointer-events-none" />
        <div className="relative z-10">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30">
                <TreePine className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Coming Soon</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-gray-800 dark:text-gray-100 mb-2">Parks & Amusement</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-xs mx-auto">
                Exciting parks and amusement venues will be available here very soon!
            </p>
        </div>
    </div>
);

const SportCardSkeleton = () => (
    <div className="bg-white dark:bg-[#1a1c23] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-full animate-pulse">
        <div className="aspect-[16/10] bg-gray-200/60 dark:bg-gray-800/60" />
        <div className="p-4 sm:p-5 flex flex-col flex-grow">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-3.5 w-16 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
                <div className="h-3.5 w-16 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200/60 dark:bg-gray-800/60 rounded-md mb-3" />
            <div className="flex items-center gap-2 mb-5">
                <div className="w-4 h-4 bg-gray-200/60 dark:bg-gray-800/60 rounded-full shrink-0" />
                <div className="h-4 w-1/2 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
            </div>
            <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex flex-col gap-2">
                    <div className="h-3 w-16 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
                    <div className="h-5 w-20 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
                </div>
                <div className="h-8 w-20 bg-gray-200/60 dark:bg-gray-800/60 rounded-lg" />
            </div>
        </div>
    </div>
);

const ParkCardSkeleton = () => (
    <div className="bg-white dark:bg-[#1a1c23] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-full animate-pulse">
        <div className="aspect-[4/3] bg-gray-200/60 dark:bg-gray-800/60" />
        <div className="p-4 flex flex-col flex-grow">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="h-6 w-3/4 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
                <div className="h-5 w-16 bg-gray-200/60 dark:bg-gray-800/60 rounded-lg" />
            </div>
            <div className="flex items-center gap-1 mb-4">
                <div className="w-3.5 h-3.5 bg-gray-200/60 dark:bg-gray-800/60 rounded-full shrink-0" />
                <div className="h-4 w-1/2 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
            </div>
            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="h-3 w-12 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
                    <div className="h-6 w-20 bg-gray-200/60 dark:bg-gray-800/60 rounded-md" />
                </div>
                <div className="h-8 w-20 bg-gray-200/60 dark:bg-gray-800/60 rounded-lg" />
            </div>
        </div>
    </div>
);

export default ActivitiesPage;
