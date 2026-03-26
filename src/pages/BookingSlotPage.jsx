import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronRight, Sun, Moon, Clock, Info, Check, Minus, Plus } from 'lucide-react';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import { getTurfDetails, getAvailableSlots, reserveSlots } from '../services/turfService';
// Fallback for toast notifications if react-hot-toast is not available
const toast = {
    error: (msg) => alert(`Error: ${msg}`),
    success: (msg) => alert(`Success: ${msg}`)
};

const BookingSlotPage = () => {
    const { turfId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Initial state from navigation
    const [venue, setVenue] = useState(location.state?.sport || null);
    const [loading, setLoading] = useState(!venue);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [reserving, setReserving] = useState(false);
    
    // Selection states
    const [selectedSport, setSelectedSport] = useState('');
    const [selectedCourt, setSelectedCourt] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [duration, setDuration] = useState(1);
    const [isAdvancePay, setIsAdvancePay] = useState(true);
    const [timeSlots, setTimeSlots] = useState({ morning: [], afternoon: [], evening: [] });

    // Date generation for the picker
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            full: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: d.getDate(),
            month: d.toLocaleDateString('en-US', { month: 'short' }),
            isToday: i === 0,
            isTomorrow: i === 1
        };
    });

    // Load venue details if not passed correctly
    useEffect(() => {
        const fetchDetails = async () => {
            if (!venue && turfId) {
                setLoading(true);
                const data = await getTurfDetails(turfId);
                if (data) {
                    setVenue(data);
                    // Initialize selections
                    const firstCourt = data.courts?.[0];
                    if (firstCourt) {
                        setSelectedCourt(firstCourt._id || firstCourt.id);
                        setSelectedSport(firstCourt.sportTypes?.[0] || 'Football');
                    }
                }
                setLoading(false);
            } else if (venue) {
                const firstCourt = venue.courts?.[0];
                if (firstCourt) {
                    setSelectedCourt(firstCourt._id || firstCourt.id);
                    setSelectedSport(firstCourt.sportTypes?.[0] || 'Football');
                }
            }
        };
        fetchDetails();
    }, [turfId]);

    // Fetch Slots whenever court or date changes
    useEffect(() => {
        if (selectedCourt && selectedDate) {
            const fetchSlots = async () => {
                setFetchingSlots(true);
                const slots = await getAvailableSlots(selectedCourt, selectedDate);
                
                // Categorize slots
                const categorized = { morning: [], afternoon: [], evening: [] };
                slots.forEach(s => {
                    // Response startTime is "06:00", "13:00", etc.
                    const startTime = s.startTime || '';
                    if (!startTime) return;
                    
                    const hour = parseInt(startTime.split(':')[0]);
                    
                    // Format for display (e.g., 06:00 -> 06:00 AM)
                    const formatTime = (h, m = "00") => {
                        const HH = parseInt(h);
                        const suffix = HH >= 12 ? "PM" : "AM";
                        const hour12 = HH % 12 || 12;
                        return `${hour12.toString().padStart(2, '0')}:${m} ${suffix}`;
                    };
                    
                    const displayLabel = formatTime(hour, startTime.split(':')[1] || "00");
                    const processedSlot = { ...s, displayLabel };

                    if (hour < 12) categorized.morning.push(processedSlot);
                    else if (hour < 17) categorized.afternoon.push(processedSlot);
                    else categorized.evening.push(processedSlot);
                });
                
                setTimeSlots(categorized);
                setFetchingSlots(false);
            };
            fetchSlots();
        }
    }, [selectedCourt, selectedDate]);

    // Update selected sport when court changes if current sport not valid for new court
    useEffect(() => {
        if (selectedCourt && venue) {
            const court = venue.courts.find(c => (c._id || c.id) === selectedCourt);
            if (court && court.sportTypes) {
                // If current selected sport is not in the new court's supported sports, switch it
                if (!court.sportTypes.some(s => s.toLowerCase() === selectedSport.toLowerCase())) {
                    setSelectedSport(court.sportTypes[0]);
                }
            }
        }
    }, [selectedCourt, venue]);

    const handleSlotClick = (slotObj) => {
        // Disable if status is not available OR if it's in the past
        if (slotObj.status !== 'available' || slotObj.isPast) return;
        
        const isAlreadySelected = selectedSlots.some(s => (s._id || s.id) === (slotObj._id || slotObj.id));
        if (isAlreadySelected) {
            setSelectedSlots(selectedSlots.filter(s => (s._id || s.id) !== (slotObj._id || slotObj.id)));
        } else {
            setSelectedSlots([...selectedSlots, slotObj]);
        }
    };
    const handleBooking = async () => {
        if (selectedSlots.length === 0) {
            toast.error('Please select at least one slot');
            return;
        }

        try {
            setReserving(true);
            const slotIds = selectedSlots.map(s => s._id || s.id);
            const result = await reserveSlots(slotIds, selectedSport);
            
            if (result) {
                // toast.success('Slots reserved successfully!');
                
                // Navigate to turf payment page with reservation data
                navigate('/sports/payment', { 
                    state: { 
                        reservation: result,
                        turf: venue,
                        court: currentCourt,
                        sport: selectedSport,
                        date: selectedDate
                    } 
                });
            } else {
                toast.error('Could not reserve slots. They may have been taken.');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setReserving(false);
        }
    };

    const currentCourt = venue?.courts?.find(c => (c._id || c.id) === selectedCourt);
    const turfFee = selectedSlots.reduce((sum, s) => sum + (s.priceOverride || s.pricePerHour || currentCourt?.pricePerHour || venue?.price || 0), 0);
    const convenienceFee = selectedSlots.length > 0 ? 40 : 0;
    const totalAmount = turfFee + convenienceFee;

    if (loading) return <LoadingScreen message="Initialising Booking..." />;

    return (
        <div className="min-h-screen max-w-[70%] mx-auto bg-[#F8F9FA] dark:bg-[#0f1115] pb-24">
            <SEO title={`Book Slots - ${venue?.name || 'Venue'}`} />

            {/* Header */}
            <header className="bg-white dark:bg-[#1a1c23] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-20 flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                        <ArrowLeft className="w-6 h-6 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold dark:text-white leading-tight">{venue?.name || 'Elite Arena Pro'}</h1>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[13px] font-medium">{venue?.venue || 'Edapally, Kochi'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-12">
                {/* Left Section: Selections */}
                <div className="flex-1 space-y-12">
                    
                    {/* Select Sport */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold dark:text-white">Select sport</h2>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {(currentCourt?.sportTypes || []).map(sport => (
                                <button
                                    key={sport}
                                    onClick={() => setSelectedSport(sport)}
                                    className={`px-12 py-4 rounded-lg font-bold text-sm transition-all min-w-[180px] capitalize ${
                                        selectedSport.toLowerCase() === sport.toLowerCase()
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'bg-white dark:bg-[#1a1c23] border border-gray-100 dark:border-gray-800 text-gray-500 hover:border-primary/30'
                                    }`}
                                >
                                    {sport}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Select Court */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold dark:text-white">Select court</h2>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {venue?.courts?.map(court => (
                                <button
                                    key={court._id || court.id}
                                    onClick={() => setSelectedCourt(court._id || court.id)}
                                    className={`p-4 rounded-xl transition-all min-w-[100px] text-left flex flex-col gap-1 border ${
                                        selectedCourt === (court._id || court.id)
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                        : 'bg-white dark:bg-[#1a1c23] border-gray-100 dark:border-gray-800 text-gray-500 hover:border-primary/30'
                                    }`}
                                >
                                    <span className="text-sm font-bold uppercase">{court.courtName || court.courtNumber || 'Court'}</span>
                                    <span className="text-[11px] opacity-60 font-medium mb-1 capitalize">
                                        {(court.surfaceType || 'Slot').replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[15px] font-black">₹{court.pricePerHour || venue?.price}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Select Date */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold dark:text-white">Select Date</h2>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {dates.map(d => (
                                <button
                                    key={d.full}
                                    onClick={() => setSelectedDate(d.full)}
                                    className={`flex flex-col items-center justify-center min-w-[85px] py-4 rounded-xl transition-all border ${
                                        selectedDate === d.full 
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                        : 'bg-white dark:bg-[#1a1c23] border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <span className={`text-[12px] font-bold mb-1 ${selectedDate === d.full ? 'text-white' : 'text-gray-400'}`}>
                                        {d.isToday ? 'Today' : d.isTomorrow ? 'Tomorrow' : d.day}
                                    </span>
                                    <span className="text-base font-medium">
                                        {d.month.slice(0, 3)} {d.date}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Select Slot */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold dark:text-white">Select Slot</h2>
                            
                            <div className="flex items-center gap-4">
                                {fetchingSlots && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                                <span className="text-primary font-bold text-sm hidden sm:block">
                                    {selectedSlots.length > 0 ? selectedSlots[0].displayLabel : 'No slot selected'}
                                </span>
                                <div className="flex items-center gap-3 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                                    <span className="text-sm font-bold dark:text-white min-w-[40px] text-center">
                                        Slot Duration : {currentCourt?.defaultSlotDuration || 60} mins
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Slot Categories */}
                        <div className="space-y-10 relative">
                            {fetchingSlots && <div className="absolute inset-0 bg-white/50 dark:bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl" />}
                            
                            {/* Morning */}
                            {timeSlots.morning.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                        <Sun className="w-4 h-4 text-yellow-500 dark:text-yellow-200" /> Morning
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {timeSlots.morning.map(slot => {
                                            const isSelected = selectedSlots.some(s => (s._id || s.id) === (slot._id || slot.id));
                                            const isUnavailable = slot.status !== 'available' || slot.isPast;
                                            return (
                                                <button
                                                    key={slot._id || slot.id}
                                                    disabled={isUnavailable}
                                                    onClick={() => handleSlotClick(slot)}
                                                    className={`py-3 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-0.5 ${
                                                        isSelected
                                                        ? 'bg-primary border-primary text-white shadow-lg'
                                                        : isUnavailable
                                                            ? 'bg-gray-50 dark:bg-[#1a1c23]/50 border-gray-100 dark:border-gray-800 text-gray-300 cursor-not-allowed'
                                                            : 'bg-white dark:bg-[#1a1c23] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary/30'
                                                    }`}
                                                >
                                                    <span className="font-bold text-sm tracking-tight">{slot.displayLabel}</span>
                                                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                        ₹{slot.priceOverride || slot.pricePerHour || currentCourt?.pricePerHour || venue?.price || 0}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Afternoon */}
                            {timeSlots.afternoon.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                        <Sun className="w-4 h-4 text-orange-400 dark:text-orange-300" /> Afternoon
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {timeSlots.afternoon.map(slot => {
                                            const isSelected = selectedSlots.some(s => (s._id || s.id) === (slot._id || slot.id));
                                            const isUnavailable = slot.status !== 'available' || slot.isPast;
                                            return (
                                                <button
                                                    key={slot._id || slot.id}
                                                    disabled={isUnavailable}
                                                    onClick={() => handleSlotClick(slot)}
                                                    className={`py-3 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-0.5 ${
                                                        isSelected
                                                        ? 'bg-primary border-primary text-white shadow-lg'
                                                        : isUnavailable
                                                            ? 'bg-gray-50 dark:bg-[#1a1c23]/50 border-gray-100 dark:border-gray-800 text-gray-300 cursor-not-allowed'
                                                            : 'bg-white dark:bg-[#1a1c23] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <span className="font-bold text-sm tracking-tight">{slot.displayLabel}</span>
                                                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                        ₹{slot.priceOverride || slot.pricePerHour || currentCourt?.pricePerHour || venue?.price || 0}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Evening */}
                            {timeSlots.evening.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                        <Moon className="w-4 h-4 text-blue-500 dark:text-blue-400" /> Evening
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {timeSlots.evening.map(slot => {
                                            const isSelected = selectedSlots.some(s => (s._id || s.id) === (slot._id || slot.id));
                                            const isUnavailable = slot.status !== 'available' || slot.isPast;
                                            return (
                                                <button
                                                    key={slot._id || slot.id}
                                                    disabled={isUnavailable}
                                                    onClick={() => handleSlotClick(slot)}
                                                    className={`py-3 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-0.5 ${
                                                        isSelected
                                                        ? 'bg-primary border-primary text-white shadow-lg'
                                                        : isUnavailable
                                                            ? 'bg-gray-50 dark:bg-[#1a1c23]/50 border-gray-100 dark:border-gray-800 text-gray-300 cursor-not-allowed'
                                                            : 'bg-white dark:bg-[#1a1c23] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <span className="font-bold text-sm tracking-tight">{slot.displayLabel}</span>
                                                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                        ₹{slot.priceOverride || slot.pricePerHour || currentCourt?.pricePerHour || venue?.price || 0}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!fetchingSlots && 
                             timeSlots.morning.length === 0 && 
                             timeSlots.afternoon.length === 0 && 
                             timeSlots.evening.length === 0 && (
                                <div className="flex flex-col items-center py-12 text-gray-400">
                                    <Clock className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="font-bold">No slots available for this date</p>
                                    <p className="text-sm">Try selecting another date or court</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Section: Booking Summary Sidebar */}
                <aside className="w-full lg:w-[450px]">
                    <div className="bg-white dark:bg-[#1a1c23] rounded-3xl p-8 sticky top-28 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-50 dark:border-gray-800 space-y-8">
                        <h2 className="text-2xl font-bold dark:text-white">Booking Summary</h2>
                        
                        <div className="space-y-6">
                            {/* Selected Date Box */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Selected Date</label>
                                <div className="p-5 bg-pink-50/50 dark:bg-pink-950/20 text-primary font-bold rounded-2xl border border-pink-100 dark:border-pink-900/30">
                                    {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>

                            {/* Selected Slot Box */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Selected Slot</label>
                                <div className="p-5 bg-pink-50/50 dark:bg-pink-950/20 text-primary font-bold rounded-2xl border border-pink-100 dark:border-pink-900/30">
                                    {selectedSlots.length > 0 ? selectedSlots.map(s => s.displayLabel).join(', ') : 'No slots selected'}
                                </div>
                            </div>
                        </div>

                        {/* Charges breakdown */}
                        <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Turf Fee (₹{venue?.price || 800})</span>
                                <span className="font-bold dark:text-white">₹{turfFee}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Convenience Fee</span>
                                <span className="font-bold dark:text-white">₹{convenienceFee}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-800">
                                <span className="text-lg font-black dark:text-white">Total Amount</span>
                                <span className="text-2xl font-black text-primary">₹{totalAmount}</span>
                            </div>
                        </div>

                        {/* Pay 50% Switch */}
                        <div className="p-5 bg-pink-50/30 dark:bg-pink-950/10 rounded-2xl flex items-center justify-between border border-pink-100/50 dark:border-pink-900/20 group cursor-pointer" onClick={() => setIsAdvancePay(!isAdvancePay)}>
                            <div>
                                <h4 className="text-sm font-bold dark:text-white mb-0.5">Pay 50% Advance</h4>
                                <p className="text-[10px] text-gray-400 font-medium">Secure booking with ₹{totalAmount / 2}</p>
                            </div>
                            <div className={`w-11 h-6 rounded-full p-1 transition-all ${isAdvancePay ? 'bg-primary' : 'bg-gray-300'} relative`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-all ${isAdvancePay ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        <button 
                            disabled={reserving || selectedSlots.length === 0}
                            className={`w-full py-5 text-white rounded-2xl font-black text-[15px] shadow-xl transition-all uppercase tracking-wider mt-4 flex items-center justify-center gap-3 ${
                                selectedSlots.length === 0 || reserving
                                ? 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed'
                                : 'bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                            onClick={handleBooking}
                        >
                            {reserving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Reserving...
                                </>
                            ) : 'Continue to Payment'}
                        </button>

                        <p className="text-[11px] text-gray-400 text-center font-medium">
                            Cancellation policy applies • Secure checkout
                        </p>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default BookingSlotPage;
