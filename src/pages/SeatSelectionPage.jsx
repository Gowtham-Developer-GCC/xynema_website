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
    const [selectedSeatCount, setSelectedSeatCount] = useState(2);
    const [movieData, setMovieData] = useState(null); // Real movie data fetched from API

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
                navigate(`/movie/${slug}/${theaterSlug}/food`, {
                    state: {
                        movie: displayShow,
                        show: selectedShow,
                        seats: selectedSeats,
                        sessionId: tempSessionId
                    }
                });
            }
        } catch (err) {
            console.error('Proceed to payment error:', err);
            showToast(err.message || 'Could not proceed to food selection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = () => {
        if (window.confirm('Cancel current selection?')) {
            setSelectedSeats([]);
            navigate(-1);
        }
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
            screenName: sessionStorage.getItem('booking_theater_name') || theaterName || 'Screen',
            price: show?.pricing?.[0]?.basePrice || 150,
        };
    }, [show, showId, theaterName]);

    if (loading) return <LoadingScreen message="Scanning Layout" />;
    if (error) return <ErrorState error={error} title="Issue Detected" buttonText="TRY AGAIN" />;
    if (!show || !showId) return <NotFoundState title="Show Not Found" message="We couldn't find the showtime you're looking for." />;

    return (
        <div className="min-h-screen bg-[#F5F5FA] flex flex-col">
            <SEO title="Select Seats - XYNEMA" description="Choose your preferred movie seats" />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sub-Header: Information & Controls — Positioned in-flow below global navbar */}
            <div className="bg-white border-b border-gray-100 shadow-sm py-4">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    {/* Left: Navigation Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#1a2b4b] hover:bg-slate-100 active:scale-95 transition-all group"
                        >
                            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                        </button>
                        <button
                            onClick={() => setIsCountModalOpen(true)}
                            className="h-10 px-4 rounded-xl bg-[#1a2b4b] text-white flex items-center gap-2 hover:bg-[#111c32] active:scale-95 transition-all group shadow-sm"
                        >
                            <Settings className="w-4 h-4 transition-transform group-hover:rotate-45" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {selectedSeatCount} {selectedSeatCount === 1 ? 'Seat' : 'Seats'}
                            </span>
                        </button>
                    </div>

                    {/* Center: Movie/Theatre info */}
                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5 w-full justify-center">
                            <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide truncate">
                                {displayShow.movie?.title}
                            </h1>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                                {displayShow.theatre?.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#1a2b4b]" />
                                <span className="text-[10px] font-black text-[#1a2b4b] uppercase tracking-widest">
                                    {displayShow.startTime}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Ticket className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {showDate ? new Date(showDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info button */}
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                        <Info className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Main Content Area - Split View — Flexible height below sub-header */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row overflow-hidden">
                {/* Left Side: Seat Layout */}
                <div className="flex-1 p-4 lg:p-6 overflow-hidden h-[60vh] lg:h-full relative rounded-tr-xl lg:rounded-tr-none">
                    <SeatLayout
                        showId={showId}
                        onSeatChange={handleSeatChange}
                        maxSeatCount={selectedSeatCount}
                        showToast={showToast}
                    />
                </div>

                {/* Right Side: Summary Section */}
                <div className="w-full lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] flex flex-col h-[60vh] lg:h-full z-30 shrink-0">
                    <BookingSummary
                        movie={displayShow}
                        show={showForSummary}
                        selectedSeats={selectedSeats}
                        buttonText="Proceed to Food"
                        buttonIcon={<ChevronRight className="w-5 h-5" />}
                        onConfirm={handleProceedToPayment}
                        onCancel={() => setSelectedSeats([])}
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
                pricing={show?.pricing?.map(p => ({
                    label: p.label || p.seatType.toUpperCase(),
                    price: p.basePrice,
                    status: 'AVAILABLE'
                }))}
            />
        </div>
    );
};

export default SeatSelectionPage;
