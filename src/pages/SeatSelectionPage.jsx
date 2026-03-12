import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Ticket, Info, ChevronRight, Users, AlertCircle, X, ChevronLeft, Settings } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import SEO from '../components/SEO';
import { getSeats, releaseSeats } from '../services/bookingService';
import { getNotNowMovies } from '../services/movieService';
import LoadingScreen from '../components/LoadingScreen';
import SeatLayout from '../components/SeatSelection/SeatLayout';
import BookingSummary from '../components/SeatSelection/BookingSummary';
import SeatCountModal from '../components/SeatSelection/SeatCountModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ErrorState from '../components/ErrorState';
import NotFoundState from '../components/NotFoundState';

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

    useEffect(() => {
        selectedSeatsRef.current = selectedSeats;
    }, [selectedSeats]);

    // Fetch movie details from latest-movies API and match by slug
    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                const movies = await getNotNowMovies();
                if (Array.isArray(movies)) {
                    // Movie model maps: MovieName → title, portraitPosterUrl → posterUrl
                    const matched = movies.find(m => m.slug === slug || m.id === movieId);
                    if (matched) {
                        const movieInfo = {
                            title: matched.title || matched.MovieName || '',
                            portraitPosterUrl: matched.posterUrl || matched.portraitPosterUrl || ''
                        };
                        setMovieData(movieInfo);

                        // Also update session storage for consistency if missing
                        if (!sessionStorage.getItem('booking_movie_title')) {
                            sessionStorage.setItem('booking_movie_title', movieInfo.title);
                        }
                        if (!sessionStorage.getItem('booking_movie_poster')) {
                            sessionStorage.setItem('booking_movie_poster', movieInfo.portraitPosterUrl);
                        }
                    }
                }
            } catch (e) {
                console.warn('Could not fetch movie details from API:', e);
            }
        };
        if (slug || movieId) fetchMovieDetails();
    }, [slug, movieId]);

    useEffect(() => {
        const fetchSeats = async () => {
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

                const response = await getSeats(showId);
                const showData = response.data?.show || response.data;
                const seatsData = response.data?.seats || [];

                setShow(showData);
                setSeats(seatsData);

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
                screenName: show.theatre?.name || theaterName || 'Screen'
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
                    seats: seatIds,
                    cart: {} // Empty cart initially
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
            screenName: sessionStorage.getItem('booking_theater_name') || theaterName || 'Screen',
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

    if (loading) return <LoadingScreen message="Scanning Layout" />;
    if (error) return <ErrorState error={error} title="Issue Detected" buttonText="TRY AGAIN" />;
    if (!show || !showId) return <NotFoundState title="Show Not Found" message="We couldn't find the showtime you're looking for." />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 flex flex-col transition-colors duration-300">
            <SEO title="Select Seats - XYNEMA" description="Choose your preferred movie seats" />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sub-Header: Information & Controls — New Figma Design */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm py-4 w-full transition-colors duration-300">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between">
                    {/* Left: Back Button & Movie Info */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                                {displayShow.movie?.title}
                            </h1>
                            <div className="flex items-center text-[13px] text-gray-500 dark:text-gray-400 mt-1 gap-1.5 flex-wrap">
                                <span>{displayShow.theatre?.name}</span>
                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                <span>{displayShow.startTime}</span>
                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                <span>{showDate ? new Date(showDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
                                <span className="text-gray-300 dark:text-gray-700">|</span>
                                <span>IMAX</span> {/* Add dynamic format here if available in displayShow */}
                            </div>
                        </div>
                    </div>

                    {/* Right: Selected Tickets Count */}
                    <div
                        onClick={() => setIsCountModalOpen(true)}
                        className="flex flex-col items-end pr-4 cursor-pointer hover:opacity-80 transition-all group"
                    >
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                            Tickets Selected
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-primary dark:text-[#5c98ce] leading-none">
                                {selectedSeatCount}
                            </span>
                            <Settings className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Split View — New Figma Layout */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 p-6 lg:p-8 overflow-hidden bg-[#f9fafb] dark:bg-gray-950 min-h-[calc(100vh-80px)] transition-colors duration-300">

                {/* Left Side: Seat Layout Card */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden relative flex flex-col h-[60vh] lg:h-full transition-colors duration-300">
                    <SeatLayout
                        showId={showId}
                        selectedSeats={selectedSeats}
                        onSeatChange={handleSeatChange}
                        maxSeatCount={selectedSeatCount}
                        showToast={showToast}
                    />
                </div>

                {/* Right Side: Summary Section Card */}
                <div className="w-full lg:w-[380px] bg-white dark:bg-gray-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col h-auto lg:h-full shrink-0 transition-colors duration-300">
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
