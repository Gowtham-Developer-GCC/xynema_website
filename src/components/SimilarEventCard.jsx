import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { optimizeImage } from '../utils/helpers';

const SimilarEventCard = memo(({ event }) => {
    const navigate = useNavigate();

    // Safely format the date
    const getFormattedDate = () => {
        if (!event.startDate) return 'TBA';
        try {
            const start = new Date(event.startDate);
            const options = { day: 'numeric', month: 'long', year: 'numeric' };

            if (event.eventType === 'multi-day' && event.endDate && event.endDate !== event.startDate) {
                const end = new Date(event.endDate);
                if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
                }
                if (start.getFullYear() === end.getFullYear()) {
                    return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                }
                return `${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`;
            }
            return start.toLocaleDateString('en-IN', options);
        } catch (e) {
            return event.startDate;
        }
    };

    const formattedDate = getFormattedDate();
    const eventLink = `/event/${event.slug || event.id}`;

    return (
        <div
            onClick={() => navigate(eventLink, { state: { event } })}
            className="group cursor-pointer flex flex-col bg-white dark:bg-[#1a1c23] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 h-full"
        >
            <div className="relative aspect-[3/2] overflow-hidden">
                <img
                    src={optimizeImage(event.imageUrl, { width: 600, height: 400, quality: 80 }) || 'https://via.placeholder.com/600x400?text=No+Image'}
                    alt={event.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-medium text-[#111827] dark:text-gray-100 mb-6 tracking-tight line-clamp-2">
                    {event.name}
                </h3>

                <div className="space-y-3 mt-auto mb-5">
                    <div className="flex items-center gap-3 text-[#4B5563] dark:text-gray-400">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                        <span className="text-sm font-medium">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#4B5563] dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                        <span className="text-sm font-medium truncate">{event.city || event.venue}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-medium text-primary dark:text-[#60a5fa]">₹{event.price || '0'}</span>
                        <span className="text-xs font-medium text-[#6B7280] dark:text-gray-500">onwards</span>
                    </div>
                    <div className="text-xs font-semibold text-[#4B5563] dark:text-gray-400 flex items-center gap-1 group-hover:text-[#111827] dark:group-hover:text-white transition-colors">
                        View details
                        <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7" />
                            <path d="M7 7h10v10" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
});

SimilarEventCard.displayName = 'SimilarEventCard';

export default SimilarEventCard;
