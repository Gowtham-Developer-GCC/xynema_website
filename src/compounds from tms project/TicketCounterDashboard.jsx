import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { MOCK_SHOWTIMES } from '../../../utils/mockBookingData';
import MovieSelection from '../../../components/Staff/Booking/MovieSelection';
import SeatLayout from '../../../components/Staff/Booking/SeatLayout';
import BookingSummary from '../../../components/Staff/Booking/BookingSummary';
import LoadingScreen from '../../../components/common/LoadingScreen';
import staffBookingService from '../../../api/services/staffBookingService';
import toast from 'react-hot-toast';

const TicketCounterDashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [movies, setMovies] = useState([]);

    // Fetch movies strictly from API
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await staffBookingService.getAvailableMovies();

                let fetchedData = [];
                if (Array.isArray(response) && response.length > 0 && response[0].success) {
                    fetchedData = response[0].data || [];
                } else if (response && response.success) {
                    fetchedData = response.data || [];
                } else if (Array.isArray(response)) {
                    fetchedData = response;
                } else if (response?.data && Array.isArray(response.data)) {
                    fetchedData = response.data;
                }

                setMovies(fetchedData);
            } catch (error) {
                toast.error('Failed to load available movies');
                setMovies([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMovies();
    }, []);

    // Booking Flow State
    const [step, setStep] = useState(1); // 1: Movie, 2: Showtime, 3: Seats
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedMovieShows, setSelectedMovieShows] = useState([]);
    const [isLoadingShows, setIsLoadingShows] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedShow, setSelectedShow] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);

    // Generate Date Strip (Today + Next 6 Days)
    const dateStrip = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            dateStr: d.toISOString().split('T')[0],
            dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
            dateNum: d.getDate(),
            monthName: d.toLocaleDateString('en-US', { month: 'short' })
        };
    });

    // --- Handlers ---
    const fetchShowsForDate = async (movie, dateStr) => {
        setIsLoadingShows(true);
        setSelectedMovieShows([]); // Reset shows while fetching

        try {
            const movieId = movie?.movie?._id || movie?._id;

            if (!movieId) {
                toast.error("Movie ID is missing");
                return;
            }

            const responseParams = await staffBookingService.getMovieShows(movieId, dateStr);

            // Similar extraction logic for shows response as we used for movies
            let fetchedScreens = [];
            if (Array.isArray(responseParams) && responseParams.length > 0 && responseParams[0].success) {
                fetchedScreens = responseParams[0].data?.screens || [];
            } else if (responseParams && responseParams.success) {
                fetchedScreens = responseParams.data?.screens || [];
            } else if (responseParams?.data?.screens) {
                fetchedScreens = responseParams.data.screens;
            } else if (responseParams?.screens) {
                fetchedScreens = responseParams.screens;
            }

            setSelectedMovieShows(fetchedScreens);
        } catch (error) {
            toast.error("Failed to load showtimes for " + (movie?.movie?.MovieName || "this movie"));
        } finally {
            setIsLoadingShows(false);
        }
    };

    const handleSelectMovie = async (movie) => {
        setSelectedMovie(movie);
        setStep(2);

        const todayStr = new Date().toISOString().split('T')[0];
        let initialDateStr = todayStr;

        const showStartDate = movie?.showStartDate;
        if (showStartDate) {
            const startDateStr = new Date(showStartDate).toISOString().split('T')[0];
            if (startDateStr > todayStr) {
                initialDateStr = startDateStr;
            }
        }

        setSelectedDate(initialDateStr); // Reset to today or start date

        await fetchShowsForDate(movie, initialDateStr);
    };

    const handleDateSelect = async (dateStr) => {
        setSelectedDate(dateStr);
        await fetchShowsForDate(selectedMovie, dateStr);
    };

    const handleSelectShow = (show) => {
        setSelectedShow(show);
        setStep(3);
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setSelectedSeats([]);
            setSelectedShow(null);
        } else if (step === 2) {
            setStep(1);
            setSelectedMovie(null);
        }
    };

    const handleConfirmBooking = async () => {
        if (selectedSeats.length === 0) return;

        setIsLoading(true);
        try {
            const seatIds = selectedSeats.map(seat => seat.id);
            let response = await staffBookingService.lockSeats(selectedShow.showId, seatIds);

            // Double check array unwrapping just in case
            if (Array.isArray(response)) response = response[0];
            if (typeof response === 'string') {
                try { response = JSON.parse(response); } catch (e) { }
                if (Array.isArray(response)) response = response[0];
            }

            if (response && response.success) {
                setIsLoading(false);
                navigate('/staff/payment', {
                    state: {
                        movie: selectedMovie,
                        show: selectedShow,
                        seats: selectedSeats,
                        bookingData: response.data
                    }
                });
            } else {
                setIsLoading(false);
                toast.error(response?.message || 'Failed to lock seats. Please try again.');
            }
        } catch (error) {
            setIsLoading(false);

            // The server might return a 4xx/5xx error but with our array structure
            let responseData = error.response?.data;
            if (Array.isArray(responseData)) responseData = responseData[0];
            if (typeof responseData === 'string') {
                try { responseData = JSON.parse(responseData); } catch (e) { }
                if (Array.isArray(responseData)) responseData = responseData[0];
            }

            // Fallback just in case the backend throws a Non-2xx but the lock succeeded
            if (responseData && responseData.success) {
                navigate('/staff/payment', {
                    state: {
                        movie: selectedMovie,
                        show: selectedShow,
                        seats: selectedSeats,
                        bookingData: responseData.data
                    }
                });
                return;
            }

            const errMessage = responseData?.message || error.message || 'Failed to lock seats. Please try again.';
            toast.error(errMessage);
        }
    };

    const handleCancelBooking = () => {
        if (window.confirm('Cancel current selection?')) {
            setStep(1);
            setSelectedMovie(null);
            setSelectedShow(null);
            setSelectedSeats([]);
        }
    };

    if (isLoading) {
        return <LoadingScreen message="Initializing booking portal..." />;
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950">
            {/* Show fetching loader */}
            {isLoadingShows && <LoadingScreen message="Finding available showtimes..." />}

            {/* Main Interactive Area */}
            <div className="flex-1 h-full flex flex-col relative overflow-hidden">

                {/* Header / Breadcrumbs */}
                {step > 1 && (
                    <div className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 px-8 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                                    {step === 2 ? 'Select Showtime' : 'Select Seats'}
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                    {selectedMovie?.movie?.MovieName || selectedMovie?.title} {selectedShow && `• ${selectedShow.time}`} {selectedShow?.screenName && `• ${selectedShow.screenName}`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Container */}
                <div className={`flex-1 overflow-x-hidden ${step === 3 ? 'p-0 overflow-hidden' : 'p-8 overflow-y-auto'}`}>

                    {/* STEP 1: Movie Selection */}
                    {step === 1 && (
                        <MovieSelection movies={movies} onSelectMovie={handleSelectMovie} />
                    )}

                    {/* STEP 2: Showtime Selection */}
                    {step === 2 && selectedMovie && selectedMovie.movie && (
                        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-start shadow-sm transition-colors duration-300">
                                <img src={selectedMovie.movie.portraitPosterUrl || selectedMovie.movie.landscapePosterUrl || '/placeholder-poster.png'} alt={selectedMovie.movie.MovieName} className="w-32 rounded-lg shadow-lg" />
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedMovie.movie.MovieName}</h2>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">{selectedMovie.movie.certification || 'U'}</span>
                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">{selectedMovie.movie.Duration || 'N/A'}</span>
                                        <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-xs font-bold">{selectedMovie.screen?.screenType || '2D'}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg mb-2">Screen: <span className="font-bold">{selectedMovie.screen?.screenName}</span></p>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg">
                                        {(() => {
                                            const showStart = selectedMovie.showStartDate;
                                            if (showStart && new Date(showStart).toISOString().split('T')[0] > dateStrip[6].dateStr) {
                                                return "Advance booking is not yet open for the visible calendar.";
                                            }
                                            return "Select a showtime below to proceed to seat selection.";
                                        })()}
                                    </p>
                                </div>
                            </div>

                            {(() => {
                                const showStart = selectedMovie.showStartDate;
                                const isBeyond7Days = showStart && new Date(showStart).toISOString().split('T')[0] > dateStrip[6].dateStr;

                                if (isBeyond7Days) {
                                    const formattedStartDate = new Date(showStart).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });
                                    return (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center flex flex-col items-center justify-center -mt-2">
                                            <Calendar className="w-12 h-12 text-amber-500 mb-4 opacity-80" />
                                            <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                                                Booking opens on {formattedStartDate}
                                            </h3>
                                            <p className="text-sm text-amber-700 dark:text-amber-400 max-w-md">
                                                Advance booking is scheduled to start on the date above. This screen only shows the upcoming 7 days.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                Showtimes for <span className="text-indigo-600 dark:text-indigo-400">{selectedDate === dateStrip[0].dateStr ? 'Today' : selectedDate}</span>
                                            </h3>

                                            {/* Date Strip Selector */}
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {dateStrip.map((item) => {
                                                    let isBeforeStart = false;
                                                    let isAfterEnd = false;
                                                    let endFormatted = null;

                                                    if (selectedMovie?.showStartDate) {
                                                        const startDateStr = new Date(selectedMovie.showStartDate).toISOString().split('T')[0];
                                                        if (item.dateStr < startDateStr) {
                                                            isBeforeStart = true;
                                                        }
                                                    }

                                                    if (selectedMovie?.showEndDate) {
                                                        const endDateStr = new Date(selectedMovie.showEndDate).toISOString().split('T')[0];
                                                        if (item.dateStr > endDateStr) {
                                                            isAfterEnd = true;
                                                        }
                                                        endFormatted = new Date(selectedMovie.showEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                    }

                                                    const isDisabled = isBeforeStart || isAfterEnd;

                                                    return (
                                                        <button
                                                            key={item.dateStr}
                                                            onClick={() => {
                                                                if (isBeforeStart) {
                                                                    const formattedStart = new Date(selectedMovie.showStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                                    toast(`Shows start from ${formattedStart}`, { icon: '⚠️', position: 'bottom-center' });
                                                                    return;
                                                                }
                                                                if (isAfterEnd) {
                                                                    toast(`Shows ended on ${endFormatted}`, { icon: '🛑', position: 'bottom-center' });
                                                                    return;
                                                                }
                                                                handleDateSelect(item.dateStr);
                                                            }}
                                                            className={`flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-xl border-2 transition-all shrink-0 ${isDisabled
                                                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-60'
                                                                : selectedDate === item.dateStr
                                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                                                }`}
                                                        >
                                                            <span className={`text-[10px] font-black uppercase tracking-wider ${selectedDate === item.dateStr && !isDisabled ? 'text-indigo-100' : ''}`}>{item.dayName}</span>
                                                            <span className="text-xl font-bold mt-0.5 leading-none">{item.dateNum}</span>
                                                            <span className={`text-[9px] font-bold uppercase ${selectedDate === item.dateStr && !isDisabled ? 'text-indigo-200' : ''}`}>{item.monthName}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {isLoadingShows ? (
                                                <div className="col-span-full py-8 flex items-center justify-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 border-3 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading schedules...</p>
                                                    </div>
                                                </div>
                                            ) : (selectedMovieShows && selectedMovieShows.length > 0 ? (
                                                selectedMovieShows.map((screen) => {
                                                    return (screen.shows || []).map((show, idx) => {
                                                        const basePrice = show.pricing?.[0]?.basePrice || 150;
                                                        const totalSeats = show.totalSeats || screen.seatingCapacity || 100;
                                                        const seatsAvailable = show.availableSeats ?? totalSeats;

                                                        return (
                                                            <button
                                                                key={show.showId || `${screen.screenId}-${idx}`}
                                                                onClick={() => handleSelectShow({
                                                                    id: show.showId || `${screen.screenId}-${idx}`,
                                                                    showId: show.showId,
                                                                    time: show.showTime,
                                                                    price: basePrice,
                                                                    scheduleId: show.scheduleId,
                                                                    screenId: screen.screenId,
                                                                    screenName: screen.screenName
                                                                })}
                                                                className="group flex flex-col items-start p-5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-200 text-left shadow-sm hover:shadow-md"
                                                            >
                                                                <div className="flex justify-between w-full mb-2">
                                                                    <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{show.showTime || show.time}</span>
                                                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">₹{basePrice}</span>
                                                                </div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 w-full">
                                                                    <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {screen.screenName || 'Standard'}</p>
                                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${seatsAvailable < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                            style={{ width: `${(seatsAvailable / totalSeats) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <p className="text-[10px] text-right pt-1">{seatsAvailable} seats left</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    });
                                                }).flat() // Flattening mapping output
                                            ) : (
                                                <p className="text-slate-500 dark:text-slate-400 col-span-full py-6 text-center">No showtimes scheduled for this movie on the selected date.</p>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* STEP 3: Seat Selection */}
                    {step === 3 && selectedShow && (
                        <div className="w-full h-full">
                            <SeatLayout
                                selectedShow={selectedShow}
                                onSeatChange={setSelectedSeats}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Summary (Visible only when booking logic starts) */}
            {step > 1 && (
                <div className={`h-full flex-shrink-0 border-l border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out ${step >= 2 ? 'w-80 lg:w-96 opacity-100' : 'w-0 opacity-0'}`}>
                    <BookingSummary
                        movie={selectedMovie}
                        show={selectedShow}
                        selectedSeats={selectedSeats}
                        onConfirm={handleConfirmBooking}
                        onCancel={handleCancelBooking}
                    />
                </div>
            )}
        </div>
    );
};

export default TicketCounterDashboard;
