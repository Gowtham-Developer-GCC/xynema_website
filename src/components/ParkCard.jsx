import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

const ParkCard = memo(({ park }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/park/${park.slug || park._id}`, { state: { park } });
    };

    const displayPrice = park.price || 0;

    return (
        <div
            onClick={handleClick}
            className="group flex flex-col cursor-pointer select-none w-full"
        >
            {/* Elegant Rounded Vertical Poster layout perfectly matching Figma */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900">
                <img
                    src={park.images?.[0]?.url || park.cardImage || park.posterImage || 'https://images.unsplash.com/photo-1513885045260-6b3586f24c0b?q=80&w=800'}
                    alt={park.name || park.parkName}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Text Details layout matching Figma */}
            <div className="pt-3 flex flex-col w-full">
                <div className="flex items-start justify-between gap-2 w-full">
                    <h3 className="font-bold text-gray-900 dark:text-white text-[16px] tracking-tight truncate leading-tight group-hover:text-primary transition-colors flex-1">
                        {park.name || park.parkName}
                    </h3>
                    {(park.parkType || park.type) && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 shrink-0 mt-0.5">
                            {park.parkType || park.type}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 font-medium">
                        From <span className="font-bold text-gray-800 dark:text-gray-200">₹{displayPrice.toLocaleString()}</span>
                    </p>
                    {park.discount && (
                        <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                            {park.discount}% off
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

ParkCard.displayName = 'ParkCard';
export default ParkCard;
