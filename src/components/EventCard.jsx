import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { optimizeImage } from '../utils/helpers';

const EventCard = memo(({ event }) => {
    // Format the date precisely as requested
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(event.startDate || Date.now()));

    // Use absolute routing for events based on slug or ID
    const eventLink = `/event/${event.slug || event.id}`;

    // Format location string with venue, landmark, and city
    const locationString = [event.venue, event.landmark, event.city].filter(Boolean).join(', ');

    return (
        <Link to={eventLink} className="group block w-full">
            <div className={`bg-white dark:bg-[#1a1c23] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl flex flex-col h-full transition-all duration-300 cursor-pointer ${event.delayClass || ''}`}>
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                        src={optimizeImage(event.imageUrl, { width: 600, height: 375, quality: 80 }) || 'https://via.placeholder.com/600x375?text=No+Image'}
                        alt={event.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-1"
                    />
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-grow ">
                    <div className="mb-2 block">
                        <h3 className="font-bold line-clamp-2 text-gray-900 dark:text-white text-[0.95rem] sm:text-[1.05rem] leading-snug transition-colors font-roboto group-hover:text-primary">
                            {event.name}
                        </h3>
                    </div>

                    <div className="flex flex-col gap-2 mb-5">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                            <span className="truncate">{locationString}</span>
                        </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                        <span className="font-bold text-primary dark:text-primary text-[13px] sm:text-lg min-w-0 truncate">
                            ₹{event.price ? event.price.toLocaleString() : 'Free'}
                        </span>
                        <div
                            className="flex-shrink-0 px-3 sm:px-5 py-2 bg-primary text-white text-[9px] sm:text-[10px] font-bold rounded-lg shadow-lg shadow-primary/20 transition-all font-roboto tracking-widest sm:tracking-wider hover:brightness-110 active:scale-95 whitespace-nowrap uppercase"
                        >
                            Book Now
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});

EventCard.displayName = 'EventCard';

export default EventCard;
