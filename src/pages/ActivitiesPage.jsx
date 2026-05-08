import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
    Search, Star, MapPin, ChevronDown, TreePine, Dumbbell, ArrowRight, Sparkles
} from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { useData } from '../context/DataContext';
import SportCard from '../components/SportCard';
import ParkCard from '../components/ParkCard';
import { getVisitedParks, getAllParks } from '../services/parkService';

// ─────────────── Main Tabs ───────────────
const SECTION_TABS = ['All', 'Turfs', 'Parks'];

// Sport filter tags shown inside Turfs tab
const SPORT_TAGS = ['Cricket', 'Football', 'Tennis', 'Swimming', 'Badminton'];

const ActivitiesPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Use context data but manage errors locally to be more resilient
    const { selectedCity, turfs, loading: dataLoading, refreshData: refreshGlobalData } = useData();

    // Read active section from URL param (default: All)
    const sectionFromUrl = searchParams.get('section') || 'All';
    const [activeSection, setActiveSection] = useState(
        SECTION_TABS.includes(sectionFromUrl) ? sectionFromUrl : 'All'
    );

    const [visitedParks, setVisitedParks] = useState([]);
    const [allParks, setAllParks] = useState([]);
    const [error, setError] = useState(null);
    const [parksLoading, setParksLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSportTag, setActiveSportTag] = useState('All');
    const [activeParkType, setActiveParkType] = useState('All');
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
    const [isMoreParksFiltersOpen, setIsMoreParksFiltersOpen] = useState(false);
    const moreFiltersRef = useRef(null);
    const moreParksFiltersRef = useRef(null);

    const fetchParks = useCallback(async () => {
        try {
            setParksLoading(true);
            setError(null);
            const params = {
                city: selectedCity,
                search: searchQuery,
                page: 1,
                limit: 20
            };
            const [visited, all] = await Promise.all([
                getVisitedParks(),
                getAllParks(params)
            ]);
            setVisitedParks(visited);
            setAllParks(all);
        } catch (err) {
            console.error("Error fetching parks:", err);
            if (allParks.length === 0) {
                setError("Failed to load activity parks. Please try again.");
            }
        } finally {
            setParksLoading(false);
        }
    }, [selectedCity, searchQuery]);

    useEffect(() => {
        fetchParks();
    }, [fetchParks]);

    const handleRetry = () => {
        setError(null);
        refreshGlobalData(1);
        fetchParks();
    };

    // Dynamic tags from turf data
    const availableSportTags = useMemo(() => {
        const dynamicTags = Array.from(new Set(turfs.flatMap(t => t.tags || []))).filter(Boolean);
        return Array.from(new Set([...SPORT_TAGS, ...dynamicTags])).sort();
    }, [turfs]);

    // Filter turfs
    const filteredTurfs = useMemo(() => {
        let list = turfs;
        if (searchQuery.trim()) {
            list = list.filter(e =>
                (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.venue || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (activeSportTag !== 'All') {
            list = list.filter(e => (e.tags || []).includes(activeSportTag));
        }
        return list;
    }, [turfs, searchQuery, activeSportTag]);

    // Dynamic sport tag slices
    const mainSportTags = useMemo(() => {
        return availableSportTags.slice(0, 4);
    }, [availableSportTags]);

    const dropdownSportTags = useMemo(() => {
        return availableSportTags.slice(4);
    }, [availableSportTags]);

    // Dynamic types from park data
    const parkTypesOnly = useMemo(() => {
        return Array.from(new Set(allParks.map(p => p.type))).filter(Boolean).sort();
    }, [allParks]);

    const mainParkTypes = useMemo(() => {
        return parkTypesOnly.slice(0, 4);
    }, [parkTypesOnly]);

    const dropdownParkTypes = useMemo(() => {
        return parkTypesOnly.slice(4);
    }, [parkTypesOnly]);

    // Filter parks
    const filteredParks = useMemo(() => {
        let list = allParks;
        if (searchQuery.trim()) {
            list = list.filter(p =>
                (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (activeParkType !== 'All') {
            list = list.filter(p => p.type === activeParkType);
        }
        return list;
    }, [allParks, searchQuery, activeParkType]);

    // Handle section change — update URL param
    const handleSectionChange = (section) => {
        setActiveSection(section);
        setSearchParams({ section });
        // Reset filters when switching tabs
        setSearchQuery('');
        setActiveSportTag('All');
        setActiveParkType('All');
    };

    // Close More Filters on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target)) {
                setIsMoreFiltersOpen(false);
            }
            if (moreParksFiltersRef.current && !moreParksFiltersRef.current.contains(e.target)) {
                setIsMoreParksFiltersOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (dataLoading && turfs.length === 0) return <LoadingScreen message="Finding activities near you" />;
    if (error) return <ErrorState error={error} onRetry={handleRetry} title="Connection Issue" />;

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

            {/* ── Section Tabs: All | Turfs | Parks ── */}
            <div className="bg-[#F5F5FA] dark:bg-[#0f1115] border-b border-gray-200 dark:border-gray-800 sticky top-[64px] md:top-[80px] z-30">
                <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {SECTION_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleSectionChange(tab)}
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

            {/* ── Content Area ── */}
            <div className="w-[95%] sm:w-[92%] lg:w-[90%] xl:w-[85%] 2xl:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ===== ALL TAB ===== */}
                {(activeSection === 'All') && (
                    <div className="space-y-12">

                        {/* ── Turfs Near You ── */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight">
                                    Turfs near you
                                </h2>
                                <button
                                    onClick={() => handleSectionChange('Turfs')}
                                    className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    view all <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {turfs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {turfs.slice(0, 3).map((turf) => (
                                        <SportCard key={turf.id || turf._id} event={turf} />
                                    ))}
                                </div>
                            ) : (
                                <TurfEmptyState />
                            )}
                        </section>

                        {/* ── Parks / Amusement Parks ── */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-semibold text-[#111827] dark:text-gray-100 tracking-tight">
                                    Amusement parks
                                </h2>
                                <button
                                    onClick={() => handleSectionChange('Parks')}
                                    className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    view all <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {allParks.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allParks.slice(0, 3).map((park) => (
                                        <ParkCard key={park.id} park={park} />
                                    ))}
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
                            {/* Scrollable Chips */}
                            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar flex-1">
                                <button
                                    onClick={() => setActiveSportTag('All')}
                                    className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeSportTag === 'All'
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    All
                                </button>
                                {mainSportTags.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveSportTag(tag)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeSportTag === tag
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* More filters */}
                            {dropdownSportTags.length > 0 && (
                                <div className="relative shrink-0" ref={moreFiltersRef}>
                                    <button
                                        onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-all border ${isMoreFiltersOpen
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
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors mb-1 ${activeSportTag === tag
                                                                ? 'bg-primary/10 text-primary'
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

                        {/* Search */}
                        <div className="relative mb-8 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search turfs..."
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                            />
                        </div>

                        <div className="mb-4">
                            <h2 className="text-2xl font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight">
                                {activeSportTag === 'All' ? 'All Turfs' : activeSportTag}
                            </h2>
                            <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">
                                {filteredTurfs.length} {filteredTurfs.length === 1 ? 'venue' : 'venues'} available
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[40vh]">
                            {filteredTurfs.length > 0 ? (
                                filteredTurfs.map((turf) => (
                                    <SportCard key={turf.id || turf._id} event={turf} />
                                ))
                            ) : (
                                <TurfEmptyState onReset={() => { setSearchQuery(''); setActiveSportTag('All'); }} />
                            )}
                        </div>
                    </div>
                )}

                {/* ===== PARKS TAB ===== */}
                {activeSection === 'Parks' && (
                    <div>
                        {/* Park Type filter chips */}
                        <div className="relative flex items-center justify-between gap-6 pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
                            {/* Scrollable Chips */}
                            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar flex-1">
                                <button
                                    onClick={() => setActiveParkType('All')}
                                    className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeParkType === 'All'
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    All
                                </button>
                                {mainParkTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveParkType(type)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeParkType === type
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* More filters */}
                            {dropdownParkTypes.length > 0 && (
                                <div className="relative shrink-0" ref={moreParksFiltersRef}>
                                    <button
                                        onClick={() => setIsMoreParksFiltersOpen(!isMoreParksFiltersOpen)}
                                        className={`py-2 px-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap transition-all border ${isMoreParksFiltersOpen
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
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-colors mb-1 ${activeParkType === type
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative mb-8 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search parks..."
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                            />
                        </div>

                        <div className="mb-4">
                            <h2 className="text-2xl font-display font-medium text-[#111827] dark:text-gray-100 tracking-tight">
                                {activeParkType === 'All' ? 'All near by parks' : activeParkType}
                            </h2>
                            <p className="text-[#6B7280] dark:text-gray-400 text-sm mt-1">
                                {filteredParks.length} {filteredParks.length === 1 ? 'park' : 'parks'} available
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[40vh]">
                            {filteredParks.length > 0 ? (
                                filteredParks.map((park) => (
                                    <ParkCard key={park.id} park={park} />
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                                    <p className="text-lg font-bold mb-2">No parks found</p>
                                    <button
                                        onClick={() => { setSearchQuery(''); setActiveParkType('All'); }}
                                        className="text-xs text-primary font-bold uppercase tracking-wider hover:underline"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
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
    <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30 border border-emerald-200/60 dark:border-emerald-800/30 ${compact ? 'py-16' : 'py-32'
            } text-center`}
    >
        {/* Decorative blobs */}
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
            <h3 className="text-2xl font-black tracking-tight text-gray-800 dark:text-gray-100 mb-2">
                Parks & Amusement
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-xs mx-auto">
                Exciting parks and amusement venues will be available here very soon!
            </p>
        </div>
    </div>
);

export default ActivitiesPage;
