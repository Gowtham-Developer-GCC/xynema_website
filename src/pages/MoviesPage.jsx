import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Film, ChevronDown, ArrowRight, Sparkles, Building2, Ticket } from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { useData } from '../context/DataContext';
import { getNowShowingMovies, getUpcomingMovies } from '../services/movieService';
import apiCacheManager from '../services/apiCacheManager';
import MovieCard from '../components/MovieCard';
import { PAGE_LIMIT } from '../services/movieService';

const MOVIE_PAGE_LIMIT = PAGE_LIMIT;
const SECTION_TABS = ['Now Showing', 'Upcoming'];

const MoviesPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedCity } = useData();
    
    const sectionFromUrl = searchParams.get('section') || 'Now Showing';
    const [activeSection, setActiveSection] = useState(
        SECTION_TABS.includes(sectionFromUrl) ? sectionFromUrl : 'Now Showing'
    );
    const [error, setError] = useState(null);

    // ── State: Now Showing (Uses City) ────────────────────────────
    const [nowShowingMovies, setNowShowingMovies] = useState(() => {
        const cached = apiCacheManager.get(`movies_now_${selectedCity || 'all'}`);
        return Array.isArray(cached) ? cached : (cached?.movies || []);
    });
    const [nowShowingLoading, setNowShowingLoading] = useState(!nowShowingMovies.length);
    const [isAppendingNowShowing, setIsAppendingNowShowing] = useState(false);
    const [nowShowingPagination, setNowShowingPagination] = useState({ page: 1, total: 0, hasNextPage: false });

    // ── State: Upcoming (Global) ──────────────────────────────────────────
    const [upcomingMoviesData, setUpcomingMoviesData] = useState(() => {
        const cached = apiCacheManager.get(`movies_upcoming_${selectedCity || 'global'}`);
        return Array.isArray(cached) ? cached : (cached?.movies || []);
    });
    const [upcomingLoading, setUpcomingLoading] = useState(!upcomingMoviesData.length);
    const [isAppendingUpcoming, setIsAppendingUpcoming] = useState(false);
    const [upcomingPagination, setUpcomingPagination] = useState({ page: 1, total: 0, hasNextPage: false });

    // ── State: Filters & Derived Data ─────────────────────────────────
    const [filteredNowShowing, setFilteredNowShowing] = useState([]);
    const [filteredUpcoming, setFilteredUpcoming] = useState([]);
    const [movieSearchQuery, setMovieSearchQuery] = useState('');
    const [activeGenre, setActiveGenre] = useState('All');
    const [activeLanguage, setActiveLanguage] = useState('All');
    const [activeFormat, setActiveFormat] = useState('All');
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
    const moreFiltersRef = useRef(null);

    // ── State: Available Filters (Server Driven) ──────────────────────
    const [availableGenres, setAvailableGenres] = useState(() => {
        const prefix = sectionFromUrl === 'Upcoming' ? 'movies_upcoming' : 'movies_now';
        const defaultCity = sectionFromUrl === 'Upcoming' ? 'global' : 'all';
        const cacheKey = `${prefix}_${selectedCity || defaultCity}_gAll_lAll_fAll_p1`;
        const cached = apiCacheManager.get(cacheKey) || apiCacheManager.get(`${prefix}_${selectedCity || defaultCity}`);
        return cached?.availableGenres || (sectionFromUrl === 'Upcoming' ? [] : ['Action', 'Comedy', 'Drama', 'Family', 'Thriller', 'Sci-Fi', 'Romance', 'Adventure']);
    });
    const [availableLanguages, setAvailableLanguages] = useState(() => {
        const prefix = sectionFromUrl === 'Upcoming' ? 'movies_upcoming' : 'movies_now';
        const defaultCity = sectionFromUrl === 'Upcoming' ? 'global' : 'all';
        const cacheKey = `${prefix}_${selectedCity || defaultCity}_gAll_lAll_fAll_p1`;
        const cached = apiCacheManager.get(cacheKey) || apiCacheManager.get(`${prefix}_${selectedCity || defaultCity}`);
        return cached?.availableLanguages || (sectionFromUrl === 'Upcoming' ? [] : ['Malayalam', 'Tamil', 'Hindi', 'English']);
    });
    const [availableFormats, setAvailableFormats] = useState(() => {
        const prefix = sectionFromUrl === 'Upcoming' ? 'movies_upcoming' : 'movies_now';
        const defaultCity = sectionFromUrl === 'Upcoming' ? 'global' : 'all';
        const cacheKey = `${prefix}_${selectedCity || defaultCity}_gAll_lAll_fAll_p1`;
        const cached = apiCacheManager.get(cacheKey) || apiCacheManager.get(`${prefix}_${selectedCity || defaultCity}`);
        return cached?.availableFormats || [];
    });

    // ── Refs: Now Showing Scroll ────────────────────────────────────────────
    const prefetchedNowShowing = useRef(null);
    const isFetchingNowShowing = useRef(false);
    const isPrefetchingNowShowing = useRef(false);
    const nowShowingScrollTimerRef = useRef(null);
    const didNowShowingInitCheck = useRef(false);
    const nowShowingAppendRef = useRef(null);

    // ── Refs: Upcoming Scroll ───────────────────────────────────────────
    const prefetchedUpcoming = useRef(null);
    const isFetchingUpcoming = useRef(false);
    const isPrefetchingUpcoming = useRef(false);
    const upcomingScrollTimerRef = useRef(null);
    const didUpcomingInitCheck = useRef(false);
    const upcomingAppendRef = useRef(null);

    // Sync section with URL parameter changes (from tab clicks, manual URL changes, or footer Links)
    useEffect(() => {
        const targetSection = SECTION_TABS.includes(sectionFromUrl) ? sectionFromUrl : 'Now Showing';
        
        setActiveSection(targetSection);
        setIsMoreFiltersOpen(false);
        
        // Clear active queries to prevent invalid cross-tab states
        setActiveGenre('All');
        setActiveLanguage('All');
        setActiveFormat('All');

        // Swap context filter items instantly using existing cache to present accurate options
        const prefix = targetSection === 'Upcoming' ? 'movies_upcoming' : 'movies_now';
        const defaultCity = targetSection === 'Upcoming' ? 'global' : 'all';
        const cacheKey = `${prefix}_${selectedCity || defaultCity}_gAll_lAll_fAll_p1`;
        const cached = apiCacheManager.get(cacheKey) || apiCacheManager.get(`${prefix}_${selectedCity || defaultCity}`);

        if (cached) {
            setAvailableGenres(cached.availableGenres || []);
            setAvailableLanguages(cached.availableLanguages || []);
            setAvailableFormats(cached.availableFormats || []);
        } else {
            // Clean fallbacks while we await new network stream
            setAvailableGenres(targetSection === 'Upcoming' ? [] : ['Action', 'Comedy', 'Drama', 'Family', 'Thriller', 'Sci-Fi', 'Romance', 'Adventure']);
            setAvailableLanguages(targetSection === 'Upcoming' ? [] : ['Malayalam', 'Tamil', 'Hindi', 'English']);
            setAvailableFormats([]);
        }
    }, [sectionFromUrl, selectedCity]);

    const handleSectionChange = (section) => {
        setSearchParams({ section });
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreFiltersRef.current && !moreFiltersRef.current.contains(event.target)) setIsMoreFiltersOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // NOW SHOWING — prefetch + fetch + load more
    // ─────────────────────────────────────────────────────────────────
    const prefetchNextNowShowing = useCallback(async (nextPage) => {
        if (prefetchedNowShowing.current?.page === nextPage) return;
        if (isPrefetchingNowShowing.current) return;
        isPrefetchingNowShowing.current = true;
        const cacheKey = `movies_now_${selectedCity || 'all'}_g${activeGenre}_l${activeLanguage}_f${activeFormat}_p${nextPage}`;
        try {
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getNowShowingMovies(selectedCity, nextPage, MOVIE_PAGE_LIMIT, { genre: activeGenre, language: activeLanguage, format: activeFormat }),
                1800, false
            );
            const dataList = response?.movies || [];
            if (dataList.length > 0) prefetchedNowShowing.current = { page: nextPage, data: response };
        } catch (e) {
            console.warn('[NowShowingPrefetch] Silent fail page', nextPage, e?.message);
        } finally {
            isPrefetchingNowShowing.current = false;
        }
    }, [selectedCity, activeGenre, activeLanguage, activeFormat]);

    const fetchNowShowing = useCallback(async (page = 1, append = false, force = false) => {
        if (isFetchingNowShowing.current && page !== 1) return;
        isFetchingNowShowing.current = true;
        try {
            if (page === 1 && !append) setNowShowingLoading(true);
            if (append) setIsAppendingNowShowing(true);

            const cacheKey = `movies_now_${selectedCity || 'all'}_g${activeGenre}_l${activeLanguage}_f${activeFormat}_p${page}`;
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getNowShowingMovies(selectedCity, page, MOVIE_PAGE_LIMIT, { genre: activeGenre, language: activeLanguage, format: activeFormat }),
                1800, force
            );

            const dataList = response?.movies || [];
            const newPagination = response?.pagination || { page, total: dataList.length, hasNextPage: dataList.length >= MOVIE_PAGE_LIMIT };

            // Set filters from server metadata
            if (response?.availableGenres && response.availableGenres.length > 0) {
                setAvailableGenres(response.availableGenres);
            }
            if (response?.availableLanguages && response.availableLanguages.length > 0) {
                setAvailableLanguages(response.availableLanguages);
            }
            if (response?.availableFormats && response.availableFormats.length > 0) {
                setAvailableFormats(response.availableFormats);
            }

            if (append) setNowShowingMovies(prev => [...prev, ...dataList]);
            else { setNowShowingMovies(dataList); prefetchedNowShowing.current = null; }
            
            setNowShowingPagination(newPagination);
            if (newPagination.hasNextPage) prefetchNextNowShowing(page + 1);
        } catch (err) {
            console.error('Error fetching now showing movies:', err);
            if (!append) setError('Failed to load movies. Please try again.');
        } finally {
            setNowShowingLoading(false);
            setIsAppendingNowShowing(false);
            isFetchingNowShowing.current = false;
        }
    }, [selectedCity, activeGenre, activeLanguage, activeFormat, prefetchNextNowShowing]);

    const handleLoadMoreNowShowing = useCallback(() => {
        if (nowShowingLoading || isFetchingNowShowing.current) return;
        if (!nowShowingPagination?.hasNextPage) return;
        const nextPage = (nowShowingPagination.currentPage || nowShowingPagination.page || 1) + 1;

        if (prefetchedNowShowing.current?.page === nextPage) {
            setIsAppendingNowShowing(true);
            setTimeout(() => {
                const { data } = prefetchedNowShowing.current;
                prefetchedNowShowing.current = null;
                
                const dataList = data?.movies || [];
                setNowShowingMovies(prev => [...prev, ...dataList]);
                setNowShowingPagination(data.pagination || { page: nextPage, hasNextPage: false });
                
                setIsAppendingNowShowing(false);
                if (data.pagination?.hasNextPage) prefetchNextNowShowing(nextPage + 1);
            }, 400);
        } else {
            fetchNowShowing(nextPage, true);
        }
    }, [nowShowingLoading, nowShowingPagination, fetchNowShowing, prefetchNextNowShowing]);

    useEffect(() => { nowShowingAppendRef.current = handleLoadMoreNowShowing; }, [handleLoadMoreNowShowing]);

    useEffect(() => {
        if (activeSection !== 'Now Showing') return;
        prefetchedNowShowing.current = null;
        isPrefetchingNowShowing.current = false;
        isFetchingNowShowing.current = false;
        didNowShowingInitCheck.current = false;
        fetchNowShowing(1, false);
    }, [fetchNowShowing, activeSection]);

    // Now Showing Scroll Trigger
    useEffect(() => {
        if (activeSection !== 'Now Showing') return;
        const isFiltering = movieSearchQuery.trim().length > 0;
        if (isFiltering) return;
        if (!nowShowingPagination?.hasNextPage) return;

        const checkAndLoadNowShowing = () => {
            if (nowShowingLoading || isFetchingNowShowing.current || isPrefetchingNowShowing.current) return;
            if (!nowShowingPagination?.hasNextPage) return;
            
            const currentPos = window.scrollY + window.innerHeight;
            const scrollBuffer = Math.max(window.innerHeight * 2.5, 1000);
            const threshold = document.documentElement.scrollHeight - scrollBuffer;
            
            if (currentPos >= threshold) nowShowingAppendRef.current?.();
        };

        const onScroll = () => {
            if (nowShowingScrollTimerRef.current) clearTimeout(nowShowingScrollTimerRef.current);
            nowShowingScrollTimerRef.current = setTimeout(checkAndLoadNowShowing, 150);
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        if (!didNowShowingInitCheck.current) {
            didNowShowingInitCheck.current = true;
            const initTimer = setTimeout(checkAndLoadNowShowing, 500);
            return () => {
                clearTimeout(initTimer);
                clearTimeout(nowShowingScrollTimerRef.current);
                window.removeEventListener('scroll', onScroll);
            };
        }

        return () => {
            clearTimeout(nowShowingScrollTimerRef.current);
            window.removeEventListener('scroll', onScroll);
        };
    }, [activeSection, nowShowingPagination, movieSearchQuery, activeGenre, nowShowingLoading]);

    // ─────────────────────────────────────────────────────────────────
    // UPCOMING — prefetch + fetch + load more (Global)
    // ─────────────────────────────────────────────────────────────────
    const prefetchNextUpcoming = useCallback(async (nextPage) => {
        if (prefetchedUpcoming.current?.page === nextPage) return;
        if (isPrefetchingUpcoming.current) return;
        isPrefetchingUpcoming.current = true;
        const cacheKey = `movies_upcoming_${selectedCity || 'global'}_g${activeGenre}_l${activeLanguage}_f${activeFormat}_p${nextPage}`;
        try {
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getUpcomingMovies(selectedCity, nextPage, MOVIE_PAGE_LIMIT, { genre: activeGenre, language: activeLanguage, format: activeFormat }),
                1800, false
            );
            const dataList = response?.movies || [];
            if (dataList.length > 0) prefetchedUpcoming.current = { page: nextPage, data: response };
        } catch (e) {
            console.warn('[UpcomingPrefetch] Silent fail page', nextPage, e?.message);
        } finally {
            isPrefetchingUpcoming.current = false;
        }
    }, [selectedCity, activeGenre, activeLanguage, activeFormat]);

    const fetchUpcoming = useCallback(async (page = 1, append = false, force = false) => {
        if (isFetchingUpcoming.current && page !== 1) return;
        isFetchingUpcoming.current = true;
        try {
            if (page === 1 && !append) setUpcomingLoading(true);
            if (append) setIsAppendingUpcoming(true);

            const cacheKey = `movies_upcoming_${selectedCity || 'global'}_g${activeGenre}_l${activeLanguage}_f${activeFormat}_p${page}`;
            const response = await apiCacheManager.getOrExecute(
                cacheKey,
                () => getUpcomingMovies(selectedCity, page, MOVIE_PAGE_LIMIT, { genre: activeGenre, language: activeLanguage, format: activeFormat }),
                1800, force
            );

            const dataList = response?.movies || [];
            const newPagination = response?.pagination || { page, total: dataList.length, hasNextPage: dataList.length >= MOVIE_PAGE_LIMIT };

            // Set filters from server metadata
            if (response?.availableGenres && response.availableGenres.length > 0) {
                setAvailableGenres(response.availableGenres);
            }
            if (response?.availableLanguages && response.availableLanguages.length > 0) {
                setAvailableLanguages(response.availableLanguages);
            }
            if (response?.availableFormats && response.availableFormats.length > 0) {
                setAvailableFormats(response.availableFormats);
            }

            if (append) setUpcomingMoviesData(prev => [...prev, ...dataList]);
            else { setUpcomingMoviesData(dataList); prefetchedUpcoming.current = null; }
            
            setUpcomingPagination(newPagination);
            if (newPagination.hasNextPage) prefetchNextUpcoming(page + 1);
        } catch (err) {
            console.error('Error fetching upcoming movies:', err);
        } finally {
            setUpcomingLoading(false);
            setIsAppendingUpcoming(false);
            isFetchingUpcoming.current = false;
        }
    }, [selectedCity, activeGenre, activeLanguage, activeFormat, prefetchNextUpcoming]);

    const handleLoadMoreUpcoming = useCallback(() => {
        if (upcomingLoading || isFetchingUpcoming.current) return;
        if (!upcomingPagination?.hasNextPage) return;
        const nextPage = (upcomingPagination.currentPage || upcomingPagination.page || 1) + 1;

        if (prefetchedUpcoming.current?.page === nextPage) {
            setIsAppendingUpcoming(true);
            setTimeout(() => {
                const { data } = prefetchedUpcoming.current;
                prefetchedUpcoming.current = null;
                
                const dataList = data?.movies || [];
                setUpcomingMoviesData(prev => [...prev, ...dataList]);
                setUpcomingPagination(data.pagination || { page: nextPage, hasNextPage: false });
                
                setIsAppendingUpcoming(false);
                if (data.pagination?.hasNextPage) prefetchNextUpcoming(nextPage + 1);
            }, 400);
        } else {
            fetchUpcoming(nextPage, true);
        }
    }, [upcomingLoading, upcomingPagination, fetchUpcoming, prefetchNextUpcoming]);

    useEffect(() => { upcomingAppendRef.current = handleLoadMoreUpcoming; }, [handleLoadMoreUpcoming]);

    useEffect(() => {
        if (activeSection !== 'Upcoming') return;
        prefetchedUpcoming.current = null;
        isPrefetchingUpcoming.current = false;
        isFetchingUpcoming.current = false;
        didUpcomingInitCheck.current = false;
        fetchUpcoming(1, false);
    }, [fetchUpcoming, activeSection]);

    // Upcoming Scroll Trigger
    useEffect(() => {
        if (activeSection !== 'Upcoming') return;
        const isFiltering = movieSearchQuery.trim().length > 0;
        if (isFiltering) return;
        if (!upcomingPagination?.hasNextPage) return;

        const checkAndLoadUpcoming = () => {
            if (upcomingLoading || isFetchingUpcoming.current || isPrefetchingUpcoming.current) return;
            if (!upcomingPagination?.hasNextPage) return;
            
            const currentPos = window.scrollY + window.innerHeight;
            const scrollBuffer = Math.max(window.innerHeight * 1.5, 1000);
            const threshold = document.documentElement.scrollHeight - scrollBuffer;
            
            if (currentPos >= threshold) upcomingAppendRef.current?.();
        };

        const onScroll = () => {
            if (upcomingScrollTimerRef.current) clearTimeout(upcomingScrollTimerRef.current);
            upcomingScrollTimerRef.current = setTimeout(checkAndLoadUpcoming, 150);
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        if (!didUpcomingInitCheck.current) {
            didUpcomingInitCheck.current = true;
            const initTimer = setTimeout(checkAndLoadUpcoming, 500);
            return () => {
                clearTimeout(initTimer);
                clearTimeout(upcomingScrollTimerRef.current);
                window.removeEventListener('scroll', onScroll);
            };
        }

        return () => {
            clearTimeout(upcomingScrollTimerRef.current);
            window.removeEventListener('scroll', onScroll);
        };
    }, [activeSection, upcomingPagination, movieSearchQuery, activeGenre, upcomingLoading]);




    useEffect(() => {
        const filterData = (data) => {
            let filtered = data;
            if (movieSearchQuery.trim()) {
                filtered = filtered.filter(m =>
                    (m.title || "").toLowerCase().includes(movieSearchQuery.toLowerCase())
                );
            }
            // Note: backend handles activeGenre filtering automatically now
            return filtered;
        };

        setFilteredNowShowing(filterData(nowShowingMovies));
        setFilteredUpcoming(filterData(upcomingMoviesData));
    }, [nowShowingMovies, upcomingMoviesData, movieSearchQuery, activeGenre]);

    const resetFilters = () => {
        setActiveGenre('All');
        setActiveLanguage('All');
        setActiveFormat('All');
        setMovieSearchQuery('');
    };

    const handleRetry = () => {
        setError(null);
        fetchNowShowing(1, false, true);
        fetchUpcoming(1, false, true);
    };

    // Dynamic load gatekeeper: evaluate conditions matching the currently visible section
    const isInitialMoviesLoading = 
        (activeSection === 'Now Showing' && nowShowingLoading && nowShowingMovies.length === 0) ||
        (activeSection === 'Upcoming' && upcomingLoading && upcomingMoviesData.length === 0);

    if (isInitialMoviesLoading) return <LoadingScreen message="Loading Movies" />;
    if (error) return <ErrorState error={error} onRetry={handleRetry} title="Connection Issue" buttonText="Try Refreshing" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO title="Movies - XYNEMA" description="Discover movies playing near you and upcoming releases." />

            {/* Header */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#111827] dark:text-gray-100 mb-2 tracking-tight">
                        Movies
                    </h1>
                    <p className="text-[#6B7280] dark:text-gray-400 text-sm md:text-base font-sans">
                        Discover blockbuster hits and exclusive releases.
                    </p>
                </div>
            </div>

            {/* Section Tab Switcher */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors duration-300">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto no-scrollbar">
                    {/* Tabs Left */}
                    <div className="flex items-center gap-8">
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

                    {/* Cinemas Button Right */}
                    <Link
                        to="/cinemas"
                        className="shrink-0 inline-flex items-center gap-1.5 py-3 px-4 rounded-full text-[12px] font-black uppercase tracking-widest whitespace-nowrap transition-all bg-primary text-white shadow-md shadow-primary/20 hover:brightness-110 active:scale-95"
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        Cinemas
                    </Link>
                </div>
            </div>

            <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                
                {/* Filters Row */}
                <div className="relative flex flex-wrap items-center gap-4 pb-4 mb-8 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-1 py-1">
                        <button
                            onClick={() => { setActiveGenre('All'); setIsMoreFiltersOpen(false); }}
                            className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                activeGenre === 'All'
                                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800'
                                }`}
                        >
                            All
                        </button>
                        {availableGenres.slice(0, 4).map((genre) => (
                            <button
                                key={genre}
                                onClick={() => { setActiveGenre(genre); setIsMoreFiltersOpen(false); }}
                                className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                    activeGenre === genre
                                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800'
                                    }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>


                    <div className="relative shrink-0" ref={moreFiltersRef}>
                        <button
                            onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                            className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                                isMoreFiltersOpen
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                                    : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-800'
                                } ${
                                    (activeLanguage !== 'All' || activeFormat !== 'All' || (!availableGenres.slice(0, 4).includes(activeGenre) && activeGenre !== 'All'))
                                        ? 'ring-2 ring-primary/30 border-primary text-primary font-black shadow-sm'
                                        : ''
                                }`}
                        >
                            More Filters
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isMoreFiltersOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-5 z-[100] animate-in fade-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto no-scrollbar">
                                
                                {/* Section: Languages */}
                                {availableLanguages.length > 0 && (
                                    <div className="mb-5">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                            Languages
                                            {activeLanguage !== 'All' && (
                                                <button onClick={() => setActiveLanguage('All')} className="text-primary text-[9px] font-black tracking-widest uppercase hover:underline">Clear</button>
                                            )}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {availableLanguages.map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => setActiveLanguage(activeLanguage === lang ? 'All' : lang)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                        activeLanguage === lang
                                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                                    }`}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Section: Formats */}
                                {availableFormats.length > 0 && (
                                    <div className="mb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                            Formats
                                            {activeFormat !== 'All' && (
                                                <button onClick={() => setActiveFormat('All')} className="text-primary text-[9px] font-black tracking-widest uppercase hover:underline">Clear</button>
                                            )}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {availableFormats.map(fmt => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setActiveFormat(activeFormat === fmt ? 'All' : fmt)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                        activeFormat === fmt
                                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                                    }`}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Section: Genres */}
                                {availableGenres.length > 0 && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                            Genres
                                            {(!availableGenres.slice(0, 4).includes(activeGenre) && activeGenre !== 'All') && (
                                                <button onClick={() => setActiveGenre('All')} className="text-primary text-[9px] font-black tracking-widest uppercase hover:underline">Clear</button>
                                            )}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {availableGenres.map(genre => (
                                                <button
                                                    key={genre}
                                                    onClick={() => setActiveGenre(activeGenre === genre ? 'All' : genre)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                        activeGenre === genre
                                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                                    }`}
                                                >
                                                    {genre}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== NOW SHOWING TAB ===== */}
                {activeSection === 'Now Showing' && (
                    <div>
                        <div className="mb-8">
                            <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight flex items-center gap-2">
                                {selectedCity && selectedCity !== 'All' ? `Playing in ${selectedCity}` : 'Movies Now Showing'}
                            </h2>
                            <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-1">Book your tickets now</p>
                        </div>

                        {filteredNowShowing.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 min-h-[40vh]">
                                {filteredNowShowing.map((movie, idx) => (
                                    <MovieCard key={movie.id || movie._id} movie={{ ...movie, delayClass: `delay-${(idx % 5) * 100}` }} />
                                ))}
                                
                                {/* Scroll Skeletons */}
                                {isAppendingNowShowing && (
                                    <>
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                    </>
                                )}
                            </div>
                        ) : nowShowingLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                {Array.from({ length: 10 }).map((_, i) => <MovieCardSkeleton key={i} />)}
                            </div>
                        ) : <EmptyState onReset={resetFilters} />}
                    </div>
                )}

                {/* ===== UPCOMING TAB ===== */}
                {activeSection === 'Upcoming' && (
                    <div>
                        <div className="mb-8">
                            <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight flex items-center gap-2">
                                Upcoming Releases
                            </h2>
                            <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-1">Global upcoming blockbusters</p>
                        </div>

                        {filteredUpcoming.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 min-h-[40vh]">
                                {filteredUpcoming.map((movie, idx) => (
                                    <MovieCard key={movie.id || movie._id} movie={{ ...movie, delayClass: `delay-${(idx % 5) * 100}` }} />
                                ))}

                                {/* Scroll Skeletons */}
                                {isAppendingUpcoming && (
                                    <>
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                        <MovieCardSkeleton />
                                    </>
                                )}
                            </div>
                        ) : upcomingLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                {Array.from({ length: 10 }).map((_, i) => <MovieCardSkeleton key={i} />)}
                            </div>
                        ) : <EmptyState onReset={resetFilters} />}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============= COMPONENTS =============

const MovieCardSkeleton = () => (
    <div className="flex flex-col h-full animate-pulse">
        {/* Movie Poster Placeholder - Portrait Aspect Ratio */}
        <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-2xl mb-3 shadow-sm" />
        {/* Content Details */}
        <div className="flex flex-col gap-2 mt-1">
            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-md" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-md" />
        </div>
    </div>
);

const EmptyState = ({ onReset }) => (
    <div className="col-span-full py-24 text-center bg-white dark:bg-[#1a1c23] rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-500 transition-colors">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-600">
            <Film className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black tracking-tight dark:text-gray-100">Nothing Found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">Try adjusting your search or filters to see more.</p>
        <button onClick={onReset} className="mt-8 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 font-roboto">
            Reset Filters
        </button>
    </div>
);

export default MoviesPage;
