import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Ticket, MapPin, Check } from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import { reserveEventTickets } from '../services/eventService';

const EventShowSelectionPage = () => {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Safely retrieve state
    const event = location.state?.event;
    const selectedTickets = location.state?.selectedTickets || [];
    const ticketQuantities = location.state?.ticketQuantities || {};
    const totalAmount = location.state?.totalAmount || 0;

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedShowTime, setSelectedShowTime] = useState(null);
    const [isReserving, setIsReserving] = useState(false);

    // Initialize date from event showtimes
    useEffect(() => {
        if (!event || event.eventType !== 'multi-day' || !(event.showTimes?.length > 0)) {
            navigate(`/event/${slug}`); // Not a multi-day event or missing data
            return;
        }

        if (event.showTimes.length > 0 && !selectedDate) {
            // Pick the first date available by default
            const firstDateStr = new Date(event.showTimes[0].date).toISOString().split('T')[0];
            setSelectedDate(firstDateStr);
        }
    }, [event, navigate, slug, selectedDate]);

    if (!event) return <LoadingScreen message="Loading event details" />;

    // Extract unique dates for the date strip
    let uniqueDates = [];
    if (event.showTimes) {
        uniqueDates = [...new Set(event.showTimes.map(st => new Date(st.date).toISOString().split('T')[0]))].sort();
    }

    // Filter showtimes for the selected date
    const showsForDate = event.showTimes?.filter(st => {
        if (!selectedDate) return false;
        return new Date(st.date).toISOString().split('T')[0] === selectedDate;
    }) || [];


    const handleProceedToSummary = async () => {
        if (!selectedShowTime) return;

        setIsReserving(true);
        try {
            let showDate = null;
            let showTime = selectedShowTime.startTime;

            try {
                const dt = new Date(selectedShowTime.date);
                showDate = dt.toISOString();
            } catch (e) {
                showDate = selectedShowTime.date;
            }

            console.log('[Reserve] Sending:', { showDate, showTime, tickets: selectedTickets });

            const result = await reserveEventTickets(event.id, selectedTickets, showDate, showTime);

            if (result?.reservationId) {
                // Navigate to booking summary
                navigate('/events/booking-summary', {
                    state: {
                        event,
                        reservationId: result.reservationId,
                        selectedTickets: location.state?.enrichedTickets || selectedTickets,
                        totalAmount,
                        selectedDate: showDate,
                        selectedTime: showTime
                    }
                });
            } else {
                alert('Failed to reserve tickets. Please try again.');
            }
        } catch (error) {
            console.error('Reserve tickets error:', error);
            alert('Error: ' + (error.message || 'Failed to reserve tickets'));
        } finally {
            setIsReserving(false);
        }
    };

    return (
        <div className="min-h-screen bg-whiteSmoke w-full max-w-[100vw] overflow-x-hidden">
            <SEO
                title={`Select Showtime - ${event?.name} | XYNEMA`}
                description="Choose your preferred date and time for the event"
            />

            {/* Header */}
            <div className="bg-[#f8fafc] dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[60]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                Select Showtime
                            </h1>
                            <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mt-1 truncate">
                                {event?.name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32">
                {/* Event Info Banner Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-[32px] border border-gray-100 dark:border-gray-700 p-4 md:p-8 mb-6 md:mb-8 shadow-sm">
                    <div className="flex flex-row md:flex-row gap-4 md:gap-8 items-center md:items-start">
                        {/* Poster */}
                        <div className="w-24 md:w-48 shrink-0 relative group">
                            <img
                                src={event?.imageUrl || event?.allImages?.[0] || 'https://placehold.co/400x600'}
                                alt={event?.name}
                                className="w-full aspect-[4/3] md:aspect-[16/9] object-cover rounded-xl md:rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Details */}
                        <div className="flex-1 pt-0 md:pt-2">
                            <h2 className="text-base md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 md:mb-4 line-clamp-2">
                                {event?.name}
                            </h2>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-6">
                                {event?.eventCategory && (
                                    <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-[8px] md:text-xs font-black text-gray-400 dark:text-gray-300 uppercase border border-gray-100 dark:border-gray-600">
                                        {event.eventCategory}
                                    </span>
                                )}
                                <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/40 rounded-lg text-[8px] md:text-xs font-black text-primary dark:text-primary uppercase border border-primary/20 dark:border-primary">
                                    Multi-Day
                                </span>
                            </div>

                            <div className="space-y-1 md:space-y-3 mt-1 md:mt-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Venue:</span>
                                    <span className="text-[11px] md:text-base font-black text-gray-900 dark:text-white tracking-tight uppercase truncate max-w-[200px] md:max-w-sm">
                                        {event?.venue}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-gray-100 dark:bg-gray-800 mb-12" />

                {/* Date Strip Component inline */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-6 md:mb-10">
                    <div className="space-y-1">
                        <h2 className="text-base md:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                            Shows for <span className="text-primary dark:text-primary">
                                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
                            </span>
                        </h2>
                    </div>

                    <div className="flex-shrink-0">
                        {uniqueDates.length > 0 && (
                            <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide snap-x">
                                {uniqueDates.map((dateStr) => {
                                    const dateObj = new Date(dateStr);
                                    const isSelected = dateStr === selectedDate;

                                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                                    const dayNum = dateObj.getDate();
                                    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => {
                                                setSelectedDate(dateStr);
                                                setSelectedShowTime(null); // Reset showtime when date changes
                                            }}
                                            className={`
                                                flex-shrink-0 w-14 h-16 md:w-16 md:h-20 rounded-xl md:rounded-2xl flex flex-col items-center justify-center snap-center transition-all duration-300
                                                ${isSelected
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 dark:shadow-primary/40 border-primary'
                                                    : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-gray-300'
                                                } border-2
                                            `}
                                        >
                                            <span className={`text-[8px] md:text-[9px] font-black tracking-widest mb-0.5 md:mb-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                {dayName}
                                            </span>
                                            <span className="text-lg md:text-xl font-black tracking-tighter leading-none mb-0.5 md:mb-1">
                                                {dayNum}
                                            </span>
                                            <span className={`text-[8px] md:text-[9px] font-black tracking-widest ${isSelected ? 'text-white/80' : 'text-gray-300'}`}>
                                                {monthName}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Showtimes Grid */}
                {showsForDate.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {showsForDate.map((show, idx) => {
                            const showId = show.id || idx;
                            const isSelected = selectedShowTime?.id === showId || (selectedShowTime && !selectedShowTime.id && showsForDate.indexOf(selectedShowTime) === idx);

                            return (
                                <button
                                    key={showId}
                                    onClick={() => setSelectedShowTime(show)}
                                    className={`
                                        group bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-500 text-left relative overflow-hidden
                                        hover:-translate-y-1 p-5 shadow-sm hover:shadow-xl
                                        ${isSelected
                                            ? 'border-primary dark:border-primary ring-2 ring-primary/20 shadow-primary/20 dark:shadow-indigo-900/20'
                                            : 'border-gray-100 dark:border-gray-700'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-center mb-3 md:mb-4">
                                        <span className={`text-lg md:text-xl font-black tracking-tight ${isSelected ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
                                            {show.startTime}
                                        </span>
                                        <div className={`px-2 py-0.5 md:py-1 rounded-lg border transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-primary/10 border-primary/20'}`}>
                                            <span className={`text-[10px] md:text-xs font-black flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-primary dark:text-primary'}`}>
                                                {isSelected ? 'Selected' : 'Select'} <Check className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-4 md:mb-6">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                                            {event?.venue}
                                        </span>
                                    </div>

                                    <div className="space-y-1 md:space-y-2">
                                        <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-gray-400 dark:text-gray-500 truncate">{new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    {/* Subtle glow effect on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br transition-opacity pointer-events-none ${isSelected ? 'from-primary/10 opacity-100' : 'from-primary/5 opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Shows Available</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">There are no showtimes scheduled for the selected date.</p>
                    </div>
                )}
            </div>

            {/* Selected Tickets Summary Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full duration-500">
                <div className="bg-white/80 dark:bg-[#1a1c23]/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Total Amount</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {selectedShowTime ? (
                                <button
                                    onClick={handleProceedToSummary}
                                    disabled={isReserving}
                                    className="px-6 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl bg-primary text-white font-bold text-xs md:text-[15px] transition-all hover:bg-[#E33D52] active:scale-95 shadow-lg shadow-primary/30 disabled:opacity-50"
                                >
                                    {isReserving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>PROCESSING</span>
                                        </div>
                                    ) : (
                                        'PROCEED'
                                    )}
                                </button>
                            ) : (
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Select a showtime to proceed</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventShowSelectionPage;
