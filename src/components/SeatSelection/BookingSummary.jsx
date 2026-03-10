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
    // Helper to get color for seat category
    const getCategoryColor = (label) => {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('diamond')) return '#fbbf24';
        if (lowerLabel.includes('gold') || lowerLabel.includes('premium')) return '#3b7298';
        return '#737d8c'; // Default for Regular/Silver/Normal
    };

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
                <h3 className="text-[20px] font-medium text-[#111827] dark:text-white">
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
                                className="text-[11px] text-[#3b7298] dark:text-[#5c98ce] hover:text-[#2c5877] dark:hover:text-[#4a7ba5] font-medium transition-colors"
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
                                    <div key={seat.id || idx} className="px-3 py-[4px] bg-[#3b7298] dark:bg-[#1e3a8a] text-white rounded-full text-[11px] flex items-center gap-1.5 shadow-sm transform transition-all hover:scale-105">
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

                <div className="flex justify-between items-center text-lg font-medium text-[#111827] dark:text-white mb-8">
                    <span>Total Amount</span>
                    <span className="text-[#3b7298] dark:text-[#5c98ce]">₹{finalTotal.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-5 mb-10 w-full">
                    <button
                        disabled={selectedSeats.length === 0 || (requiredSeatCount > 0 && selectedSeats.length !== requiredSeatCount)}
                        onClick={onConfirm}
                        className="w-full py-[14px] rounded-[6px] bg-[#3b7298] dark:bg-[#1e3a8a] dark:hover:bg-blue-800 hover:bg-[#2c5877] text-white font-normal text-[14px] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>

                    <p className="text-center text-[12.5px] text-gray-500 dark:text-gray-400">
                        By proceeding, you agree to our Terms & Conditions
                    </p>
                </div>

                <div className="h-[1px] bg-gray-100 dark:bg-gray-800 w-full mb-8"></div>

                {/* Seat Categories Legend */}
                {seatCategories.length > 0 && (
                    <div>
                        <span className="text-[13.5px] text-gray-500 dark:text-gray-400 block mb-5">Seat Categories</span>
                        <div className="space-y-3.5">
                            {seatCategories.map((cat, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[13.5px]">
                                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                        <div
                                            className="w-[14px] h-[14px] rounded-[3px]"
                                            style={{ backgroundColor: getCategoryColor(cat.label) }}
                                        ></div>
                                        <span>{cat.label}</span>
                                    </div>
                                    <span className="text-[#111827] dark:text-white font-medium">₹{cat.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default BookingSummary;
