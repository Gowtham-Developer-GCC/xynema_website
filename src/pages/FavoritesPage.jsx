import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Heart, ArrowLeft, ThumbsUp, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import { optimizeImage } from '../utils/helpers';

const FavoritesPage = () => {
    const {
        movies,
        latestMovies,
        loading,
        interestedMovieIds,
        toggleInterestOptimistic,
        getInterestOffset
    } = useData();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
            return [];
        }
    });

    const favoriteMovies = useMemo(() => {
        const allMovies = [...(movies || []), ...(latestMovies || [])];
        if (!allMovies.length) return [];

        // Use a Map to ensure unique movies by ID
        const uniqueMovies = new Map();
        allMovies.forEach(m => {
            const id = m.id || m._id;
            if (id && favorites.includes(id) && !uniqueMovies.has(id)) {
                uniqueMovies.set(id, m);
            }
        });

        return Array.from(uniqueMovies.values());
    }, [movies, latestMovies, favorites]);

    const toggleFavorite = useCallback((movieId) => {
        setFavorites(prev => {
            const updated = prev.includes(movieId)
                ? prev.filter(id => id !== movieId)
                : [...prev, movieId];
            localStorage.setItem('favorites', JSON.stringify(updated));
            return updated;
        });
    }, []);

    if (loading && !movies?.length) return <LoadingScreen message="Curating Favorites" />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] pb-20">
            <SEO title="My Favorites - Xynema" />

            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-50 rounded-lg transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-display font-bold text-gray-900 tracking-tight">My Favorites</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {favoriteMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
                        {favoriteMovies.map(movie => (
                            <div key={movie.id || movie._id} className="relative group">
                                <Link
                                    to={`/movie/${movie.slug || movie.id || movie._id}`}
                                    className="block space-y-3"
                                >
                                    <div className="aspect-[2/3] rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 bg-white group-hover:shadow-xl transition-all duration-500">
                                        <img
                                            src={optimizeImage(movie.posterUrl, { width: 500, quality: 75 })}
                                            alt={movie.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {movie.isAvailable ? (
                                            movie.rating > 0 && (
                                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500">
                                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                    <span className="text-[10px] font-bold text-white">{movie.rating}/10</span>
                                                </div>
                                            )
                                        ) : (
                                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500">
                                                <div className="text-[10px] font-bold text-white flex items-center gap-1">
                                                    <ThumbsUp className={`w-3 h-3 ${interestedMovieIds.has(movie.id || movie._id) ? 'text-emerald-400 fill-emerald-400' : 'text-white/70'}`} />
                                                    {((movie.interestCount || 0) + getInterestOffset(movie.id || movie._id)) > 1000
                                                        ? `${(((movie.interestCount || 0) + getInterestOffset(movie.id || movie._id)) / 1000).toFixed(1)}K`
                                                        : ((movie.interestCount || 0) + getInterestOffset(movie.id || movie._id))}+
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-1">
                                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-xynemaRose transition-colors">{movie.title}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{movie.genre?.split(',')[0]}</p>
                                    </div>
                                </Link>

                                <button
                                    onClick={() => toggleFavorite(movie.id || movie._id)}
                                    className="absolute top-3 right-3 p-2 rounded-full bg-white text-rose-600 shadow-sm border border-gray-100 backdrop-blur-md transition-all hover:scale-110 active:scale-90 z-20"
                                    aria-label="Remove from Favorites"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                        <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200 border-2 border-dashed border-gray-100">
                            <Heart className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Your Wishlist is Empty</h2>
                            <p className="text-gray-500 text-sm max-w-xs">Start exploring movies and hit the heart icon to save your favorites!</p>
                        </div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-xynemaRose text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
                        >
                            Explore Movies
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;
