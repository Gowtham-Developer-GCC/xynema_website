import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { optimizeImage } from '../utils/helpers';
import { Search, ChevronDown, ChevronUp, Star, Heart, ThumbsUp, ChevronRight, X } from 'lucide-react';

const UpcomingMoviesPage = () => {
    const { upcomingMovies, loading, error, refreshData, toggleInterestOptimistic, getInterestOffset, interestedMovieIds } = useData();
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

        upcomingMovies?.forEach(m => {
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
    }, [upcomingMovies]);

    // Filtering Logic
    const filteredMovies = useMemo(() => {
        if (!upcomingMovies?.length) return [];
        return upcomingMovies.filter(m => {
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
                if (!hasFormat && mFormats.length > 0) return false;
            }

            return true;
        });
    }, [upcomingMovies, selectedLanguages, selectedGenres, selectedFormats]);

    const toggleFilter = (set, item) => {
        set(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const clearFilters = () => {
        setSelectedLanguages([]);
        setSelectedGenres([]);
        setSelectedFormats([]);
    };

    if (loading && !upcomingMovies?.length) return <LoadingScreen message="Loading Upcoming Movies..." />;
    if (error && !upcomingMovies?.length) return <ErrorState error={error} onRetry={() => refreshData()} />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] font-sans transition-colors duration-300">
            <SEO
                title="Upcoming Movies - XYNEMA"
                description="Be the first to catch the latest releases. Explore upcoming movies."
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mobile: Filter Toggle */}
                <div className="md:hidden mb-4">
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="w-full py-3 bg-white border border-gray-200 rounded-lg font-bold text-xynemaRose flex items-center justify-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* LEFT SIDEBAR FILTERS */}
                    <aside className="hidden md:block w-1/4 shrink-0 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Filters</h2>
                            {(selectedLanguages.length > 0 || selectedGenres.length > 0 || selectedFormats.length > 0) && (
                                <button onClick={clearFilters} className="text-xs text-gray-500 dark:text-gray-400 hover:text-xynemaRose dark:hover:text-blue-400 transition-colors">Clear All</button>
                            )}
                        </div>

                        <FilterSection title="Languages" selected={selectedLanguages} items={languages} onToggle={(item) => toggleFilter(setSelectedLanguages, item)} />
                        <FilterSection title="Genres" selected={selectedGenres} items={genres} onToggle={(item) => toggleFilter(setSelectedGenres, item)} />
                        <FilterSection title="Format" selected={selectedFormats} items={formats} onToggle={(item) => toggleFilter(setSelectedFormats, item)} />
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="flex-1">
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Movies</h1>
                                <Link
                                    to="/movies"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-xynemaRose dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-xynemaRose dark:hover:text-blue-400 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 group"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Explore Movies</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* Quick Language Pills */}
                            <div className="flex flex-wrap gap-2">
                                {languages.slice(0, 6).map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => toggleFilter(setSelectedLanguages, lang)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedLanguages.includes(lang)
                                            ? 'bg-xynemaRose dark:bg-blue-600 text-white border-xynemaRose dark:border-blue-600'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-xynemaRose dark:hover:text-blue-400'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredMovies.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredMovies.map(movie => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        isFavorite={favorites.includes(movie.id)}
                                        onToggleFavorite={toggleFavorite}
                                        onToggleInterest={toggleInterestOptimistic}
                                        isInterested={interestedMovieIds.has(movie.id)}
                                        interestOffset={getInterestOffset(movie.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 transition-colors">
                                <Search className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">No Movies Found</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-600">Try adjusting your filters</p>
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
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1 flex items-center gap-2">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                    {title}
                </span>
                {selected.length > 0 && (
                    <span className="text-[10px] bg-xynemaRose/10 dark:bg-blue-500/20 text-xynemaRose dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        {selected.length}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="px-4 pb-4 pt-1">
                    <div className="flex flex-wrap gap-2">
                        {items.map(item => (
                            <button
                                key={item}
                                onClick={() => onToggle(item)}
                                className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${selected.includes(item)
                                    ? 'bg-xynemaRose dark:bg-blue-600 text-white border-xynemaRose dark:border-blue-600'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
    onToggleInterest,
    isInterested,
    interestOffset = 0
}) => {
    return (
        <Link to={`/movie/${movie.slug || movie.id}`} className="flex flex-col group h-full animate-fade-in">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-xl group-hover:shadow-xynemaRose/10 transition-all duration-300">
                <img
                    src={optimizeImage(movie.posterUrl, { width: 400, quality: 80 })}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Date Bar & Likes - Bottom Aligned */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm px-3 py-2.5 border-t border-white/10 flex items-center justify-between">
                    <div className="text-white text-[11px] font-medium flex items-center gap-1.5">
                        {(() => {
                            const date = new Date(movie.releaseDate);
                            return `${date.getDate()}, ${date.toLocaleDateString(undefined, { month: 'short' })} ${date.getFullYear()}`;
                        })()}
                    </div>
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleInterest?.(movie.id); }}
                        className={`flex items-center gap-1.5 transition-all active:scale-95 ${isInterested ? 'text-emerald-400' : 'text-white/70 hover:text-white'}`}
                    >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isInterested ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                        <span className="text-white">
                            {((movie.interestCount || 0) + interestOffset) > 1000
                                ? `${(((movie.interestCount || 0) + interestOffset) / 1000).toFixed(1)}K`
                                : ((movie.interestCount || 0) + interestOffset)}
                            {((movie.interestCount || 0) + interestOffset) > 0 ? '+' : ''}
                        </span>
                    </button>
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => { e.preventDefault(); onToggleFavorite(movie.id); }}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20 ${isFavorite ? 'bg-white text-rose-600 shadow-sm' : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'}`}
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>

            <div className="px-1">
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1 group-hover:text-xynemaRose dark:group-hover:text-blue-400 transition-colors">
                    {movie.title}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                    {Array.isArray(movie.genre) ? movie.genre.join('/') : (movie.genre || '').split(',').join('/')}
                </p>
            </div>
        </Link>
    );
};

export default UpcomingMoviesPage;
