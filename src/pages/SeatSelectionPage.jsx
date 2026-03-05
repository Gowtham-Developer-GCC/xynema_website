
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, Info, Armchair, Accessibility, Ticket, ChevronRight, Clapperboard, Film, MapPin, Clock, AlertCircle, X, Pencil, Bike, Car, Truck, Bus } from 'lucide-react';
import SEO from '../components/SEO';
import { getSeats, lockSeats, releaseSeats } from '../services/bookingService';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import NotFoundState from '../components/NotFoundState';
import bookingSessionManager from '../utils/bookingSessionManager';

const SeatSelectionPage = () => {
    const { slug, theaterSlug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { state } = useLocation();

    const showId = sessionStorage.getItem('booking_show_id');
    const theaterName = sessionStorage.getItem('booking_theater_name');
    const theaterId = state?.theaterId || searchParams.get('theaterId');
    const movieId = state?.movieId || searchParams.get('movieId');

    useEffect(() => {
        if (!showId || !theaterSlug) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
        }
    }, [showId, theaterSlug, slug, navigate]);

    const [seats, setSeats] = useState([]);
    const [layout, setLayout] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [show, setShow] = useState(null);
    const [toast, setToast] = useState(null);
    const [numSeatsToSelect, setNumSeatsToSelect] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasProceededRef = useRef(false);
    const selectedSeatsRef = useRef([]);
    const containerRef = useRef(null);
    const releaseTimeoutRef = useRef(null);

    useEffect(() => {
        selectedSeatsRef.current = selectedSeats;
        // Auto-trim selection if seat count limit is reduced
        if (selectedSeats.length > numSeatsToSelect) {
            setSelectedSeats(prev => prev.slice(0, numSeatsToSelect));
        }
    }, [selectedSeats, numSeatsToSelect]);

    useEffect(() => {
        const fetchSeats = async () => {
            try {
                setLoading(true);

                const urlSeats = searchParams.get('seats')?.split(',');
                if (urlSeats && urlSeats.length > 0) {
                    releaseSeats(showId, urlSeats).catch(() => { });
                }
                try {
                    const pendingLock = sessionStorage.getItem('pending_seat_lock');
                    if (pendingLock) {
                        const { showId: lockedShowId, seats: lockedSeats } = JSON.parse(pendingLock);
                        if (lockedSeats && lockedSeats.length > 0) {
                            releaseSeats(lockedShowId || showId, lockedSeats).catch(() => { });
                        }
                        sessionStorage.removeItem('pending_seat_lock');
                    }
                } catch (err) {
                    console.error('Session storage release error:', err);
                }

                const response = await getSeats(showId);
                setShow(response.data.show);
                setSeats(response.data.seats || []);
                const screenLayout = response.data.layout || response.data.show?.screen?.layout || response.data.show?.screen?.screenId?.layout;

                setLayout(screenLayout);
                setIsModalOpen(true);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (showId) fetchSeats();

        // Clear any pending release on remount (Fix for React Strict Mode)
        if (releaseTimeoutRef.current) {
            clearTimeout(releaseTimeoutRef.current);
            releaseTimeoutRef.current = null;
        }

        return () => {
            // Only release if we've selected something and haven't proceeded
            if (!hasProceededRef.current && showId && selectedSeatsRef.current.length > 0) {
                releaseTimeoutRef.current = setTimeout(() => {
                    releaseSeats(showId, selectedSeatsRef.current).catch(() => { });
                }, 500); // 500ms grace period for remounts
            }
        };
    }, [showId]);

    const handleSeatSelect = (seatId) => {
        const seat = seats.find(s => (s.id || s._id) === seatId);
        if (!seat || seat.isBooked || seat.isLocked || !seat.isAvailable) {
            showToast('Seat is already booked or unavailable', 'error');
            return;
        }

        // 1. If seat is already selected -> Deselect JUST this one (Flexible Modification)
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
            return;
        }

        // 2. If seat is NEW -> Perform Batch Auto-Selection
        const { row, column } = seat.position;
        const newBatch = [];
        let currentSeats = [...selectedSeats];

        // If we are already at or above limit, reset selection for a fresh batch (Batch Replacement)
        if (currentSeats.length >= numSeatsToSelect) {
            currentSeats = [];
        }

        const remainingCount = numSeatsToSelect - currentSeats.length;

        // Find consecutive available seats in the same row starting from this one
        for (let c = column; newBatch.length < remainingCount; c++) {
            const nextSeat = seats.find(s =>
                s.position.row === row &&
                s.position.column === c &&
                s.isAvailable && !s.isBooked && !s.isLocked
            );

            // Break if we hit a gap, a booked seat, or a different row (consecutive check)
            if (!nextSeat) break;

            // Only add if not already in the overall selection
            if (!currentSeats.includes(nextSeat.id || nextSeat._id)) {
                newBatch.push(nextSeat.id || nextSeat._id);
            }
        }

        if (newBatch.length > 0) {
            setSelectedSeats([...currentSeats, ...newBatch]);
        }
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const calculateTotalPrice = () => {
        return selectedSeats.reduce((total, seatId) => {
            const seat = seats.find(s => (s.id || s._id) === seatId);
            return total + (seat?.basePrice || 250);
        }, 0);
    };

    const handleProceedToFood = async () => {
        if (selectedSeats.length === 0) {
            showToast('Please select your seats', 'warning');
            return;
        }

        try {
            setLoading(true);
            const sessionId = await lockSeats(showId, selectedSeats);
            if (sessionId) {
                sessionStorage.setItem('pending_seat_lock', JSON.stringify({
                    showId,
                    seats: selectedSeats,
                    timestamp: Date.now()
                }));

                // Persist booking session for retrieval in Food/Payment pages
                const draftBooking = {
                    movieId: show?.movie?.id || show?.movie?._id || movieId,
                    movieSlug: slug,
                    theaterId: show?.theatre?.id || show?.theatre?._id || theaterId,
                    showId,
                    seats: selectedSeats,
                    date: show?.date,
                    sessionId,
                    timestamp: Date.now()
                };
                sessionStorage.setItem(`booking_draft_${showId}`, JSON.stringify(draftBooking));
                sessionStorage.setItem('pending_seat_lock', JSON.stringify({ showId, seats: selectedSeats }));

                hasProceededRef.current = true;
                navigate(`/movie/${slug}/${theaterSlug}/food`);
            } else {
                throw new Error('Could not lock seats');
            }
        } catch (error) {
            showToast(error.message || 'Selected seats were just taken! Refreshing...', 'error');
            setSelectedSeats([]);
            const response = await getSeats(showId);
            if (response.success) setSeats(response.data.seats || []);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen message="Scanning Layout" />;
    if (error) return <ErrorState error={error} title="Issue Detected" buttonText="TRY AGAIN" />;
    if (!show || !showId) return <NotFoundState title="Show Not Found" message="We couldn't find the showtime you're looking for." />;

    return (
        <div className="min-h-screen bg-[#F5F5FA]">
            <SEO title="Select Seats - XYNEMA" description="Choose your preferred movie seats" />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {isModalOpen && (
                <SeatCountModal
                    value={numSeatsToSelect}
                    onChange={setNumSeatsToSelect}
                    onConfirm={() => setIsModalOpen(false)}
                />
            )}

            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex-1 mx-6 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                                {show?.movie?.title}
                            </h1>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {show?.theatre?.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-xynemaRose" />
                                <span className="text-[10px] font-black text-xynemaRose uppercase tracking-widest">
                                    {show?.startTime}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Ticket className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {new Date(state?.date || searchParams.get('date') || show?.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50">
                        <Info className="w-4 h-4 text-gray-300" />
                    </div>
                </div>
            </header>

            {/* Show Overview Bar */}


            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Legend - Moved to Top */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8 max-w-3xl mx-auto">
                    {/* Row 1: Types */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 group">
                            <Armchair className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recliner</span>
                        </div>
                        <div className="flex items-center gap-2 group">
                            <Accessibility className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Disabled</span>
                        </div>
                    </div>

                    {/* Divider (Desktop Only) */}
                    <div className="hidden md:block w-px h-4 bg-gray-200" />

                    {/* Row 2: Status */}
                    <div className="flex items-center gap-4">
                        <LegendItem color="bg-white border border-green-500 shadow-sm shadow-green-200" label="Available" />
                        <LegendItem color="bg-green-500 text-white shadow-sm shadow-green-200" label="Selected" />
                        <LegendItem color="bg-gray-100 text-gray-300 border border-gray-200" label="Sold" />
                    </div>
                </div>

                <div className="w-full overflow-hidden flex flex-col items-center">
                    <div className="w-full overflow-auto no-scrollbar curve-container pb-32 px-4" ref={containerRef}>
                        <div className="min-w-fit mx-auto pl-8 pr-8">
                            <SeatLayout
                                layout={layout}
                                seats={seats}
                                selectedSeats={selectedSeats}
                                onSelectSeat={handleSeatSelect}
                                seatClasses={show?.screen?.screenId?.seatClasses}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#F5F5FA]/80 backdrop-blur-md border-t border-gray-100 p-4 md:p-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            {selectedSeats.length} / {numSeatsToSelect} SEATS
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-[9px] text-xynemaRose bg-white border px-2 py-0.5 rounded hover:bg-xynemaRose hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Pencil className="w-2.5 h-2.5" />
                                EDIT SEATS
                            </button>
                        </p>
                        <p className="text-2xl font-black text-xynemaRose">
                            ₹{calculateTotalPrice().toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={handleProceedToFood}
                        disabled={selectedSeats.length !== numSeatsToSelect}
                        className="px-14 py-4 rounded-xl bg-xynemaRose text-white font-black text-sm uppercase disabled:bg-gray-200"
                    >
                        Pay Now
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <SeatCountModal
                    value={numSeatsToSelect}
                    onChange={setNumSeatsToSelect}
                    onConfirm={() => {
                        setIsModalOpen(false);
                        setSelectedSeats([]); // Reset selection when count changes
                    }}
                    seatClasses={show?.screen?.screenId?.seatClasses}
                    seats={seats}
                />
            )}
        </div >
    );
};

const SeatCountModal = ({ value, onChange, onConfirm, seatClasses, seats }) => {
    // Dynamic vehicle asset based on count
    const getVehicleImage = (count) => {
        const vehicles = {
            1: "bicycle",
            2: "scooter",
            3: "auto",
            4: "car",
            5: "sedan",
            6: "suv",
            7: "van",
            8: "tempo",
            9: "minibus",
            10: "bus"
        };
        return `/assets/vehicles/${vehicles[count] || "scooter"}.png`;
    };

    // Robust Pricing Logic: Use prop or derive from seats
    const displayClasses = (seatClasses && seatClasses.length > 0)
        ? seatClasses
        : (() => {
            if (!seats || seats.length === 0) return [];
            const unique = new Map();
            seats.forEach(s => {
                // Determine class name (try deep nested, then type, then fallback)
                let name = s.seatClass?.name;
                if (!name && typeof s.seatClass === 'string') name = 'Standard'; // ID only
                if (!name) name = s.seatType || s.type || 'Standard';

                const price = s.basePrice || 0;
                const key = `${name}-${price}`;

                if (!unique.has(key)) {
                    unique.set(key, {
                        id: key,
                        name: name.toUpperCase(),
                        price: price,
                        status: 'AVAILABLE'
                    });
                }
            });
            // Sort by price descending (Diamond usually > Gold)
            return Array.from(unique.values()).sort((a, b) => b.price - a.price);
        })();

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
            <div className="relative w-full max-w-xl bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col items-center">

                <h3 className="text-lg font-bold text-gray-900 mb-6">How many seats?</h3>

                {/* Dynamic Asset */}
                <div className="mb-8 h-32 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                    <img
                        src={getVehicleImage(value)}
                        alt="Vehicle"
                        className="h-full w-auto object-contain drop-shadow-xl"
                    />
                </div>

                {/* Number Selector */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button
                            key={n}
                            onClick={() => onChange(n)}
                            className={`
                                w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center transition-all duration-200
                                ${value === n
                                    ? 'bg-xynemaRose text-white shadow-lg scale-110'
                                    : 'bg-transparent text-gray-900 hover:font-bold hover:scale-110'}
                            `}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                {/* Pricing Info */}
                <div className="w-full border-t border-gray-100 pt-6 mb-6 flex justify-around gap-4">
                    {displayClasses.map((cls) => (
                        <div key={cls.id || cls._id || cls.name} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{cls.name}</span>
                            <span className="text-base font-black text-gray-900">₹{cls.price}</span>
                            <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest mt-1">AVAILABLE</span>
                        </div>
                    ))}
                    {displayClasses.length === 0 && (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">STANDARD</span>
                            <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-1">FILLING FAST</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onConfirm}
                    className="w-full py-4 rounded-xl bg-xynemaRose text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all active:scale-95"
                >
                    Select Seats
                </button>
            </div>
        </div>
    );
};

const CurvedScreen = () => (
    <div className="w-full max-w-[500px] mx-auto mt-20 mb-12 flex flex-col items-center">
        {/* Screen Object matching the image */}
        <div className="relative w-full h-12 perspective-[1000px]">
            {/* Top/Front Face */}
            <div
                className="w-full h-full bg-blue-100 border-2 border-blue-400 shadow-[0_0_20px_rgba(56,189,248,0.4)] relative overflow-hidden"
                style={{
                    transform: 'perspective(400px) rotateX(20deg) scale(0.9)',
                    borderRadius: '4px',
                    boxShadow: '0 10px 40px -5px rgba(56, 189, 248, 0.4)'
                }}
            >
                {/* Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent" />
            </div>
        </div>

        <p className="mt-4 text-xs font-semibold text-gray-400 tracking-wide opacity-80">
            All eyes this way please
        </p>
    </div>
);

const LegendItem = ({ color, label, isBorder, isDynamicColor }) => (
    <div className="flex items-center gap-3 group">
        <div
            className={`w-3.5 h-3.5 rounded-md transition-transform group-hover:scale-110 shadow-sm ${!isDynamicColor ? color : ''}`}
            style={isDynamicColor ? { backgroundColor: color } : {}}
        />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">{label}</span>
    </div>
);

const SeatLayout = ({ layout, seats, selectedSeats, onSelectSeat, seatClasses }) => {
    if (!layout || !seats) return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <Loader className="w-10 h-10 text-xynemaRose animate-spin opacity-20" />
            <div className="text-gray-300 text-sm font-bold tracking-widest uppercase opacity-40">Scanning Layout...</div>
        </div>
    );

    const { rows, columns, rowLabels, seatLayout } = layout;

    const getSeatAt = (r, c) => {
        return seats.find(s => s.position.row === r && s.position.column === c);
    };

    let lastType = null;
    let lastPrice = null;

    const rowIndices = Array.from({ length: rows }, (_, i) => i);
    const colIndices = Array.from({ length: columns }, (_, i) => i);

    return (
        <div className="flex flex-col items-center space-y-2 lg:space-y-3 pb-0">
            {rowIndices.map((r) => {
                const rowLabel = rowLabels[r] || '';

                // Find first valid seat in this row to determine type/price section
                let firstSeatInRow = null;
                let firstLayoutSeatInRow = null;
                for (let c = 0; c < columns; c++) {
                    const s = getSeatAt(r, c);
                    if (s) {
                        firstSeatInRow = s;
                        firstLayoutSeatInRow = seatLayout?.[r]?.[c];
                        break;
                    }
                }

                const showHeader = firstSeatInRow && (
                    (firstSeatInRow.seatType || firstSeatInRow.type) !== lastType ||
                    firstSeatInRow.basePrice !== lastPrice
                );

                if (showHeader) {
                    lastType = firstSeatInRow.seatType || firstSeatInRow.type;
                    lastPrice = firstSeatInRow.basePrice;
                }

                // Header Logic
                let headerText = '';
                if (showHeader) {
                    // Try to find class name from seat object or look it up
                    let className = firstSeatInRow?.seatClass?.name;

                    if (!className && seatClasses) {
                        let seatClassId = firstSeatInRow.seatClass?.id || firstSeatInRow.seatClass?._id;

                        // Handle unpopulated seatClass (string or number ID)
                        if (!seatClassId && firstSeatInRow.seatClass && typeof firstSeatInRow.seatClass !== 'object') {
                            seatClassId = firstSeatInRow.seatClass;
                        }

                        // Fallback to explicit classId on seat or layout data
                        if (!seatClassId) {
                            seatClassId = firstSeatInRow.classId || firstLayoutSeatInRow?.classId;
                        }

                        // Use loose equality (==) to handle string/number ID mismatches
                        const cls = seatClasses.find(sc => sc.id == seatClassId || sc._id == seatClassId);
                        if (cls) className = cls.name;
                    }

                    if (!className) className = "UNKNOWN" // Fallback

                    headerText = `₹${firstSeatInRow.basePrice} ${className?.toUpperCase()} `;
                }

                return (
                    <div key={`row-${r}`} className="w-full flex flex-col items-center">
                        {showHeader && (
                            <div className="flex items-center gap-3 mt-6 mb-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">
                                    {headerText}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-4 md:gap-6">
                            <span className="w-6 text-gray-500 font-black text-[10px] text-right">{rowLabel}</span>
                            <div className="flex gap-1.5 lg:gap-2">
                                {colIndices.map((c) => {
                                    const seat = getSeatAt(r, c);
                                    // Get the visual layout object for this cell
                                    const layoutSeat = seatLayout?.[r]?.[c];

                                    // If no layout data or it's empty space, treat as gap
                                    if (!layoutSeat || layoutSeat.type === 'empty' || layoutSeat.type === 'path' || layoutSeat.type === 'aisle') {
                                        return <div key={`gap-${r}-${c}`} className="w-8 h-8 md:w-9 md:h-9" />;
                                    }

                                    const seatId = seat?.id || seat?._id || layoutSeat._id;
                                    const isSelected = selectedSeats.includes(seatId);
                                    const isUnavailable = seat
                                        ? (seat.isBooked || seat.isLocked || !seat.isAvailable)
                                        : (layoutSeat.type === 'disabled');

                                    // Determine seat type
                                    const seatType = seat?.seatType || layoutSeat.type || 'normal';

                                    // Determine color
                                    // User requested "no need different colored" - implying uniform color theme.
                                    // We'll use a standard green for available/selected to match the "clean" aesthetic.
                                    // The differentiation comes from the layout sections (headers) and icons.
                                    const seatColor = '#22c55e'; // Standard Green

                                    // Determine styles
                                    let buttonStyle = {};
                                    if (isUnavailable) {
                                        buttonStyle = {
                                            backgroundColor: '#e5e7eb', // gray-200
                                            borderColor: 'transparent',
                                            color: '#9ca3af' // gray-400
                                        };
                                    } else if (isSelected) {
                                        buttonStyle = {
                                            backgroundColor: seatColor,
                                            borderColor: seatColor,
                                            color: '#ffffff'
                                        };
                                    } else {
                                        // Available: Outline
                                        buttonStyle = {
                                            backgroundColor: '#ffffff',
                                            borderColor: seatColor,
                                            color: seatColor
                                        };
                                    }

                                    // Accessible Label - Descriptive and clear for screen readers
                                    const seatName = `${rowLabel}${seat?.seatNumber || c}`;
                                    const ariaLabel = `Seat ${seatName}, ${seat?.seatType || 'Standard'}, ₹${seat?.basePrice || ''}, ${isUnavailable ? 'Sold Out' : isSelected ? 'Selected' : 'Available'}`;

                                    return (
                                        <button
                                            key={seatId}
                                            disabled={isUnavailable}
                                            onClick={() => (seat || layoutSeat) && onSelectSeat(seatId)}
                                            style={buttonStyle}
                                            aria-label={ariaLabel}
                                            aria-pressed={isSelected}
                                            className={`w-8 h-8 md:w-9 md:h-9 rounded-lg text-[10px] font-black flex items-center justify-center border transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isUnavailable
                                                ? 'cursor-not-allowed opacity-40'
                                                : isSelected
                                                    ? 'shadow-xl shadow-green-100 transform scale-105 z-10'
                                                    : 'hover:shadow-lg hover:scale-105 hover:z-10'
                                                }`}
                                        >
                                            {seatType === 'recliner' ? (
                                                <Armchair className="w-4 h-4" />
                                            ) : seatType === 'disabled' ? (
                                                <Accessibility className="w-4 h-4" />
                                            ) : (
                                                <span>{seat?.seatNumber || layoutSeat?._id?.split('-')?.pop() || c}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <span className="w-6 text-gray-500 font-black text-[10px] text-right">{rowLabel}</span>
                        </div>
                    </div>
                );
            })}

            <CurvedScreen />
        </div >
    );
};

// LoadingState replaced by global LoadingScreen

const Toast = ({ message, type, onClose }) => (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-500 ${type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
        {type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        <span className="text-xs font-black uppercase tracking-wider">{message}</span>
        <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
    </div>
);

// ErrorState removed - imported from components

export default SeatSelectionPage;
