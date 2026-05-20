import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Ticket, Calendar, X, ChevronRight, Trophy, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { fetchGlobalSearch } from '../services/searchService';

const UniversalSearch = ({ className = "", variant = "hero", onSelect }) => {
    const isNavbar = variant === "navbar";
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState({ movies: [], theaters: [], events: [], activities: [] });

    // We only need selectedCity now, no need to load all data arrays into memory!
    const { selectedCity } = useData();
    const navigate = useNavigate();
    const searchRef = useRef(null);

    // Handle clicks outside to close results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 1. Debounce Logic: Wait 400ms after user stops typing
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    // 2. Fetch API when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim().length < 2) {
            setResults({ movies: [], theaters: [], events: [], activities: [] });
            setShowResults(false);
            setIsSearching(false);
            return;
        }

        const performSearch = async () => {
            setIsSearching(true);
            try {
                // Hit the single backend endpoint
                const data = await fetchGlobalSearch(debouncedQuery, selectedCity);

                const searchResults = data?.results || [];

                // Group the unified results to match existing UI sections
                setResults({
                    movies: searchResults.filter(r => r._type === 'movie').map(r => ({
                        id: r._id,
                        _id: r._id,
                        title: r.title,
                        genre: r.meta || (Array.isArray(r.raw?.Genre) ? r.raw.Genre.join(', ') : r.raw?.genre) || '',
                        posterUrl: r.image || r.raw?.posterUrl || r.raw?.image,
                        slug: r.raw?.slug || r.raw?.id || r._id
                    })),
                    theaters: searchResults.filter(r => r._type === 'theater' || r._type === 'cinema').map(r => ({
                        id: r._id,
                        _id: r._id,
                        name: r.title,
                        city: r.subtitle || r.raw?.city || '',
                        slug: r._id  // Always use _id for theater API — slug causes 500 errors
                    })),
                    events: searchResults.filter(r => r._type === 'event').map(r => ({
                        id: r._id,
                        _id: r._id,
                        name: r.title,
                        city: r.subtitle || r.raw?.city || '',
                        venue: r.raw?.location?.venue || r.raw?.venue || '',
                        imageUrl: r.image || r.raw?.imageUrl || r.raw?.image,
                        slug: r.raw?.slug || r._id
                    })),
                    activities: searchResults.filter(r => r._type === 'turf' || r._type === 'park').map(r => {
                        const isTurf = r._type === 'turf';
                        return {
                            id: r._id,
                            _id: r._id,
                            searchType: isTurf ? 'turf' : 'park',
                            name: r.title,
                            imageUrl: r.image,
                            images: [r.image],
                            sport: r.raw?.sportTypes?.[0] || r.raw?.sport || 'Sports Turf',
                            location: r.raw?.location?.landmark || r.raw?.landmark || r.subtitle || '',
                            type: r.raw?.parkType || r.raw?.type || 'Theme Park',
                            city: r.raw?.city || r.subtitle || '',
                            slug: r.raw?.slug || r._id
                        };
                    })
                });
                setShowResults(true);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedQuery, selectedCity]);

    const handleSelect = (type, item) => {
        setQuery("");
        setDebouncedQuery("");
        setShowResults(false);
        if (onSelect) onSelect();

        const identifier = item.slug || item.id || item._id;

        if (type === 'movie') navigate(`/movie/${identifier}`);
        else if (type === 'theater') navigate(`/theater/${item._id || item.id}`); // Always use _id, not slug
        else if (type === 'event') navigate(`/event/${identifier}`);
        else if (type === 'turf') navigate(`/activities/${item._id || item.id}`);
        else if (type === 'park') navigate(`/park/${identifier}`);
    };

    const hasResults = results.movies.length > 0 || results.theaters.length > 0 || results.events.length > 0 || results.activities.length > 0;

    return (
        <div ref={searchRef} className={`relative group ${className}`}>
            <div className="relative flex items-center">
                <Search className={`absolute left-4 ${isNavbar ? 'w-4 h-4 text-gray-400 group-focus-within:text-primary' : 'w-5 h-5 text-gray-400 group-focus-within:text-primary'} transition-colors`} />
                <input
                    type="text"
                    placeholder={isNavbar ? "Search Movies, Activities..." : "Search Movies, Theaters, Events, Activities..."}
                    name="global-search-input"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => debouncedQuery.length >= 2 && setShowResults(true)}
                    className={`w-full transition-all font-semibold ${isNavbar
                        ? "pl-11 pr-10 py-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white dark:bg-gray-800/40 dark:hover:bg-gray-800/60 dark:focus:bg-gray-800 border border-gray-100 dark:border-gray-800/80 rounded-2xl text-sm focus:ring-2 focus:ring-primary/25 focus:border-primary text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                        : "pl-14 pr-12 py-4.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 shadow-2xl text-base"
                        } focus:outline-none`}
                />

                {/* Loader or Clear Button */}
                <div className="absolute right-3 flex items-center gap-2">
                    {isSearching && (
                        <Loader className={`animate-spin ${isNavbar ? "w-3.5 h-3.5 text-primary" : "w-4 h-4 text-white"}`} />
                    )}
                    {query && !isSearching && (
                        <button
                            onClick={() => {
                                setQuery("");
                                setDebouncedQuery("");
                            }}
                            className={`p-1 rounded-full transition-all ${isNavbar ? 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            <X className={isNavbar ? "w-3.5 h-3.5" : "w-4 h-4"} />
                        </button>
                    )}
                </div>
            </div>

            {/* Results Overlay */}
            {showResults && debouncedQuery.length >= 2 && (
                <div className={`absolute top-full left-0 right-0 ${isNavbar ? 'mt-3 lg:mt-2' : 'mt-4'} bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300 w-full`}>
                    <div className="max-h-[70vh] overflow-y-auto no-scrollbar py-2 flex flex-col">
                        {hasResults ? (
                            <>
                                {/* Movies Section */}
                                {results.movies.length > 0 && (
                                    <div className="px-2 pb-2">
                                        <h3 className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Ticket className="w-3 h-3" /> Movies
                                        </h3>
                                        {results.movies.map(movie => (
                                            <button
                                                key={movie.id || movie._id}
                                                onClick={() => handleSelect('movie', movie)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group/item text-left"
                                            >
                                                <div className="w-10 h-14 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                                    <img src={movie.posterUrl || movie.poster} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-xynemaRose transition-colors truncate">{movie.title}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mt-0.5">{movie.genre}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Events Section */}
                                {results.events.length > 0 && (
                                    <div className="px-2 py-2 border-t border-gray-100 dark:border-gray-800">
                                        <h3 className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Events
                                        </h3>
                                        {results.events.map(event => (
                                            <button
                                                key={event.id || event._id}
                                                onClick={() => handleSelect('event', event)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group/item text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 shadow-sm flex items-center justify-center text-xynemaRose font-black text-xs">
                                                    {event.imageUrl || event.image ? <img src={event.imageUrl || event.image} className="w-full h-full object-cover" alt="" /> : "XY"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-xynemaRose transition-colors truncate">{event.name}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mt-0.5">{event.city} {event.venue ? `• ${event.venue}` : ''}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Theaters Section */}
                                {results.theaters.length > 0 && (
                                    <div className="px-2 py-2 border-t border-gray-100 dark:border-gray-800">
                                        <h3 className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> Cinemas
                                        </h3>
                                        {results.theaters.map(theater => (
                                            <button
                                                key={theater.id || theater._id}
                                                onClick={() => handleSelect('theater', theater)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group/item text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-xynemaRose transition-colors truncate">{theater.name}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mt-0.5">{theater.city}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Activities Section */}
                                {results.activities.length > 0 && (
                                    <div className="px-2 py-2 border-t border-gray-100 dark:border-gray-800">
                                        <h3 className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Trophy className="w-3 h-3" /> Activities
                                        </h3>
                                        {results.activities.map(activity => (
                                            <button
                                                key={activity.id || activity._id}
                                                onClick={() => handleSelect(activity.searchType, activity)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group/item text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 shadow-sm flex items-center justify-center text-xynemaRose font-black text-xs">
                                                    {(activity.images?.[0] || activity.imageUrl) ? (
                                                        <img src={activity.images?.[0] || activity.imageUrl} className="w-full h-full object-cover" alt="" />
                                                    ) : "ACT"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-xynemaRose transition-colors truncate">{activity.name}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mt-0.5">
                                                        {activity.searchType === 'turf' ? `${activity.sport || 'Sports Turf'} • ${activity.location || ''}` : `${activity.type || 'Theme Park'} • ${activity.city || ''}`}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-12 text-center">
                                <Search className="w-10 h-10 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No matches found for "{debouncedQuery}"</p>
                                <p className="text-gray-300 dark:text-gray-600 text-[10px] uppercase font-black tracking-widest mt-2">Try searching for movies, cities, events or activities</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversalSearch;
