import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { optimizeImage } from '../utils/helpers';

const MovieCard = memo(({ movie }) => (
    <Link
        to={`/movie/${movie.slug || movie.id}`}
        className={`group relative flex flex-col space-y-3 animate-slide-up opacity-0 ${movie.delayClass || ''}`}
    >
        <div className="aspect-[2/3] rounded-2xl overflow-hidden relative bg-gray-200 dark:bg-gray-800 transition-all duration-500 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] dark:group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] group-hover:-translate-y-2">
            <img
                src={optimizeImage(movie.posterUrl, { width: 400, quality: 75 })}
                alt={movie.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            {/* Hover details overlay with Glassmorphism */}
            <div className="absolute inset-x-0 bottom-0 h-[10%] bg-black/5 dark:bg-black/20 backdrop-blur-sm border-t border-white/30 dark:border-white/10 flex items-end opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none p-3 pb-4 translate-y-2 group-hover:translate-y-0 text-white">
                <div className="flex items-center justify-between w-full px-1">
                    <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-xynemaRose fill-xynemaRose dark:text-blue-400 dark:fill-blue-400 drop-shadow-md" />
                        <span className="text-[15px] font-bold drop-shadow-md">{movie.rating > 0 ? movie.rating.toFixed(1) : '0.0'}</span>
                    </div>
                    <span className="text-[11.5px] font-semibold text-white/90 dark:text-gray-200 drop-shadow-sm uppercase tracking-wider">
                        {movie.voteCount > 1000 ? `${(movie.voteCount / 1000).toFixed(0)}k votes` : `${movie.voteCount || 0} votes`}
                    </span>
                </div>
            </div>
        </div>

        <div className="px-1 pt-1">
            <h3 className="text-[17px] font-bold text-[#3B4154] dark:text-gray-100 group-hover:text-xynemaRose dark:group-hover:text-blue-400 transition-colors leading-tight line-clamp-1" style={{ letterSpacing: '-0.01em' }}>
                {movie.title}
            </h3>
        </div>
    </Link>
));

MovieCard.displayName = 'MovieCard';

export default MovieCard;
