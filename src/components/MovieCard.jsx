import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { optimizeImage } from '../utils/helpers';

const MovieCard = memo(({ movie }) => (
    <Link
        to={`/movie/${movie.slug || movie.id}`}
        className={`group relative flex flex-col space-y-2 animate-slide-up opacity-0 ${movie.delayClass || ''}`}
    >
        {/* Full width within its slide to eliminate visual gap between cards */}
        <div className="w-full aspect-[1/1.58] rounded-md overflow-hidden relative bg-gray-200 dark:bg-gray-800 transition-all duration-500">
            <img
                src={optimizeImage(movie.posterUrl, { width: 400, quality: 100 })}
                alt={movie.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
            />
            {/* Hover details overlay with Glassmorphism */}
            <div className="absolute inset-x-0 bottom-0 min-h-[10%] bg-black/40 dark:bg-black/60 backdrop-blur-sm border-t border-white/20 dark:border-white/10 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none p-3 pb-4 text-white">
                {!movie.isAvailable ? (
                    <div className="flex flex-col gap-1 w-full px-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Upcoming</span>
                            <span className="text-[11px] font-medium text-white/90">
                                {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                            </span>
                        </div>
                        <div className="text-[12px] font-bold text-white flex items-center gap-1">
                            <span className="text-rose-400">❤</span> {movie.interestCount || 0} Interested
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full px-1">
                        <div className="flex items-center gap-1.5 focus:outline-none">
                            <Star className="w-4 h-4 text-primary fill-primary drop-shadow-md" />
                            <span className="text-[15px] font-bold font-display drop-shadow-md">{movie.rating > 0 ? movie.rating.toFixed(1) : '0.0'}</span>
                        </div>
                        <span className="text-[11.5px] font-semibold text-white/90 dark:text-gray-200 drop-shadow-sm uppercase tracking-wider">
                            {movie.voteCount > 1000 ? `${(movie.voteCount / 1000).toFixed(0)}k votes` : `${movie.voteCount || 0} votes`}
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* Text is aligned with the image above */}
        <div className="pt-1 flex flex-col w-full">
            <h3 className="text-[17px] font-bold text-black dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary transition-colors leading-tight line-clamp-2 font-display uppercase tracking-tight">
                {movie.title}
            </h3>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">
                {(() => {
                    if (!movie.genre) return movie.language || 'Action / Thriller';
                    const list = Array.isArray(movie.genre)
                        ? movie.genre
                        : typeof movie.genre === 'string'
                            ? movie.genre.split(',').map(g => g.trim())
                            : [];
                    return list.slice(0, 2).join(' / ');
                })()}
            </p>
        </div>
    </Link>
));

MovieCard.displayName = 'MovieCard';

export default MovieCard;
