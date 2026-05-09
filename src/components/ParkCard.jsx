import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Tag } from 'lucide-react';

const ParkCard = memo(({ park }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/park/${park.slug}`, { state: { park } });
    };

    return (
        <div
            onClick={handleClick}
            className="group bg-white dark:bg-[#1a1c23] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer flex flex-col"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img
                    src={park.cardImage || park.posterImage}
                    alt={park.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-1"
                />
                {/* Discount badge */}
                {park.discount && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {park.discount}% off
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-gray-900 dark:text-white text-[0.95rem] leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {park.name}
                </h3>

                <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3.5 h-3.5 fill-current text-primary" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{park.rating}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{park.reviewCount?.toLocaleString()} ratings</span>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-400 font-medium">From</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold text-primary">₹{park.price?.toLocaleString()}</span>
                            {park.originalPrice && (
                                <span className="text-xs text-gray-400 line-through">₹{park.originalPrice?.toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-lg tracking-widest uppercase hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20">
                        Book now
                    </button>
                </div>
            </div>
        </div>
    );
});

ParkCard.displayName = 'ParkCard';
export default ParkCard;
