import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Tag } from 'lucide-react';

const ParkCard = memo(({ park }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/park/${park.slug || park._id}`, { state: { park } });
    };

    return (
        <div
            onClick={handleClick}
            className="group bg-white dark:bg-[#1a1c23] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer flex flex-col"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img
                    src={park.images?.[0]?.url || park.cardImage || park.posterImage || 'https://images.unsplash.com/photo-1513885045260-6b3586f24c0b?q=80&w=800'}
                    alt={park.name || park.parkName}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-1"
                />
                {/* Discount badge */}
                {park.discount && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md shadow-green-500/20">
                        <Tag className="w-3 h-3" />
                        {park.discount}% off
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Title and Park Type Row */}
                <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                        {park.name || park.parkName}
                    </h3>
                    {(park.parkType || park.type) && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0 mt-0.5">
                            {park.parkType || park.type}
                        </span>
                    )}
                </div>

                {/* Rating and Reviews */}
                {/* <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3.5 h-3.5 fill-current text-primary" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{park.rating !== undefined ? park.rating : 0}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{(park.reviewCount || 0).toLocaleString()} ratings</span>
                </div> */}

                {/* Location / Address */}
                {(park.address || park.location || park.city) && (
                    <div className="flex items-start gap-1 text-gray-500 dark:text-gray-500 text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5  shrink-0 mt-0.5" />
                        <span className="line-clamp-1 font-semibold">
                            {park.address || park.location || park.city}
                        </span>
                    </div>
                )}

                {/* Description */}
                {/* {park.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-4 leading-relaxed">
                        {park.description}
                    </p>
                )} */}

                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mb-0.5 font-display">From</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-primary">₹{(park.price || 0).toLocaleString()}</span>
                            {park.originalPrice && (
                                <span className="text-sm text-gray-400 line-through">₹{park.originalPrice.toLocaleString()}</span>
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
