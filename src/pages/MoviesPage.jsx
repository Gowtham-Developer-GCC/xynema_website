import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, ChevronDown, ChevronUp, Star, Heart, ThumbsUp, ChevronRight, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import { optimizeImage } from '../utils/helpers';

const MoviesPage = ({ selectedCity }) => {
    const {
        movies,
        loading,
        error,
        refreshData,
        pagination,
        nextPage,
        prevPage,
        goToPage,
        interestedMovieIds,
        toggleInterestOptimistic,
        getInterestOffset
    } = useData();
    const navigate = useNavigate();

    // Filter States
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedFormats, setSelectedFormats] = useState([]);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
            return [];
        }
    });

    const toggleFavorite = (movieId) => {
        setFavorites(prev => {
            const updated = prev.includes(movieId)
                ? prev.filter(id => id !== movieId)
                : [...prev, movieId];
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
        });
    };

    // Derived Data for Filters
    const { languages, genres, formats } = useMemo(() => {
        const langs = new Set();
        const gens = new Set();
        const fmts = new Set();

        movies?.forEach(m => {
            // Language parsing - Split by comma
            if (m.language) {
                const lList = m.language.split(',').map(s => s.trim());
                lList.forEach(l => l && langs.add(l));
            }
            // Genre parsing
            const gList = Array.isArray(m.genre) ? m.genre : (m.genre || '').split(',').map(s => s.trim());
            gList.forEach(g => g && gens.add(g));
            // Format parsing
            if (Array.isArray(m.format)) m.format.forEach(f => fmts.add(f));
        });

        return {
            languages: Array.from(langs).sort(),
            genres: Array.from(gens).sort(),
            formats: Array.from(fmts).sort()
        };
    }, [movies]);

    // Filtering Logic
    const filteredMovies = useMemo(() => {
        if (!movies?.length) return [];
        return movies.filter(m => {
            // Language Filter
            if (selectedLanguages.length > 0) {
                const movieLangs = (m.language || '').split(',').map(s => s.trim());
                const hasLang = movieLangs.some(l => selectedLanguages.includes(l));
                if (!hasLang) return false;
            }

            // Genre Filter
            if (selectedGenres.length > 0) {
                const mGenres = Array.isArray(m.genre) ? m.genre : (m.genre || '').split(',').map(s => s.trim());
                const hasGenre = mGenres.some(g => selectedGenres.includes(g));
                if (!hasGenre) return false;
            }

            // Format Filter
            if (selectedFormats.length > 0) {
                const mFormats = Array.isArray(m.format) ? m.format : [];
                const hasFormat = mFormats.some(f => selectedFormats.includes(f));
                // If movie has no format data, we might decide to show/hide. Assuming hide if filter active.
                if (!hasFormat && mFormats.length > 0) return false;
            }

            return true;
        });
    }, [movies, selectedLanguages, selectedGenres, selectedFormats]);

    const toggleFilter = (set, item) => {
        set(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const clearFilters = () => {
        setSelectedLanguages([]);
        setSelectedGenres([]);
        setSelectedFormats([]);
    };

    if (loading && !movies?.length) return <LoadingSpinner message="Loading Movies..." />;
    if (error && !movies?.length) return <ErrorState error={error} onRetry={refreshData} title="Something went wrong" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] font-sans">
            <SEO
                title={`Movies in ${selectedCity} - XYNEMA`}
                description={`Browse upcoming movies in ${selectedCity}. Filter by language, genre, and format.`}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mobile: Filter Toggle (Simplified) */}
                <div className="md:hidden mb-4">
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="w-full py-3 bg-white border border-gray-200 rounded-lg font-bold text-xynemaRose"
                    >
                        Filters
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* LEFT SIDEBAR FILTERS */}
                    <aside className="hidden md:block w-1/4 shrink-0 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                            {(selectedLanguages.length > 0 || selectedGenres.length > 0 || selectedFormats.length > 0) && (
                                <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-xynemaRose">Clear All</button>
                            )}
                        </div>

                        {/* Languages Filter */}
                        <FilterSection title="Languages" selected={selectedLanguages} items={languages} onToggle={(item) => toggleFilter(setSelectedLanguages, item)} />

                        {/* Genres Filter */}
                        <FilterSection title="Genres" selected={selectedGenres} items={genres} onToggle={(item) => toggleFilter(setSelectedGenres, item)} />

                        {/* Format Filter */}
                        <FilterSection title="Format" selected={selectedFormats} items={formats} onToggle={(item) => toggleFilter(setSelectedFormats, item)} />
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="flex-1">
                        {/* Header & Quick Filters */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-2xl font-bold text-gray-900">Movies In {selectedCity}</h1>
                                    <span className="text-sm text-gray-400 font-medium hidden sm:inline-block">
                                        ({filteredMovies.length} Movies)
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link
                                        to="/upcoming-movies"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-xynemaRose text-gray-700 hover:text-xynemaRose rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 group"
                                    >
                                        <Search className="w-4 h-4" />
                                        <span>Explore Upcoming</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            {/* Quick Language Pills */}
                            <div className="flex flex-wrap gap-2">
                                {languages.slice(0, 6).map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => toggleFilter(setSelectedLanguages, lang)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedLanguages.includes(lang)
                                            ? 'bg-xynemaRose text-white border-xynemaRose'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-xynemaRose'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>


                        {/* Movies Grid */}
                        {filteredMovies.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredMovies.map(movie => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        isFavorite={favorites.includes(movie.id)}
                                        onToggleFavorite={toggleFavorite}
                                        isInterested={interestedMovieIds.has(movie.id)}
                                        interestOffset={getInterestOffset(movie.id)}
                                        onToggleInterest={toggleInterestOptimistic}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-500">No Movies Found</h3>
                                <p className="text-sm text-gray-400">Try adjusting your filters</p>
                            </div>
                        )}
                        {/* Pagination Controls */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-12 mb-8">
                                <button
                                    onClick={prevPage}
                                    disabled={pagination.page <= 1}
                                    className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Previous Page"
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>

                                <div className="flex items-center gap-2">
                                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${pagination.page === p
                                                ? 'bg-xynemaRose text-white shadow-lg shadow-xynemaRose/30'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={nextPage}
                                    disabled={pagination.page >= pagination.pages}
                                    className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Next Page"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileFiltersOpen(false)} />
                    <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F5F5FA]">
                            <FilterSection title="Languages" selected={selectedLanguages} items={languages} onToggle={(item) => toggleFilter(setSelectedLanguages, item)} />
                            <FilterSection title="Genres" selected={selectedGenres} items={genres} onToggle={(item) => toggleFilter(setSelectedGenres, item)} />
                            <FilterSection title="Format" selected={selectedFormats} items={formats} onToggle={(item) => toggleFilter(setSelectedFormats, item)} />
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
                            <button
                                onClick={clearFilters}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="flex-1 py-3 px-4 rounded-xl bg-xynemaRose text-white font-bold text-sm shadow-lg shadow-xynemaRose/20"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============= SUB-COMPONENTS =============

const FilterSection = ({ title, items, selected, onToggle }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!items || items.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <span className="text-sm font-bold text-gray-900 flex-1 text-left flex items-center gap-2">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    {title}
                </span>
                {selected.length > 0 && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                        {selected.length}
                    </span>
                )}
            </button>

            {/* Animated Height Container could be added here, keeping it simple for now */}
            {isOpen && (
                <div className="px-4 pb-4 pt-1">
                    <div className="flex flex-wrap gap-2">
                        {items.map(item => (
                            <button
                                key={item}
                                onClick={() => onToggle(item)}
                                className={`px-3 py-1.5 text-xs border rounded transition-all ${selected.includes(item)
                                    ? 'bg-xynemaRose text-white border-xynemaRose'
                                    : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
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

const MovieCard = ({
    movie,
    isFavorite,
    onToggleFavorite,
    isInterested,
    interestOffset = 0,
    onToggleInterest
}) => {
    return (
        <Link to={`/movie/${movie.slug || movie.id}`} className="flex flex-col group h-full">
            {/* Poster Container */}
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-gray-100 mb-3">
                <img
                    src={optimizeImage(movie.posterUrl, { width: 400, quality: 80 })}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Rating Badge (Bottom Left) - Only if there are reviews */}
                <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent pt-8">
                    {movie.isAvailable ? (
                        <div className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {movie.rating > 0 ? movie.rating.toFixed(1) : '0.0'}/10
                        </div>
                    ) : (
                        <div className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            Upcoming
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto pr-1">
                        <div className="w-[1px] h-3 bg-white/20 mr-1" />
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onToggleInterest?.(movie.id);
                            }}
                            className="text-white text-[10px] font-bold drop-shadow-md flex items-center gap-1 transition-all active:scale-90"
                        >
                            <ThumbsUp className={`w-3 h-3 ${isInterested ? 'text-emerald-400 fill-emerald-400' : 'text-white/70'}`} />
                            {movie.isAvailable ? (
                                <>
                                    {(movie.voteCount || 0) > 1000 ? `${(movie.voteCount / 1000).toFixed(1)}K` : (movie.voteCount || 0).toLocaleString()} Votes
                                </>
                            ) : (
                                <>
                                    {((movie.interestCount || 0) + interestOffset) > 1000
                                        ? `${(((movie.interestCount || 0) + interestOffset) / 1000).toFixed(1)}K`
                                        : ((movie.interestCount || 0) + interestOffset)} Interested
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <button
                    onClick={(e) => { e.preventDefault(); onToggleFavorite(movie.id); }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-20 ${isFavorite ? 'bg-white text-rose-600 shadow-sm' : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'}`}
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>

            {/* Info */}
            <h3 className="text-[15px] font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-xynemaRose transition-colors mb-1">
                {movie.title}
            </h3>
            <p className="text-[13px] text-gray-500 font-medium group-hover:text-gray-700 transition-colors">
                {movie.certification || 'U'} • {movie.language}
            </p>
        </Link>
    );
};

export default MoviesPage;
