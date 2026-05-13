import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Ticket, Calendar, X, ChevronRight, Play, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const UniversalSearch = ({ className = "", variant = "hero", onSelect }) => {
    const isNavbar = variant === "navbar";
    const [query, setQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState({ movies: [], theaters: [], events: [], activities: [] });
    const { movies, latestMovies, upcomingMovies, theaters, events, turfs, parks, refreshData, loading } = useData();
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

    // Categorized search logic
    useEffect(() => {
        if (query.length < 2) {
            setResults({ movies: [], theaters: [], events: [], activities: [] });
            return;
        }

        // Lazily load datasets in background if user types and datasets are still completely empty
        const isEmpty = (movies?.length === 0) && (latestMovies?.length === 0) && (upcomingMovies?.length === 0);
        if (isEmpty && !loading) {
            refreshData(1);
        }

        const lowerQuery = query.toLowerCase();

        // Helper to deduplicate by ID
        const deduplicate = (items) => {
            const seen = new Set();
            return items.filter(item => {
                const id = item.id || item._id || item.slug;
                if (!id) return true; // Keep if no ID (shouldn't happen)
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        };

        // 1. Search Movies (including latest/upcoming) - Deduplicate combined list
        const allMovies = deduplicate([...(movies || []), ...(latestMovies || []), ...(upcomingMovies || [])]);
        const matchedMovies = allMovies.filter(m =>
            (m.title || "").toLowerCase().includes(lowerQuery) ||
            (m.genre || "").toLowerCase().includes(lowerQuery)
        ).slice(0, 4);

        // 2. Search Theaters
        const matchedTheaters = deduplicate(theaters || []).filter(t =>
            (t.name || "").toLowerCase().includes(lowerQuery) ||
            (t.city || "").toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        // 3. Search Events
        const matchedEvents = deduplicate(events || []).filter(e =>
            (e.name || "").toLowerCase().includes(lowerQuery) ||
            (e.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))
        ).slice(0, 3);

        // 4. Search Activities (Turfs and Parks)
        const matchedTurfs = deduplicate(turfs || []).filter(t =>
            (t.name || "").toLowerCase().includes(lowerQuery) ||
            (t.sport || "").toLowerCase().includes(lowerQuery) ||
            (t.location || "").toLowerCase().includes(lowerQuery)
        ).map(t => ({ ...t, searchType: 'turf' }));

        const matchedParks = deduplicate(parks || []).filter(p =>
            (p.name || "").toLowerCase().includes(lowerQuery) ||
            (p.city || "").toLowerCase().includes(lowerQuery) ||
            (p.type || "").toLowerCase().includes(lowerQuery)
        ).map(p => ({ ...p, searchType: 'park' }));

        const matchedActivities = [...matchedTurfs, ...matchedParks].slice(0, 4);

        setResults({
            movies: matchedMovies,
            theaters: matchedTheaters,
            events: matchedEvents,
            activities: matchedActivities
        });
        setShowResults(true);
    }, [query, movies, latestMovies, theaters, events, turfs, parks]);

    const handleSelect = (type, item) => {
        setQuery("");
        setShowResults(false);
        if (onSelect) onSelect();

        const identifier = item.slug || item.id || item._id;

        if (type === 'movie') navigate(`/movie/${identifier}`);
        else if (type === 'theater') navigate(`/theater/${identifier}`);
        else if (type === 'event') navigate(`/event/${identifier}`);
        else if (type === 'turf') navigate(`/activities/${identifier}`);
        else if (type === 'park') navigate(`/park/${identifier}`);
    };

    const hasResults = results.movies.length > 0 || results.theaters.length > 0 || results.events.length > 0 || results.activities.length > 0;

    return (
        <div ref={searchRef} className={`relative group ${className}`}>
            <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isNavbar ? 'w-4 h-4 text-gray-400 group-focus-within:text-primary' : 'w-5 h-5 text-gray-400 group-focus-within:text-primary'} transition-colors`} />
                <input
                    type="text"
                    placeholder={isNavbar ? "Search Movies, Activities..." : "Search Movies, Theaters, Events, Activities..."}
                    name="global-search-input"
                    autoComplete="off"
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    className={`w-full transition-all font-semibold ${isNavbar
                        ? "pl-11 pr-10 py-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white dark:bg-gray-800/40 dark:hover:bg-gray-800/60 dark:focus:bg-gray-800 border border-gray-100 dark:border-gray-800/80 rounded-2xl text-sm focus:ring-2 focus:ring-primary/25 focus:border-primary text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
                        : "pl-14 pr-12 py-4.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 shadow-2xl text-base"
                        } focus:outline-none`}
                />
                {query && (
                    <button
                        onClick={() => setQuery("")}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all ${isNavbar ? 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        <X className={isNavbar ? "w-3.5 h-3.5" : "w-4 h-4"} />
                    </button>
                )}
            </div>

            {/* Results Overlay */}
            {showResults && query.length >= 2 && (
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
                                                key={movie.id}
                                                onClick={() => handleSelect('movie', movie)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group/item text-left"
                                            >
                                                <div className="w-10 h-14 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                                    <img src={movie.posterUrl} className="w-full h-full object-cover" alt="" />
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
                                                key={event.id}
                                                onClick={() => handleSelect('event', event)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group/item text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 shadow-sm flex items-center justify-center text-xynemaRose font-black text-xs">
                                                    {event.imageUrl ? <img src={event.imageUrl} className="w-full h-full object-cover" alt="" /> : "XY"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-xynemaRose transition-colors truncate">{event.name}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mt-0.5">{event.city} • {event.venue}</p>
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
                                                key={theater.id}
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
                                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No matches found for "{query}"</p>
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
