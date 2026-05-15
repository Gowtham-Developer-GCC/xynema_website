import { memo } from 'react';

const RideCard = memo(({ ride }) => {
    return (
        <div className="bg-white dark:bg-[#1a1c23] rounded-md overflow-hidden border border-gray-100 dark:border-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col h-full select-none w-full group hover:shadow-md transition-shadow duration-300 p-1">
            {/* Top Ride Image enclosed in white board frame */}
            <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative rounded-sm">
                <img
                    src={ride.image || ride.imageUrl || 'https://images.unsplash.com/photo-1513885045260-6b3586f24c0b?q=80&w=800'}
                    alt={ride.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Details Container nested beautifully in the framed card */}
            <div className="pt-4 flex flex-col flex-1 p-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1.5 tracking-tight">
                    {ride.name}
                </h3>
                <p className="text-[12px] leading-relaxed text-justify text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                    {ride.description}
                </p>
            </div>
        </div>
    );
});

RideCard.displayName = 'RideCard';
export default RideCard;
