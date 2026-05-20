import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, ChevronRight, Sun, Moon, Clock, Info, Check, Minus, Plus, ChevronLeft, Shield, MoonStar, MoonIcon, SunMoon } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import SEO from '../components/SEO';
import LoadingScreen from '../components/LoadingScreen';
import { getTurfDetails, getAvailableSlots, reserveSlots } from '../services/turfService';
import { useAuth } from '../context/AuthContext';
import EmailPrompt from '../components/EmailPrompt';

const toast = {
    error: (msg) => alert(`Error: ${msg}`),
    success: (msg) => alert(`Success: ${msg}`)
};

const BookingSlotPage = () => {
    const { turfId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [venue, setVenue] = useState(location.state?.sport || null);
    const [loading, setLoading] = useState(!venue);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [reserving, setReserving] = useState(false);
    
    // Selection states
    const [selectedSport, setSelectedSport] = useState('Swimming');
    const [selectedCourt, setSelectedCourt] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [duration, setDuration] = useState(1);
    const [slotCount, setSlotCount] = useState(1);
    const [peopleCount, setPeopleCount] = useState(1);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [spotType, setSpotType] = useState('Outdoor');
    const [isAdvancePay, setIsAdvancePay] = useState(true);
    const [timeSlots, setTimeSlots] = useState({ morning: [], afternoon: [], evening: [] });
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const { user, isAuthenticated, ensureAuthAndEmail } = useAuth();

    const isSwimming = venue?.tags?.some(tag => tag.toLowerCase().includes('swimming') || tag.toLowerCase().includes('pool')) || 
                      venue?.name?.toLowerCase().includes('swimming') || venue?.name?.toLowerCase().includes('pool');

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

    useEffect(() => {
        const fetchDetails = async () => {
            if (!venue && turfId) {
                setLoading(true);
                const data = await getTurfDetails(turfId);
                if (data) {
                    setVenue(data);
                    const firstCourt = data.courts?.[0];
                    if (firstCourt) {
                        setSelectedCourt(firstCourt._id || firstCourt.id);
                        setSelectedSport(firstCourt.sportTypes?.[0] || (isSwimming ? 'Swimming' : 'Football'));
                    }
                }
                setLoading(false);
            } else if (venue) {
                const firstCourt = venue.courts?.[0];
                if (firstCourt) {
                    setSelectedCourt(firstCourt._id || firstCourt.id);
                    setSelectedSport(firstCourt.sportTypes?.[0] || (isSwimming ? 'Swimming' : 'Football'));
                }
            }
        };
        fetchDetails();
    }, [turfId]);

    const allAvailableSlots = useMemo(() => {
        const flat = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
        return flat.sort((a, b) => {
            const timeToMinutes = (timeStr) => {
                if (!timeStr) return 0;
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + (m || 0);
            };
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        });
    }, [timeSlots]);

    const getConsecutiveSlots = (startSlot, count) => {
        const startIndex = allAvailableSlots.findIndex(s => (s._id || s.id) === (startSlot._id || startSlot.id));
        if (startIndex === -1) return { error: false, slots: [] };
        
        const selected = [allAvailableSlots[startIndex]];
        for (let i = 1; i < count; i++) {
            const nextSlot = allAvailableSlots[startIndex + i];
            if (nextSlot && nextSlot.status === 'available' && !nextSlot.isPast) {
                selected.push(nextSlot);
            } else {
                return { error: true, slots: selected };
            }
        }
        return { error: false, slots: selected };
    };

    useEffect(() => {
        if (selectedCourt && selectedDate) {
            setSelectedSlots([]);
            const fetchSlots = async () => {
                setFetchingSlots(true);
                const slots = await getAvailableSlots(selectedCourt, selectedDate);
                const categorized = { morning: [], afternoon: [], evening: [] };
                slots.forEach(s => {
                    const startTime = s.startTime || '';
                    if (!startTime) return;
                    const hour = parseInt(startTime.split(':')[0]);
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

    const handleSlotClick = (slotObj) => {
        if (slotObj.status !== 'available' || slotObj.isPast) return;
        
        const { error, slots } = getConsecutiveSlots(slotObj, slotCount);
        if (error) {
            setWarningMessage("There is not slot after your selected time so please choose before slots");
            setShowWarningModal(true);
        }
        setSelectedSlots(slots);
    };

    const updateSlotCount = (delta) => {
        const newCount = Math.max(1, slotCount + delta);
        if (selectedSlots.length > 0) {
            const startSlot = selectedSlots[0];
            const { error, slots } = getConsecutiveSlots(startSlot, newCount);
            if (error && delta > 0) {
                setWarningMessage("There is not slot after your selected time so please choose before slots");
                setShowWarningModal(true);
                return;
            }
            setSelectedSlots(slots);
        }
        setSlotCount(newCount);
    };

    const handleBooking = async () => {
        if (selectedSlots.length === 0) {
            toast.error('Please select at least one slot');
            return;
        }

        const canProceed = ensureAuthAndEmail(() => handleBooking());
        if (!canProceed) return false;
        try {
            setReserving(true);
            const slotIds = selectedSlots.map(s => s._id || s.id);
            const result = await reserveSlots(slotIds, selectedSport);
            if (result) {
                navigate('/activities/payment', { 
                    state: { 
                        reservation: result,
                        turf: venue,
                        court: currentCourt,
                        sport: selectedSport,
                        date: selectedDate,
                        slotCount,
                        peopleCount,
                        spotType
                    } 
                });
            } else {
                toast.error('Could not reserve slots.');
            }
        } catch (error) {
            toast.error('Something went wrong.');
        } finally {
            setReserving(false);
        }
    };

    const currentCourt = venue?.courts?.find(c => (c._id || c.id) === selectedCourt);
    // Pricing logic: slots * individual price, potentially multiplied by people for swimming
    const baseTurfFee = selectedSlots.reduce((sum, s) => sum + (s.priceOverride || s.pricePerHour || currentCourt?.pricePerHour || venue?.price || 0), 0);
    const turfFee = isSwimming ? (baseTurfFee * peopleCount) : baseTurfFee;
    const convenienceFee = selectedSlots.length > 0 ? Math.round((turfFee * (venue?.convenienceFeePercent || 0)) / 100) : 0;
    const totalAmount = Math.max(0, Math.round(turfFee + convenienceFee));

    const hasNoSlots = !fetchingSlots && 
                      timeSlots.morning.length === 0 && 
                      timeSlots.afternoon.length === 0 && 
                      timeSlots.evening.length === 0;

    if (loading) return <LoadingScreen message="Initialising Booking..." />;

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0f1115] pb-24">
            <SEO title={`Book Slots - ${venue?.name || 'Venue'}`} />

            {/* Header matches Figma style */}
            <header className="bg-white dark:bg-[#1a1c23] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 md:h-20 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                        <ArrowLeft className="w-6 h-6 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold dark:text-white leading-tight">{venue?.name || 'Elite Arena Pro'}</h1>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[13px] font-medium">{venue?.venue || venue?.city}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-12">
                <div className="flex-1 space-y-12">
                    {isSwimming && (
                        <>
                            {/* Select Spot Toggle */}
                            <section className="space-y-4">
                                <h2 className="text-xl font-bold dark:text-white">Select spot</h2>
                                <div className="flex gap-4">
                                    {['Indoor', 'Outdoor'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSpotType(type)}
                                            className={`flex-1 max-w-[200px] py-4 rounded-xl font-bold transition-all border ${
                                                spotType === type 
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' 
                                                : 'bg-white dark:bg-[#1a1c23] border-gray-100 dark:border-gray-800 text-gray-500'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Number of People Counter */}
                            <section className="space-y-4">
                                <div className="p-6 bg-[#F5F7FF] dark:bg-blue-950/20 rounded-[24px] flex items-center justify-between border border-blue-50/50 dark:border-blue-900/30">
                                    <div>
                                        <h2 className="text-lg font-bold dark:text-white">Number of People</h2>
                                        <p className="text-xs text-gray-400 font-medium">How many guests are coming with you?</p>
                                    </div>
                                    <div className="flex items-center gap-5 bg-white dark:bg-[#1a1c23] p-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <button 
                                            onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-all"
                                        >
                                            <Minus className="w-4 h-4 text-primary" />
                                        </button>
                                        <span className="text-lg font-bold dark:text-white w-4 text-center">{peopleCount}</span>
                                        <button 
                                            onClick={() => setPeopleCount(peopleCount + 1)}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {!isSwimming && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold dark:text-white">Select sport</h2>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {(currentCourt?.sportTypes || ['Football']).map(sport => (
                                    <button
                                        key={sport}
                                        onClick={() => setSelectedSport(sport)}
                                        className={`px-8 py-4 rounded-xl font-bold whitespace-nowrap transition-all ${
                                            selectedSport === sport ? 'bg-primary text-white' : 'bg-white dark:bg-[#1a1c23] border border-gray-100 dark:border-gray-800 text-gray-500'
                                        }`}
                                    >
                                        {sport}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Date Selection */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold dark:text-white">Select Date</h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {dates.map(d => (
                                <button
                                    key={d.full}
                                    onClick={() => setSelectedDate(d.full)}
                                    className={`flex flex-col items-center justify-center min-w-[90px] py-4 rounded-2xl transition-all border ${
                                        selectedDate === d.full 
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10' 
                                        : 'bg-white dark:bg-[#1a1c23] border-gray-100 dark:border-gray-800'
                                    }`}
                                >
                                    <span className={`text-xs font-bold mb-1 ${selectedDate === d.full ? 'text-white/80' : 'text-gray-400'}`}>
                                        {d.isToday ? 'Today' : d.isTomorrow ? 'Tomorrow' : d.day}
                                    </span>
                                    <span className="text-base font-bold">{d.month} {d.date}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Slot Selection with Guest Count */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold dark:text-white">Select Slot</h2>
                            <div className="flex items-center gap-4">
                                {/* <div className="text-[12px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 flex items-center gap-2">
                                    {selectedSlots.length > 0 ? selectedSlots[0].displayLabel : '08:00 AM - 09:00 AM'}
                                </div> */}
                                <div className="flex items-center gap-4 bg-white dark:bg-[#1a1c23] p-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <button 
                                        onClick={() => updateSlotCount(-1)}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="Decrease slots"
                                    >
                                        <Minus className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                                    </button>
                                    <span className="text-base font-bold dark:text-white min-w-[75px] text-center">
                                        {slotCount} Slot{slotCount !== 1 ? 's' : ''}
                                    </span>
                                    <button 
                                        onClick={() => updateSlotCount(1)}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white hover:brightness-110 transition-all"
                                        title="Increase slots"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {fetchingSlots ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Finding Slots...</p>
                                </div>
                            ) : hasNoSlots ? (
                                <div className="p-12 bg-white dark:bg-[#1a1c23] rounded-[32px] border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                        <Clock className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold dark:text-white">No Slots Available</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                                            There is no available slot on <span className="text-primary font-black">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>. Please check the next date.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                ['morning', 'afternoon', 'evening'].map(period => (
                                    timeSlots[period].length > 0 && (
                                        <div key={period} className="space-y-4">
                                            <div className="flex items-center gap-2 text-gray-400 font-bold text-[13px] uppercase tracking-widest">
                                                {period === 'morning' ? <SunMoon className="w-4 h-4 text-yellow-400" /> : period === 'afternoon' ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                                                {period}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {timeSlots[period].map(slot => {
                                                    const isSelected = selectedSlots.some(s => (s._id || s.id) === (slot._id || slot.id));
                                                    const isUnavailable = slot.status !== 'available' || slot.isPast;
                                                    const slotPrice = slot.priceOverride || slot.pricePerHour || currentCourt?.pricePerHour || venue?.price || 400;
                                                    return (
                                                        <button
                                                            key={slot._id || slot.id}
                                                            disabled={isUnavailable}
                                                            onClick={() => handleSlotClick(slot)}
                                                            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border flex flex-col items-center justify-center gap-1.5 ${isSelected ? 'bg-primary border-primary text-white shadow-lg' :
                                                                isUnavailable ? 'bg-gray-50 text-gray-300 dark:bg-gray-900 dark:text-gray-700 cursor-not-allowed border-gray-50' :
                                                                    'bg-white dark:bg-[#1a1c23] border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                                                                }`}
                                                        >
                                                            <span className="text-[13px] font-black">{slot.displayLabel}</span>
                                                            <span className={`text-[11px] font-black ${isSelected ? 'text-white/90' : 'text-primary'}`}>
                                                                ₹{slotPrice}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar Summary Section matches Figma */}
                <aside className="w-full lg:w-[450px]">
                    <div className="bg-white dark:bg-[#1a1c23] rounded-[32px] p-8 sticky top-28 shadow-xl border border-gray-50 dark:border-gray-800 space-y-8">
                        <h2 className="text-2xl font-bold dark:text-white">Booking Summary</h2>
                        
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-50 dark:border-gray-800">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-primary">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold dark:text-white">{isSwimming ? (selectedSlots[0]?.displayLabel?.includes('AM') ? 'Morning Swim' : 'Afternoon Swim') : 'Turf Session'}</h3>
                                <p className="text-sm text-gray-400 font-medium">
                                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} • {selectedSlots[0]?.displayLabel || '--:--'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">
                                    Base Price ({slotCount} slot{slotCount !== 1 ? 's' : ''} {isSwimming ? `× ${peopleCount} guests` : ''})
                                </span>
                                <span className="font-bold dark:text-white">₹{turfFee}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Platform Fee</span>
                                <span className="font-bold dark:text-white">₹{convenienceFee}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <span className="text-xl font-bold dark:text-white">Total Payable</span>
                                <span className="text-2xl font-black text-primary">₹{totalAmount}</span>
                            </div>
                        </div>

                        {/* <div className="p-5 bg-[#F5F7FF] dark:bg-blue-950/10 rounded-2xl flex items-center justify-between border border-blue-50/50 dark:border-blue-900/20">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${isAdvancePay ? 'bg-primary' : 'bg-gray-300'}`} onClick={() => setIsAdvancePay(!isAdvancePay)}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${isAdvancePay ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold dark:text-white">Pay 50% Advance</h4>
                                    <p className="text-[10px] text-gray-400 font-medium tracking-tight">Secure booking with ₹{totalAmount / 2}</p>
                                </div>
                            </div>
                            <Info className="w-4 h-4 text-gray-300" />
                        </div> */}

                        <button 
                            disabled={reserving || selectedSlots.length === 0}
                            onClick={handleBooking}
                            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest disabled:bg-gray-200 disabled:shadow-gray-300 disabled:dark:shadow-gray-900 disabled:dark:bg-gray-800 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {reserving ? 'Processing...' : 'Continue to Payment'}
                        </button>
                        
                        <p className="text-[11px] text-gray-400 text-center font-medium">Cancellation policy applies • Secure checkout</p>
                    </div>
                </aside>
            </main>

            {/* Warning Modal */}
            {showWarningModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#1a1c23] w-full max-w-sm rounded-[32px] p-8 shadow-2xl scale-in-center animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Info className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-center dark:text-white mb-2">Slot Unavailable</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm leading-relaxed mb-8">
                            {warningMessage}
                        </p>
                        <button 
                            onClick={() => setShowWarningModal(false)}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all uppercase tracking-widest text-sm"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingSlotPage;
