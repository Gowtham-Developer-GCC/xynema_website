import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const SportCard = memo(({ event }) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        const id = event._id || event.id;
        if (!id) return;
        navigate(`/sports/${id}`, { state: { sport: event } });
    };

    const displayImage = event.imageUrl || (event.images && event.images[0]?.url) || event.primaryImage || 'https://placehold.co/800x400';

    return (
        <div 
            onClick={handleNavigate}
            className="group bg-white dark:bg-[#1a1c23] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col h-full cursor-pointer"
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-900/50">
                <img
                    src={displayImage}
                    alt={event.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-1"
                />
            </div>
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
                {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {event.tags.slice(0, 2).map((tag, idx) => (
                            <span 
                                key={idx} 
                                className="text-[10px] font-black uppercase tracking-widest text-primary/90 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/20 whitespace-nowrap"
                            >
                                {tag}
                            </span>
                        ))}
                        {event.tags.length > 2 && (
                            <span className="text-[10px] font-black text-gray-400">
                                +{event.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}
                <h3 className="font-bold line-clamp-2 text-gray-900 dark:text-white text-[0.95rem] sm:text-[1.05rem] leading-snug transition-colors font-roboto mb-2 group-hover:text-primary">
                    {event.name}
                </h3>

                <div className="flex flex-col gap-2 mb-5">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500 shrink-0" />
                        <span className="truncate">
                          {(() => {
                            const parts = [];
                            if (event.venue) parts.push(event.venue);
                            if (event.landmark) parts.push(event.landmark);
                            if (event.city) parts.push(event.city);
                            return parts.join(', ');
                          })()}
                        </span>
                    </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex flex-col">
                        <span className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-medium mb-0.5">
                            Starting from
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-bold text-primary dark:text-primary text-base sm:text-lg lg:text-xl">
                                ₹{event.price ? event.price.toLocaleString() : 'Free'}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-medium">/ hour</span>
                        </div>
                    </div>
                    <button
                        className="flex-shrink-0 px-3 sm:px-5 py-2.5 bg-primary text-white text-[9px] sm:text-[10px] font-black rounded-lg shadow-lg shadow-primary/20 transition-all font-roboto tracking-widest hover:brightness-110 active:scale-95 whitespace-nowrap uppercase"
                    >
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    );
});

SportCard.displayName = 'SportCard';

export default SportCard;
