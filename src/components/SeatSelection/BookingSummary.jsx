import React from 'react';
import { Ticket, Calendar, Clock, MapPin, CreditCard, ChevronRight, ShoppingBag, X, MonitorPlay } from 'lucide-react';

const BookingSummary = ({
    movie,
    show,
    selectedSeats,
    onConfirm,
    onCancel,
    onClearAll,
    onEditCount,
    buttonText = "Pay Now",
    buttonIcon = <CreditCard className="w-4 h-4" />,
    showSkip = false,
    onSkip = null,
    snacksTotal = 0,
    snackDetails = [],
    requiredSeatCount = 0
}) => {
    // Calculate Total 
    const basePrice = show ? (show.price || show.basePrice || 150) : 0;
    const ticketsTotal = selectedSeats.reduce((acc, seat) => acc + (seat.basePrice || basePrice), 0);
    const subTotal = ticketsTotal + snacksTotal;
    const tax = subTotal * 0.1; // 10% tax
    const finalTotal = subTotal + tax;

    if (!movie || !show) return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-l border-slate-200 bg-white transition-colors">
            <Ticket className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Select a movie and showtime to start booking</p>
        </div>
    );

    // Extract movie data
    const movieTitle = movie.movie?.title || movie.movie?.MovieName || movie.title || movie.movieName || sessionStorage.getItem('booking_movie_title') || 'Movie';
    const moviePoster = movie.movie?.portraitPosterUrl || movie.movie?.landscapePosterUrl || movie.movie?.posterUrl || movie.poster || sessionStorage.getItem('booking_movie_poster') || '';
    const theaterName = movie.theatre?.name || movie.theaterName || sessionStorage.getItem('booking_theater_name') || 'Cinema';
    const movieLanguage = sessionStorage.getItem('booking_movie_language') || movie.movieLanguage || show.movieLanguage || 'English';
    const format = sessionStorage.getItem('booking_movie_format') || movie.format || show.format || '2D';
    const showTime = show.time || show.showTime || show.startTime || '';
    const rawScreen = sessionStorage.getItem('booking_screen_name') || show.screenName || show.screen || '1';
    const screenName = rawScreen.toLowerCase().includes('screen') ? rawScreen : `Screen ${rawScreen}`;

    // Format Date
    const rawDate = show.date || movie.date || sessionStorage.getItem('booking_show_date');
    const formattedDate = React.useMemo(() => {
        if (!rawDate) return 'TODAY';
        const d = new Date(rawDate);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'TODAY';
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();
    }, [rawDate]);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 z-20 transition-colors duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                    Booking Summary
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-900 dark:text-gray-100">
                {/* Movie Info */}
                <div className="flex gap-4">
                    {moviePoster ? (
                        <img
                            src={moviePoster}
                            alt={movieTitle}
                            className="w-20 h-28 object-cover rounded-lg shadow-md shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="w-20 h-28 rounded-lg bg-slate-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-slate-300 dark:text-gray-600" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">{format}</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/40 text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider border border-rose-100 dark:border-rose-800">{movieLanguage}</span>
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-bold leading-tight mb-2 truncate" title={movieTitle}>{movieTitle}</h4>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                                <MapPin className="w-3 h-3 text-rose-500" /> {theaterName}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar className="w-3 h-3 text-rose-500" /> {formattedDate}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Clock className="w-3 h-3 text-rose-500" /> {showTime}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <MonitorPlay className="w-3 h-3 text-rose-500" /> {screenName}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Seats List */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tickets ({selectedSeats.length})</span>
                        {selectedSeats.length > 0 && (onClearAll || onCancel) && !showSkip && (
                            <button onClick={onClearAll || onCancel} className="text-xs text-rose-500 hover:text-rose-400 font-bold">Clear All</button>
                        )}
                    </div>

                    {selectedSeats.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/30 text-center text-xs text-slate-400 dark:text-gray-600">
                            No seats selected yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Collapse seats if we have snacks to save space */}
                            {snackDetails.length > 0 ? (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <Ticket className="w-5 h-5 text-slate-400 dark:text-gray-600" />
                                        <div className="text-xs font-medium text-slate-700 dark:text-gray-300">
                                            {selectedSeats.map(s => {
                                                const num = s.number || s.seatNumber || s.seatLabel || s.label || s.seat_number || '';
                                                return `${s.row || ''}${num}`;
                                            }).join(', ')}
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-600">₹{ticketsTotal.toFixed(2)}</span>
                                </div>
                            ) : (
                                selectedSeats.map((seat, idx) => {
                                    const seatNum = seat.number || seat.seatNumber || seat.seatLabel || seat.label || seat.seat_number || '';
                                    return (
                                        <div key={seat.id || idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-gray-300">
                                                    {seat.row || ''}{seatNum}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-slate-800 dark:text-gray-200 capitalize">{seat.categoryName || seat.type || 'Normal'} Seat</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-gray-500">Row {seat.row || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                ₹{(seat.basePrice || basePrice).toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Snacks List */}
                {snackDetails.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Food & Beverage
                            </span>
                        </div>
                        <div className="space-y-3">
                            {snackDetails.map((snack, idx) => {
                                // Check if image is a URL or emoji
                                const isImageUrl = snack.image && (snack.image.startsWith('http') || snack.image.startsWith('https') || snack.image.startsWith('/'));

                                return (
                                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800/40 p-2 rounded border border-slate-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                                                {isImageUrl ? (
                                                    <img
                                                        src={snack.image}
                                                        alt={snack.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            // Fallback to emoji if image fails to load
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                ) : null}
                                                <span className={`text-lg ${isImageUrl ? 'hidden' : ''}`}>
                                                    {snack.image || '🍿'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-gray-200">{snack.name}</p>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 tracking-wider">Qty: {snack.qty}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-indigo-400">₹{snack.total.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Checkout */}
            <div className="pt-6 px-6 pb-20 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-200 dark:border-gray-800 relative">
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
                        <span>Tickets</span>
                        <span>₹{ticketsTotal.toFixed(2)}</span>
                    </div>
                    {snacksTotal > 0 && (
                        <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
                            <span>Food & Beverage</span>
                            <span>₹{snacksTotal.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
                        <span>Convenience Fee (10%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-3 mt-3 border-t border-slate-200 dark:border-gray-700">
                        <span>Total Payable</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-black">₹{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        disabled={selectedSeats.length === 0 || (requiredSeatCount > 0 && selectedSeats.length !== requiredSeatCount)}
                        onClick={onConfirm}
                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {buttonIcon}
                        {buttonText}
                    </button>

                    {!showSkip && onCancel && (
                        <button
                            className="w-full py-3.5 rounded-xl border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {showSkip && typeof onSkip === 'function' && (
                    <div className="mt-5 text-center flex flex-col items-center">
                        <button
                            onClick={onSkip}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest pb-1 border-b border-transparent hover:border-slate-800"
                        >
                            Skip Snacks
                        </button>
                        <p className="text-[10px] text-slate-400 mt-2">You can specify this order at the counter</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingSummary;
