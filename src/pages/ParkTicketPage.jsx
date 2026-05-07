import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ChevronLeft, Plus, Minus, Calendar, 
    ArrowRight, Info, ShieldCheck 
} from 'lucide-react';
import { getParkBySlug, getParkAvailability, reserveParkTickets } from '../services/parkService';
import LoadingScreen from '../components/LoadingScreen';
import SEO from '../components/SEO';

const ParkTicketPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [park, setPark] = useState(location.state?.park || null);
    const [loading, setLoading] = useState(!park);
    const [availableTickets, setAvailableTickets] = useState([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityFullData, setAvailabilityFullData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Date selection
    const [selectedDate, setSelectedDate] = useState(null);
    const dates = useMemo(() => {
        const d = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const next = new Date(today);
            next.setDate(today.getDate() + i);
            d.push({
                day: next.toLocaleDateString('en-US', { weekday: 'short' }),
                date: next.getDate(),
                month: next.toLocaleDateString('en-US', { month: 'short' }),
                full: next.toISOString().split('T')[0]
            });
        }
        return d;
    }, []);

    useEffect(() => {
        if (dates.length > 0) setSelectedDate(dates[1]); // Default to tomorrow
    }, [dates]);

    // Ticket selection
    const [counts, setCounts] = useState({});
    
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                if (!park) {
                    setLoading(true);
                    const data = await getParkBySlug(slug);
                    setPark(data);
                }
            } catch (err) {
                console.error("Error fetching park details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [slug, park]);

    // Fetch availability when date changes
    useEffect(() => {
        const fetchAvailability = async () => {
            if (!park?.id || !selectedDate?.full) return;
            
            setAvailabilityLoading(true);
            try {
                const data = await getParkAvailability(park.id, selectedDate.full);
                setAvailabilityFullData(data);
                
                // Support new 'ticketSlots' structure and fallback to legacy ones
                const tickets = data?.ticketSlots || data?.tickets || data?.ticketClasses || (Array.isArray(data) ? data : []);
                
                if (tickets && tickets.length > 0) {
                    const mapped = tickets.map(t => ({
                        id: t.ticketId || t._id || t.id || '',
                        label: t.ticketName || t.label || t.name || t.className || '',
                        price: t.effectivePrice || t.price || 0,
                        description: t.description || t.ageRule || ''
                    }));
                    setAvailableTickets(mapped);
                } else if (park.ticketTypes) {
                    setAvailableTickets(park.ticketTypes);
                }
            } catch (err) {
                console.error("Error fetching availability:", err);
                if (park.ticketTypes) setAvailableTickets(park.ticketTypes);
            } finally {
                setAvailabilityLoading(false);
            }
        };

        fetchAvailability();
    }, [park?.id, selectedDate?.full]);

    useEffect(() => {
        if (availableTickets.length > 0) {
            const initialCounts = {};
            availableTickets.forEach(t => {
                initialCounts[t.id] = 0;
            });
            setCounts(initialCounts);
        }
    }, [availableTickets]);

    const updateCount = (id, delta) => {
        setCounts(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    };

    const totalPrice = useMemo(() => {
        return availableTickets.reduce((acc, t) => acc + (t.price * (counts[t.id] || 0)), 0);
    }, [availableTickets, counts]);

    const totalTickets = useMemo(() => {
        return Object.values(counts).reduce((acc, c) => acc + c, 0);
    }, [counts]);

    if (loading) return <LoadingScreen message="Fetching tickets..." />;
    if (!park) return <div>Park not found</div>;

    const handleCheckout = async () => {
        if (totalTickets === 0 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Prepare reservation data in the new format
            const ticketsPayload = availableTickets
                .filter(t => (counts[t.id] || 0) > 0)
                .map(t => ({
                    ticketId: t.id,
                    quantity: counts[t.id]
                }));

            // Extremely resilient field extraction
            // Precisely extract IDs based on the new API structure
            const scheduleId = availabilityFullData?.schedule?.id || 
                               availabilityFullData?.scheduleId || 
                               availabilityFullData?.schedule?._id;
            
            const bookingDayId = availabilityFullData?.bookingDayId || 
                                 availabilityFullData?.bookingDay?._id || 
                                 availabilityFullData?.bookingDay?.id || 
                                 availabilityFullData?._id;

            const reservationPayload = {
                parkId: park.id || park._id,
                scheduleId: scheduleId,
                bookingDayId: bookingDayId,
                date: selectedDate.full,
                tickets: ticketsPayload
            };

            console.log("RESERVATION DEBUG:", {
                payload: reservationPayload,
                fullAvailabilityData: availabilityFullData,
                parkData: park
            });

            // If we are still missing fields, we'll try to hit it anyway but log a warning
            if (!reservationPayload.scheduleId || !reservationPayload.bookingDayId) {
                console.warn("Some required fields (scheduleId or bookingDayId) might be missing. Attempting reservation anyway...");
            }

            const reservation = await reserveParkTickets(reservationPayload);

            navigate(`/park/${slug}/payment`, { 
                state: { 
                    park, 
                    selectedDate, 
                    counts, 
                    totalPrice,
                    ticketTypes: availableTickets,
                    reservationId: reservation?.reservationId || reservation?.id || reservation?._id || (typeof reservation === 'string' ? reservation : null),
                    bookingDayId: bookingDayId,
                    pricing: reservation?.pricing || reservation?.data?.pricing
                } 
            });
        } catch (err) {
            console.error("Reservation failed:", err);
            alert(err.message || "Failed to reserve tickets. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300 pb-24">
            <SEO title={`Select Tickets - ${park.name}`} />

            {/* Header */}
            <div className="bg-white dark:bg-[#16181d] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-primary transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                         <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">Select Date</h1>
                         <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{park.name}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* Date Selection */}
                        <section>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                {dates.map((d, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(d)}
                                        className={`shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${
                                            selectedDate?.full === d.full
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105'
                                                : 'bg-white dark:bg-gray-800 border-gray-50 dark:border-gray-700 text-gray-500 hover:border-primary/30'
                                        }`}
                                    >
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedDate?.full === d.full ? 'text-white/80' : 'text-gray-400'}`}>{d.day}</p>
                                        <p className="text-xl font-black">{d.date}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${selectedDate?.full === d.full ? 'text-white/80' : 'text-gray-400'}`}>{d.month}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Tickets Selection */}
                        <section>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8">Choose Your Tickets</h2>
                            
                            {availabilityLoading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="bg-white dark:bg-[#16181d] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 animate-pulse h-32" />
                                    ))}
                                </div>
                            ) : availableTickets.length > 0 ? (
                                <div className="space-y-4">
                                    {availableTickets.map((type) => (
                                        <div 
                                            key={type.id} 
                                            className="bg-white dark:bg-[#16181d] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 flex items-center justify-between"
                                        >
                                            <div>
                                                <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-1">{type.label}</h4>
                                                <p className="text-base font-black text-gray-900 dark:text-white">₹{type.price?.toLocaleString()}</p>
                                                {type.description && (
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{type.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-6">
                                                {counts[type.id] > 0 ? (
                                                    <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-2xl">
                                                        <button 
                                                            onClick={() => updateCount(type.id, -1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-700 text-primary border border-primary/20 rounded-xl shadow-sm hover:bg-primary hover:text-white transition-all"
                                                        >
                                                            <Minus className="w-5 h-5" />
                                                        </button>
                                                        <span className="text-lg font-black text-gray-900 dark:text-white w-4 text-center">{counts[type.id]}</span>
                                                        <button 
                                                            onClick={() => updateCount(type.id, 1)}
                                                            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => updateCount(type.id, 1)}
                                                        className="px-10 py-3 bg-primary text-white text-[11px] font-black tracking-[0.2em] uppercase rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                                                    >
                                                        Add
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-[#16181d] rounded-3xl p-12 border border-gray-100 dark:border-gray-800 text-center">
                                    <p className="text-gray-500 font-bold">No tickets available for this date.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="hidden lg:block">
                        <div className="sticky top-[110px] space-y-6">
                            <div className="bg-white dark:bg-[#16181d] rounded-[40px] p-10 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8">Booking Summary</h2>
                                
                                <div className="space-y-6 mb-8">
                                    {availableTickets.map(t => counts[t.id] > 0 && (
                                        <div key={t.id} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-black text-gray-800 dark:text-gray-200">{t.label}</p>
                                                <p className="text-xs text-gray-400 font-bold">{counts[t.id]} x ₹{t.price}</p>
                                            </div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">₹{(counts[t.id] * t.price).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mb-10">
                                    <div className="flex justify-between items-center mb-6">
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Total payable</p>
                                        <div className="flex items-center gap-2 group cursor-pointer">
                                            <p className="text-2xl font-black text-primary">₹{totalPrice.toLocaleString()}</p>
                                            <Info className="w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        disabled={totalTickets === 0 || isSubmitting}
                                        onClick={handleCheckout}
                                        className="w-full py-5 bg-primary text-white font-black tracking-[0.2em] uppercase rounded-2xl shadow-xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Continue to Checkout'
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-gray-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Secure checkout</span>
                                </div>
                            </div>

                            {/* Help & Support */}
                            <div className="bg-white dark:bg-[#16181d] rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-4">Help & Support</p>
                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition-colors">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest">Cancellation Policy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-40">
                <div className="flex items-center justify-between gap-6 max-w-md mx-auto">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Starting from</p>
                        <p className="text-xl font-black text-primary leading-none">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    <button 
                        disabled={totalTickets === 0 || isSubmitting}
                        onClick={handleCheckout}
                        className="flex-1 py-4 bg-primary text-white font-black tracking-widest uppercase rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Checkout'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParkTicketPage;
