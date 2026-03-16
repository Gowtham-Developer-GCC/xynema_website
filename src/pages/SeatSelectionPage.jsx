import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Ticket, Info, ChevronRight, Users, AlertCircle, X, ChevronLeft, Settings, Accessibility, Armchair } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import SEO from '../components/SEO';
import { getSeats, releaseSeats, getShowSeats } from '../services/bookingService';
import LoadingScreen from '../components/LoadingScreen';
import SeatLayout from '../components/SeatSelection/SeatLayout';
import BookingSummary from '../components/SeatSelection/BookingSummary';
import SeatCountModal from '../components/SeatSelection/SeatCountModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ErrorState from '../components/ErrorState';
import NotFoundState from '../components/NotFoundState';
import { useData } from '../context/DataContext';
import apiCacheManager from '../services/apiCacheManager';

const Toast = ({ message, type, onClose }) => (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-500 ${type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
        {type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        <span className="text-xs font-black uppercase tracking-wider">{message}</span>
        <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
    </div>
);

const SeatSelectionPage = () => {
    const { slug, theaterSlug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { getMovieById } = useData();

    const showId = sessionStorage.getItem('booking_show_id');
    const theaterId = state?.theaterId || searchParams.get('theaterId');
    const movieId = state?.movieId || searchParams.get('movieId');

    // Fallback display values from sessionStorage (set during movie/theater selection steps)
    const movieTitle = state?.movieTitle || sessionStorage.getItem('booking_movie_title') || '';
    const moviePoster = state?.moviePoster || sessionStorage.getItem('booking_movie_poster') || '';
    const theaterName = state?.theaterName || sessionStorage.getItem('booking_theater_name') || 'Unknown Theatre';
    const showDate = state?.date || searchParams.get('date') || sessionStorage.getItem('booking_show_date') || '';
    const startTime = state?.startTime || sessionStorage.getItem('booking_show_time') || '';

    useEffect(() => {
        if (!showId || !theaterSlug) {
            navigate(`/movie/${slug}/theaters`, { replace: true });
        }
    }, [showId, theaterSlug, slug, navigate]);

    const [seats, setSeats] = useState([]);
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [show, setShow] = useState(null);
    const [toast, setToast] = useState(null);
    const [selectedShow, setSelectedShow] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isCountModalOpen, setIsCountModalOpen] = useState(true);
    const [selectedSeatCount, setSelectedSeatCount] = useState(1);
    const [movieData, setMovieData] = useState(null); // Real movie data fetched from API
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const hasProceededRef = useRef(false);
    const selectedSeatsRef = useRef([]);
    const releaseTimeoutRef = useRef(null);
    const hasFetchedSeats = useRef(false);

    useEffect(() => {
        selectedSeatsRef.current = selectedSeats;
    }, [selectedSeats]);

    // Use getMovieById from context instead of fetching all movies again
    useEffect(() => {
        const movie = getMovieById(slug || movieId);
        if (movie) {
            const movieInfo = {
                title: movie.title || movie.MovieName || '',
                portraitPosterUrl: movie.posterUrl || movie.portraitPosterUrl || ''
            };
            setMovieData(movieInfo);

            // Sync session storage
            if (!sessionStorage.getItem('booking_movie_title')) {
                sessionStorage.setItem('booking_movie_title', movieInfo.title);
            }
            if (!sessionStorage.getItem('booking_movie_poster')) {
                sessionStorage.setItem('booking_movie_poster', movieInfo.portraitPosterUrl);
            }
        }
    }, [slug, movieId, getMovieById]);

    useEffect(() => {
        const fetchSeats = async () => {
            if (hasFetchedSeats.current) return;
            hasFetchedSeats.current = true;
            try {
                setLoading(true);

                const urlSeats = searchParams.get('seats')?.split(',');
                if (urlSeats && urlSeats.length > 0) {
                    releaseSeats(showId, urlSeats).catch(() => { });
                }

                // Release pending locks from previous attempts
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

                const response = await apiCacheManager.getOrFetchSeats(showId, () => getShowSeats(showId));
                const showData = response.show;
                const seatsData = response.seats || [];

                setShow(showData);
                setSeats(seatsData);

                // Extract and store screen name for consistency
                const screenName = showData?.screen?.screenName || showData?.screen?.name || '';
                if (screenName) {
                    sessionStorage.setItem('booking_screen_name', screenName);
                }

                // Find layout in various possible nested locations (matching mobile logic)
                const screenLayout = response.data?.layout ||
                    showData?.layout ||
                    showData?.screen?.layout ||
                    showData?.screen?.screenId?.layout ||
                    {};

                setLayout(screenLayout);
            } catch (err) {
                console.error('Fetch seats error:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (showId) fetchSeats();

        if (releaseTimeoutRef.current) {
            clearTimeout(releaseTimeoutRef.current);
            releaseTimeoutRef.current = null;
        }

        return () => {
            if (!hasProceededRef.current && showId && selectedSeatsRef.current.length > 0) {
                releaseTimeoutRef.current = setTimeout(() => {
                    releaseSeats(showId, selectedSeatsRef.current).catch(() => { });
                }, 500);
            }
        };
    }, [showId]);

    // Unified state logic above and fetch effects below
    useEffect(() => {
        if (show) {
            setSelectedShow({
                showId: showId,
                id: showId,
                time: show.startTime || show.showTime || sessionStorage.getItem('booking_show_time') || '',
                price: show.pricing?.[0]?.basePrice || 150,
                screenName: show.screen?.screenName || show.screen?.name || sessionStorage.getItem('booking_screen_name') || 'Screen'
            });
        }
    }, [show, showId, theaterName]);

    const handleSeatChange = (seats) => {
        setSelectedSeats(seats);
    };

    const handleProceedToPayment = async () => {
        if (selectedSeats.length === 0) {
            showToast('Please select your seats', 'warning');
            return;
        }

        if (selectedSeats.length !== selectedSeatCount) {
            showToast(`Please select exactly ${selectedSeatCount} ${selectedSeatCount === 1 ? 'seat' : 'seats'}`, 'warning');
            return;
        }

        try {
            setLoading(true);
            const seatIds = selectedSeats.map(seat => seat.id);
            // Replace API call with local temporary lock until payment summary
            const tempSessionId = `temp_session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            if (tempSessionId) {
                // Update booking draft for FoodPage to consume
                const bookingDraft = {
                    showId,
                    movieId: movieId,
                    theaterId: theaterId,
                    sessionId: tempSessionId,
                    date: showDate,
                    seats: seatIds, // Keeping IDs for API payload consistency
                    selectedSeats: selectedSeats, // Full objects for display in summary
                    cart: {} 
                };
                sessionStorage.setItem(`booking_draft_${showId}`, JSON.stringify(bookingDraft));

                hasProceededRef.current = true;
                const isFoodAvailable = sessionStorage.getItem('booking_is_food_available') !== 'false';

                if (isFoodAvailable) {
                    navigate(`/movie/${slug}/${theaterSlug}/food`, {
                        state: {
                            movie: displayShow,
                            show: selectedShow,
                            seats: selectedSeats,
                            sessionId: tempSessionId
                        }
                    });
                } else {
                    navigate(`/movie/${slug}/${theaterSlug}/summary`, {
                        state: {
                            movie: displayShow,
                            show: selectedShow,
                            seats: selectedSeats,
                            sessionId: tempSessionId
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Proceed to payment error:', err);
            showToast(err.message || 'Could not proceed to food selection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = () => {
        setIsCancelModalOpen(true);
    };

    const confirmCancelBooking = () => {
        setSelectedSeats([]);
        navigate(-1);
    };

    // Build display data — API returns movie/theatre as raw IDs, so we rely on sessionStorage values
    const displayShow = React.useMemo(() => {
        if (!show) return null;
        const resolvedTitle = sessionStorage.getItem('booking_movie_title') || movieTitle || 'Movie';
        const resolvedPoster = sessionStorage.getItem('booking_movie_poster') || moviePoster || '';
        const resolvedTheaterName = sessionStorage.getItem('booking_theater_name') || theaterName || 'Theatre';
        const resolvedShowTime = show?.showTime || show?.startTime || sessionStorage.getItem('booking_show_time') || '';
        const resolvedDate = show?.showDate || show?.date || showDate;
        const resolvedScreenName = show?.screen?.screenName || show?.screen?.name || sessionStorage.getItem('booking_screen_name') || 'Screen';

        return {
            ...show,
            movie: {
                id: movieId,
                title: movieData?.title || resolvedTitle,
                portraitPosterUrl: movieData?.portraitPosterUrl || resolvedPoster,
            },
            theatre: {
                id: theaterId,
                name: resolvedTheaterName,
            },
            startTime: resolvedShowTime,
            date: resolvedDate,
            screenName: resolvedScreenName,
        };
    }, [show, movieId, movieTitle, moviePoster, theaterId, theaterName, showDate, movieData]);

    // Show summary state for BookingSummary
    const showForSummary = React.useMemo(() => {
        if (!showId || !show) return null;
        return {
            showId,
            id: showId,
            time: show?.showTime || show?.startTime || sessionStorage.getItem('booking_show_time') || '',
            date: show?.showDate || show?.date || showDate,
            screenName: show?.screen?.screenName || show?.screen?.name || sessionStorage.getItem('booking_screen_name') || 'Screen',
            price: show?.pricing?.[0]?.basePrice || 150,
        };
    }, [show, showId, theaterName, showDate]);

    // Derive seat categories for legend and modal
    const seatCategories = React.useMemo(() => {
        if (!seats || seats.length === 0) {
            // Fallback to show.pricing if seats layout isn't loaded yet
            return show?.pricing?.filter(p => !['path', 'aisle', 'empty', 'wheelchair'].includes((p.seatType || '').toLowerCase())).map(p => ({
                label: p.label || p.seatClass?.name || (p.seatType || 'NORMAL').toUpperCase(),
                price: p.basePrice || p.price || 0,
                status: 'AVAILABLE'
            })) || [];
        }

        // Deriving from actual seats layout for accuracy
        const categoriesMap = new Map();
        seats.flat().forEach(seat => {
            const type = (seat.originalType || seat.type || '').toLowerCase();
            if (seat && type !== 'path' && type !== 'aisle' && type !== 'empty') {
                const label = seat.categoryName || seat.seatClass?.name || (seat.type || 'NORMAL').toUpperCase();
                const price = seat.basePrice || seat.price || 0;
                const key = `${label}-${price}`;

                if (!categoriesMap.has(key)) {
                    categoriesMap.set(key, {
                        label: label,
                        price: price,
                        status: 'AVAILABLE'
                    });
                }
            }
        });

        // Sort by price descending (Premium first)
        return Array.from(categoriesMap.values()).sort((a, b) => b.price - a.price);
    }, [seats, show]);

    const handleRemoveSeat = (seatToRemove) => {
        setSelectedSeats(prev => prev.filter(s => s.id !== seatToRemove.id));
    };

    const summaryRef = useRef(null);

    const scrollToSummary = () => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const ticketsTotalValue = React.useMemo(() => {
        const basePrice = show?.pricing?.[0]?.basePrice || 150;
        return selectedSeats.reduce((acc, seat) => acc + (seat.basePrice || basePrice), 0);
    }, [selectedSeats, show]);

    if (loading) return <LoadingScreen message="Scanning Layout" />;
    if (error) return <ErrorState error={error} title="Issue Detected" buttonText="TRY AGAIN" />;
    if (!show || !showId) return <NotFoundState title="Show Not Found" message="We couldn't find the showtime you're looking for." />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col transition-colors duration-300">
            <SEO title="Select Seats - XYNEMA" description="Choose your preferred movie seats" />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sub-Header: Information & Controls — New Figma Design */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm py-4 w-full transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between gap-2">
                    {/* Left: Back Button & Movie Info */}
                    <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 md:p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight truncate">
                                {displayShow.movie?.title}
                            </h1>
                            <div className="flex items-center text-[11px] md:text-[13px] text-gray-500 dark:text-gray-400 mt-1 gap-1 md:gap-1.5 flex-wrap">
                                <span className="truncate">{displayShow.theatre?.name}</span>
                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                <span className="font-medium text-gray-600 dark:text-gray-300">{displayShow.screenName}</span>
                                <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>
                                <span className="text-gray-300 dark:text-gray-700 sm:hidden">•</span>
                                <span>{displayShow.startTime}</span>
                                <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>
                                <span className="text-gray-300 dark:text-gray-700 sm:hidden">•</span>
                                <span className="whitespace-nowrap">{showDate ? new Date(showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                                <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>
                                <span className="text-gray-300 dark:text-gray-700 sm:hidden">•</span>
                                <span className="font-bold text-primary/80">IMAX</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Selected Tickets Count */}
                    <div
                        onClick={() => setIsCountModalOpen(true)}
                        className="flex flex-col items-end pl-2 cursor-pointer hover:opacity-80 transition-all group shrink-0"
                    >
                        <span className="text-[9px] md:text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300 uppercase tracking-wider">
                            Tickets
                        </span>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-2xl md:text-3xl font-black text-primary dark:text-primary leading-none">
                                {selectedSeatCount}
                            </span>
                            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Split View — New Figma Layout */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8 bg-[#f9fafb] dark:bg-gray-950 min-h-[calc(100vh-80px)] transition-colors duration-300 pb-24 md:pb-8">

                {/* Left Side: Seat Layout Card */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Mobile Only: Top Legend Indicator */}
                    <div className="flex lg:hidden items-center justify-center flex-wrap gap-x-4 gap-y-2 py-3 px-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-[3px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"></div>
                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Available</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-[3px] bg-primary"></div>
                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Selected</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-[3px] bg-[#94a3b8] dark:bg-gray-700"></div>
                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Booked</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-[11px] h-[11px] rounded-[3px] bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center relative">
                                <div className="absolute w-[6px] h-[1px] bg-gray-400 rotate-45"></div>
                                <div className="absolute w-[6px] h-[1px] bg-gray-400 -rotate-45"></div>
                            </div>
                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Sold Out</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Accessibility className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Wheelchair</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Armchair className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Recliner</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden relative flex flex-col h-[65vh] lg:h-full transition-colors duration-300">
                    <SeatLayout
                        showId={showId}
                        selectedSeats={selectedSeats}
                        onSeatChange={handleSeatChange}
                        maxSeatCount={selectedSeatCount}
                        showToast={showToast}
                    />
                    </div>
                </div>

                {/* Right Side: Summary Section Card */}
                <div ref={summaryRef} className="w-full lg:w-[380px] bg-white dark:bg-gray-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col h-auto lg:h-full shrink-0 transition-colors duration-300">
                    <BookingSummary
                        movie={displayShow}
                        show={showForSummary}
                        selectedSeats={selectedSeats}
                        requiredSeatCount={selectedSeatCount}
                        seatCategories={seatCategories}
                        buttonText={sessionStorage.getItem('booking_is_food_available') === 'false' ? "Process" : "Process"}
                        buttonIcon={<ChevronRight className="w-5 h-5" />}
                        onConfirm={handleProceedToPayment}
                        onCancel={handleCancelBooking}
                        onClearAll={() => setSelectedSeats([])}
                        onRemoveSeat={handleRemoveSeat}
                        onEditCount={() => setIsCountModalOpen(true)}
                    />
                </div>
            </main>

            {/* Mobile Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 p-4 transition-all animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Total Amount</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">₹{(ticketsTotalValue * 1.18 + (selectedSeats.length * 30)).toFixed(2)}</span>
                            <button
                                onClick={scrollToSummary}
                                className="text-[10px] font-bold text-primary dark:text-primary/80 uppercase tracking-wide hover:underline underline-offset-2"
                            >
                                View Details
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={selectedSeats.length === 0 || (selectedSeatCount > 0 && selectedSeats.length !== selectedSeatCount)}
                        onClick={handleProceedToPayment}
                        className="flex-1 max-w-[160px] py-3 rounded-xl bg-primary text-white font-bold text-[13px] uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:shadow-none"
                    >
                        Continue
                    </button>
                </div>
            </div>

            {/* Seat Count Modal */}
            <SeatCountModal
                isOpen={isCountModalOpen}
                onClose={() => setIsCountModalOpen(false)}
                onSelect={(count) => {
                    setSelectedSeatCount(count);
                    setIsCountModalOpen(false);
                }}
                pricing={seatCategories}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={confirmCancelBooking}
                title="Cancel Selection?"
                message="Your current seat selection will be lost. Do you want to go back to theater selection?"
                confirmText="Yes, Go Back"
                cancelText="No, Stay Here"
                type="danger"
            />
        </div>
    );
};

export default SeatSelectionPage;
