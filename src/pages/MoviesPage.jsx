import { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Search, ChevronDown, ChevronRight, X, Building2, Ticket } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import MovieCard from '../components/MovieCard';

// ─── Dropdown Filter Component ──────────────────────────────────────────────
const DropdownFilter = ({ label, items, selected, onToggle, onClear, align = 'left' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const activeCount = selected.length;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-bold transition-all select-none font-roboto w-full ${activeCount > 0
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/20'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1d24] hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
            >
                <span className="truncate">{activeCount > 0 ? `${label} (${activeCount})` : label}</span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className={`absolute top-full mt-2 z-30 bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl p-3 w-56 max-h-64 overflow-y-auto transition-colors duration-300 ${align === 'right' ? 'right-0' : 'left-0'}`}>
                    {activeCount > 0 && (
                        <button
                            onClick={() => { onClear(); }}
                            className="w-full text-left text-xs text-red-500 hover:text-red-700 font-medium mb-2 px-1"
                        >
                            Clear selection
                        </button>
                    )}
                    <div className="flex flex-col gap-1">
                        {items.map(item => (
                            <button
                                key={item}
                                onClick={() => onToggle(item)}
                                className={`text-left px-3 py-1.5 rounded-lg text-sm font-bold transition-colors font-roboto ${selected.includes(item)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main MoviesPage ─────────────────────────────────────────────────────────
const MoviesPage = ({ selectedCity }) => {
    const {
        movies,
        latestMovies,
        upcomingMovies,
        loading,
        error,
        refreshData,
        pagination,
        nextPage,
        prevPage,
        goToPage,
    } = useData();

    const location = useLocation();
    
    // Tab state: 'now-showing' | 'upcoming' | 're-releases'
    const [activeTab, setActiveTab] = useState('now-showing');

    // Sync tab from query parameter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['now-showing', 'upcoming', 're-releases'].includes(tab)) {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.search]);

    // Filter States
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedFormats, setSelectedFormats] = useState([]);

    // Source list based on active tab
    const sourceMovies = useMemo(() => {
        if (activeTab === 'upcoming') return upcomingMovies || [];
        // 're-releases' could be a filtered sub-set — for now use same list
        if (activeTab === 're-releases') return (movies || []).filter(m => m.genre?.toLowerCase?.()?.includes('classic') || m.isReleased);
        return movies || [];
    }, [activeTab, movies, upcomingMovies]);

    // Derived filter options from source
    const { languages, genres, formats } = useMemo(() => {
        const langs = new Set(), gens = new Set(), fmts = new Set();
        sourceMovies.forEach(m => {
            if (m.language) m.language.split(',').map(s => s.trim()).forEach(l => l && langs.add(l));
            const gList = Array.isArray(m.genre) ? m.genre : (m.genre || '').split(',').map(s => s.trim());
            gList.forEach(g => g && gens.add(g));
            if (Array.isArray(m.format)) m.format.forEach(f => fmts.add(f));
        });
        return { languages: [...langs].sort(), genres: [...gens].sort(), formats: [...fmts].sort() };
    }, [sourceMovies]);

    // Filtering Logic
    const filteredMovies = useMemo(() => {
        return sourceMovies.filter(m => {
            if (selectedLanguages.length > 0) {
                const ml = (m.language || '').split(',').map(s => s.trim());
                if (!ml.some(l => selectedLanguages.includes(l))) return false;
            }
            if (selectedGenres.length > 0) {
                const mg = Array.isArray(m.genre) ? m.genre : (m.genre || '').split(',').map(s => s.trim());
                if (!mg.some(g => selectedGenres.includes(g))) return false;
            }
            if (selectedFormats.length > 0) {
                const mf = Array.isArray(m.format) ? m.format : [];
                if (mf.length > 0 && !mf.some(f => selectedFormats.includes(f))) return false;
            }
            return true;
        });
    }, [sourceMovies, selectedLanguages, selectedGenres, selectedFormats]);

    const toggleFilter = (set, item) => set(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

    const clearAllFilters = () => {
        setSelectedLanguages([]);
        setSelectedGenres([]);
        setSelectedFormats([]);
    };

    const hasActiveFilters = selectedLanguages.length > 0 || selectedGenres.length > 0 || selectedFormats.length > 0;

    const TABS = [
        { id: 'now-showing', label: 'Now Showing' },
        { id: 'upcoming', label: 'Upcoming' },
        
    ];

    if (loading && !movies?.length) return <LoadingScreen message="Loading Movies..." />;
    if (error && !movies?.length) return <ErrorState error={error} onRetry={refreshData} title="Something went wrong" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] font-sans transition-colors duration-300">
            <SEO
                title={`Movies in ${selectedCity} - XYNEMA`}
                description={`Browse movies in ${selectedCity}. Filter by language, genre, and format.`}
            />

            {/* ── Hero Header ───────────────────────────────── */}
            <div className="bg-white dark:bg-[#0f1115] border-b border-gray-100 dark:border-gray-800">
                <div className="w-[90%] sm:w-[80%] mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-roboto">Movies</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-sans">Discover and book tickets for the latest blockbusters</p>
                </div>
            </div>

            {/* ── Tabs + Filters Bar ────────────────────────── */}
            <div className="bg-white dark:bg-[#0f1115]/90 dark:backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 sticky top-16 md:top-20 z-40 shadow-sm transition-all duration-300">
                <div className="w-[95%] sm:w-[80%] mx-auto px-1 sm:px-4">
                    <div className="flex flex-col py-1">
                        {/* Top Row: Tabs + Cinemas */}
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50">
                            <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); clearAllFilters(); }}
                                        className={`px-4 sm:px-6 py-4 text-[13px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap font-roboto ${activeTab === tab.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <Link
                                to="/cinemas"
                                className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-primary hover:brightness-110 text-white text-[11px] sm:text-sm font-bold font-roboto transition-colors shadow-lg shadow-primary/20"
                            >
                                <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Browse Cinemas</span>
                                <span className="xs:hidden">Cinemas</span>
                            </Link>
                        </div>

                        {/* Bottom Row: Filters (Full Width Grid) */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3">
                            <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
                                {languages.length > 0 && (
                                    <DropdownFilter
                                        label="Languages"
                                        items={languages}
                                        selected={selectedLanguages}
                                        onToggle={item => toggleFilter(setSelectedLanguages, item)}
                                        onClear={() => setSelectedLanguages([])}
                                    />
                                )}
                                {genres.length > 0 && (
                                    <DropdownFilter
                                        label="Genres"
                                        items={genres}
                                        selected={selectedGenres}
                                        onToggle={item => toggleFilter(setSelectedGenres, item)}
                                        onClear={() => setSelectedGenres([])}
                                    />
                                )}
                                {formats.length > 0 && (
                                    <DropdownFilter
                                        label="Formats"
                                        items={formats}
                                        selected={selectedFormats}
                                        onToggle={item => toggleFilter(setSelectedFormats, item)}
                                        onClear={() => setSelectedFormats([])}
                                        align="right"
                                    />
                                )}
                            </div>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center justify-center lg:justify-start gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                                >
                                    <X className="w-3.5 h-3.5" /> Clear All Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────── */}
            <div className="w-[90%] sm:w-[80%] mx-auto px-4 py-8">

                {/* Result count */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                    {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
                    {activeTab !== 'upcoming' ? (
                        <> in <span className="text-gray-800 dark:text-gray-200 font-semibold">{selectedCity}</span></>
                    ) : (
                        <> coming soon</>
                    )}
                </p>

                {/* Movies Grid */}
                {filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {filteredMovies.map((movie, idx) => (
                            <MovieCard
                                key={movie.id}
                                movie={{ ...movie, delayClass: '' }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24">
                        <Search className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">No Movies Found</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Try adjusting or clearing your filters</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-12 mb-4">
                        <button
                            onClick={prevPage}
                            disabled={pagination.page <= 1}
                            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous Page"
                        >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-roboto transition-all ${pagination.page === p
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={nextPage}
                            disabled={pagination.page >= pagination.pages}
                            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Next Page"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MoviesPage;
