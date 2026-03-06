import React from 'react';
import { Ticket, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';

const BookingSummary = ({ movie, show, selectedSeats, onConfirm, onCancel, onEditCount }) => {
    // Calculate Total — TMS logic: base price + seat price modifier
    const basePrice = show ? (show.price || show.basePrice || 150) : 0;
    const totalAmount = selectedSeats.reduce((acc, seat) => acc + (seat.basePrice || basePrice), 0);
    const tax = totalAmount * 0.1; // 10% tax
    const finalTotal = totalAmount + tax;

    if (!movie || !show) return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-l border-slate-200 bg-white transition-colors">
            <Ticket className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Select a movie and showtime to start booking</p>
        </div>
    );

    // Extract movie data — from sessionStorage fallbacks since API returns raw IDs
    const movieTitle = movie.movie?.title || movie.movie?.MovieName || movie.title || sessionStorage.getItem('booking_movie_title') || 'Movie';
    const moviePoster = movie.movie?.portraitPosterUrl || movie.movie?.landscapePosterUrl || movie.poster || sessionStorage.getItem('booking_movie_poster') || '';
    const showTime = show.time || show.showTime || show.startTime || '';
    const screenName = show.screenName || show.screen || movie.theatre?.name || sessionStorage.getItem('booking_theater_name') || 'Screen';

    return (
        <div className="h-full flex flex-col bg-white z-20 transition-colors duration-300">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                    Booking Summary
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                        <div className="w-20 h-28 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-slate-300" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-slate-900 font-bold leading-tight mb-1">{movieTitle}</h4>
                        <div className="text-xs text-slate-500 space-y-1">
                            <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Today</p>
                            <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {showTime}</p>
                            <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {screenName}</p>
                        </div>
                    </div>
                </div>

                {/* Selected Seats List */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Seats ({selectedSeats.length})</span>
                        {selectedSeats.length > 0 && <button onClick={onCancel} className="text-xs text-rose-500 hover:text-rose-400 font-bold">Clear All</button>}
                    </div>

                    {selectedSeats.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                            No seats selected yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {selectedSeats.map((seat, idx) => (
                                <div key={seat.id || idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                                            {seat.row}{seat.number}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-800 capitalize">{seat.categoryName || seat.type || 'Normal'} Seat</p>
                                            <p className="text-[10px] text-slate-500">Row {seat.row}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-600">
                                        ₹{(seat.basePrice || basePrice).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Checkout */}
            <div className="pt-6 px-6 pb-20 bg-slate-50 border-t border-slate-200">
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Tax (10%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                        <span>Total</span>
                        <span className="text-indigo-600">₹{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        disabled={selectedSeats.length === 0}
                        className="col-span-1 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={selectedSeats.length === 0}
                        onClick={onConfirm}
                        className="col-span-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CreditCard className="w-4 h-4" />
                        Pay Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;
