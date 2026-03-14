import React from 'react';
import { ShoppingBag, X } from 'lucide-react';

const BookingSummary = ({
    movie,
    show,
    selectedSeats,
    onConfirm,
    onCancel,
    onClearAll,
    onEditCount,
    buttonText = "Continue",
    buttonIcon = null,
    showSkip = false,
    onSkip = null,
    snacksTotal = 0,
    snackDetails = [],
    requiredSeatCount = 0,
    seatCategories = [],
    onRemoveSeat
}) => {

    // Calculate Total 
    const basePrice = show ? (show.price || show.basePrice || 150) : 0;
    const ticketsTotal = selectedSeats.reduce((acc, seat) => acc + (seat.basePrice || basePrice), 0);
    const convenienceFee = selectedSeats.length > 0 ? selectedSeats.length * 30 : 0;
    const gstRate = 0.18;
    const gstAmount = (ticketsTotal + convenienceFee + snacksTotal) * gstRate;
    const finalTotal = ticketsTotal + convenienceFee + snacksTotal + gstAmount;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 z-20 transition-colors duration-300 rounded-2xl">
            <div className="p-8 pb-6">
                <h3 className="text-[20px] font-bold text-[#111827] dark:text-white font-display uppercase tracking-tight">
                    Booking Summary
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col">
                {/* Selected Seats List */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">Selected Seats</span>
                        {selectedSeats.length > 0 && (
                            <button
                                onClick={onClearAll}
                                className="text-[11px] text-primary dark:text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    {selectedSeats.length === 0 ? (
                        <div className="text-xs text-gray-400 dark:text-gray-600">
                            No seats selected yet
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {selectedSeats.map((seat, idx) => {
                                const seatNum = seat.number || seat.seatNumber || seat.seatLabel || seat.label || seat.seat_number || '';
                                return (
                                    <div key={seat.id || idx} className="px-3 py-[4px] bg-primary text-white rounded-full text-[11px] flex items-center gap-1.5 shadow-sm transform transition-all hover:scale-105">
                                        <span>{seat.row || ''}{seatNum}</span>
                                        <X
                                            className="w-3 h-3 opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
                                            onClick={() => onRemoveSeat && onRemoveSeat(seat)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-[13.5px]">
                        <span className="text-gray-500 dark:text-gray-400">Tickets ({selectedSeats.length})</span>
                        <span className="font-medium text-[#111827] dark:text-white">₹{ticketsTotal.toFixed(2)}</span>
                    </div>
                    {snacksTotal > 0 && (
                        <div className="flex justify-between text-[13.5px]">
                            <span className="text-gray-500 dark:text-gray-400">Food & Beverage</span>
                            <span className="font-medium text-[#111827] dark:text-white">₹{snacksTotal.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[13.5px]">
                        <span className="text-gray-500 dark:text-gray-400">Convenience Fee</span>
                        <span className="font-medium text-[#111827] dark:text-white">₹{convenienceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[13.5px]">
                        <span className="text-gray-500 dark:text-gray-400">GST (18%)</span>
                        <span className="font-medium text-[#111827] dark:text-white">₹{gstAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="h-[1px] bg-gray-100 dark:bg-gray-800 w-full mb-8"></div>

                <div className="flex justify-between items-center text-lg font-black text-[#111827] dark:text-white mb-8 font-roboto">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-5 mb-10 w-full">
                    <button
                        disabled={selectedSeats.length === 0 || (requiredSeatCount > 0 && selectedSeats.length !== requiredSeatCount)}
                        onClick={onConfirm}
                        className="w-full py-[14px] rounded-[12px] bg-primary hover:bg-primary/90 text-white font-bold text-[14px] transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:cursor-not-allowed font-display uppercase tracking-widest shadow-lg shadow-primary/20 disabled:shadow-lg active:scale-[0.98]"
                    >
                        Continue
                    </button>

                    <p className="text-center text-[12.5px] text-gray-500 dark:text-gray-400">
                        By proceeding, you agree to our Terms & Conditions
                    </p>
                </div>

                <div className="h-[1px] bg-gray-100 dark:bg-gray-800 w-full mb-8"></div>

                {/* Seat Legend Indicator */}
                <div className="mt-2">
                    <span className="text-[12px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-5">Seat Legend</span>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        {/* Available */}
                        <div className="flex items-center gap-3">
                            <div className="w-[18px] h-[18px] rounded-[5px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm shrink-0"></div>
                            <span className="text-[12px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tight">Available</span>
                        </div>
                        {/* Selected */}
                        <div className="flex items-center gap-3">
                            <div className="w-[18px] h-[18px] rounded-[5px] bg-primary shadow-sm shadow-primary/20 shrink-0 animate-pulse"></div>
                            <span className="text-[12px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tight">Selected</span>
                        </div>
                        {/* Booked */}
                        <div className="flex items-center gap-3">
                            <div className="w-[18px] h-[18px] rounded-[5px] bg-[#94a3b8] dark:bg-gray-700 shrink-0"></div>
                            <span className="text-[12px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tight">Booked</span>
                        </div>
                        {/* Sold Out / Disabled */}
                        <div className="flex items-center gap-3">
                            <div className="w-[18px] h-[18px] rounded-[5px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center relative shrink-0">
                                <div className="absolute w-[10px] h-[1.5px] bg-gray-400 dark:bg-gray-600 rotate-45"></div>
                                <div className="absolute w-[10px] h-[1.5px] bg-gray-400 dark:bg-gray-600 -rotate-45"></div>
                            </div>
                            <span className="text-[12px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tight">disabled</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BookingSummary;
