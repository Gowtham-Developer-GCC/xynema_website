import React, { useState, useEffect } from 'react';
import staffBookingService from '../../../api/services/staffBookingService';
import toast from 'react-hot-toast';
import LoadingScreen from '../../common/LoadingScreen';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const SeatLayout = ({ selectedShow, onSeatChange }) => {
    const [seats, setSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch real seat layout for the specific show
    useEffect(() => {
        const fetchLayout = async () => {
            if (!selectedShow?.showId) return;

            setIsLoading(true);
            try {
                // The API endpoint uses scheduleId as the unique show identifier
                const response = await staffBookingService.getSeatLayout(selectedShow.showId);

                let layoutData = response;
                if (response.success && response.data) {
                    layoutData = response.data;
                } else if (Array.isArray(response) && response[0]?.success) {
                    layoutData = response[0].data;
                }

                if (layoutData?.seats) {
                    // Group the flat array into a 2D matrix
                    let maxRow = 0;
                    let maxCol = 0;

                    layoutData.seats.forEach(s => {
                        if (s.position?.row > maxRow) maxRow = s.position.row;
                        if (s.position?.column > maxCol) maxCol = s.position.column;
                    });

                    // Build 2D matrix
                    const matrix = Array.from({ length: maxRow + 1 }, () => Array(maxCol + 1).fill(null));

                    layoutData.seats.forEach(s => {
                        let uiType = s.seatType || 'normal';
                        const seatName = s.seatClass?.name?.toLowerCase();
                        if (seatName === 'platinum' || seatName === 'gold' || seatName === 'sofa') {
                            uiType = 'premium';
                        }

                        const basePrice = s.basePrice || layoutData.show?.pricing?.[0]?.basePrice || selectedShow?.price || 150;
                        const priceModifier = basePrice - (selectedShow?.price || 150);

                        matrix[s.position.row][s.position.column] = {
                            id: s._id || s.seatNumber,
                            row: s.row,
                            number: s.seatNumber,
                            status: s.isBooked ? 'booked' : (!s.isAvailable || s.isLocked ? 'reserved' : 'available'),
                            type: uiType,
                            categoryName: s.seatClass?.name || uiType.toUpperCase(),
                            originalType: s.seatType, // preserve 'path'
                            priceModifier: priceModifier,
                            basePrice: basePrice,
                            position: s.position
                        };
                    });

                    // Filter out empty rows
                    const cleanedMatrix = matrix.filter(row => row.some(cell => cell !== null));
                    setSeats(cleanedMatrix);
                } else {
                    toast.error("Invalid seat layout data format.");
                }
            } catch (error) {
                toast.error("Failed to load seat layout.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLayout();
    }, [selectedShow]);

    const handleSeatClick = (rowIndex, colIndex) => {
        const seat = seats[rowIndex][colIndex];
        if (seat.type === 'path' || seat.status === 'booked' || seat.status === 'reserved' || seat.status === 'disabled') return;

        const newSeats = [...seats];
        const currentStatus = newSeats[rowIndex][colIndex].status;

        // Toggle Selection
        newSeats[rowIndex][colIndex].status = currentStatus === 'selected' ? 'available' : 'selected';
        setSeats(newSeats);

        // Notify Parent
        if (onSeatChange) {
            // Flatten and filter selected
            const selected = newSeats.flat().filter(s => s.status === 'selected');
            onSeatChange(selected);
        }
    };

    if (isLoading) {
        return <LoadingScreen message="Fetching live seat occupancy..." />;
    }

    return (
        <div className="relative w-full h-[calc(100vh-220px)] md:h-[calc(100vh-190px)] min-h-[500px] overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm animate-in zoom-in-95 duration-500 group">

            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg rounded-xl flex items-center p-1.5 gap-1 border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider px-2 pointer-events-none">Scroll to Zoom • Drag to Pan</div>
            </div>

            <div className="absolute inset-0 z-0">
                <TransformWrapper
                    initialScale={1}
                    minScale={0.2}
                    maxScale={4}
                    centerOnInit={true}
                    wheel={{ step: 0.1 }}
                    limitToBounds={false}
                    centerZoomedOut={false}
                    panning={{ velocityDisabled: true }}
                >
                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="flex flex-col gap-1.5 items-center justify-center p-16 md:p-32 pb-48 origin-center">
                            {(() => {
                                let lastCategoryName = null;
                                // 1. Identify unique categories in predictable order (Bottom to Top: Silver -> Sofa)
                                // This ensures "Normal" styling stays with the cheapest categories
                                const categoriesOrdered = [];
                                [...seats].reverse().forEach(row => {
                                    const firstCell = row.find(c => c !== null && c.originalType !== 'path' && c.originalType !== 'empty' && c.originalType !== 'aisle');
                                    if (firstCell?.categoryName && !categoriesOrdered.includes(firstCell.categoryName)) {
                                        categoriesOrdered.push(firstCell.categoryName);
                                    }
                                });

                                // 2. Map seats directly (assuming API order is back-to-front, so A is at the bottom)
                                return seats.map((row, rowIndex) => {
                                    const firstCell = row.find(c => c !== null && c.originalType !== 'path' && c.originalType !== 'empty' && c.originalType !== 'aisle');
                                    const rowLabel = firstCell?.row || '';

                                    // Determine if we need a category header
                                    const currentCategory = firstCell?.categoryName;
                                    const showHeader = currentCategory && currentCategory !== lastCategoryName;

                                    if (showHeader) {
                                        lastCategoryName = currentCategory;
                                    }

                                    // Dynamic logic: First 2 categories = Normal, others = Premium
                                    const categoryIndex = categoriesOrdered.indexOf(currentCategory);
                                    const isPremiumCategory = categoryIndex >= 2 || currentCategory?.toLowerCase() === 'platinum' || currentCategory?.toLowerCase() === 'gold' || currentCategory?.toLowerCase() === 'sofa';

                                    return (
                                        <React.Fragment key={rowIndex}>
                                            {showHeader && (
                                                <div className="w-full flex items-center gap-4 my-6 opacity-60">
                                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
                                                    <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                                                        <span>₹{firstCell.basePrice}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                        <span>{currentCategory}</span>
                                                    </div>
                                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
                                                </div>
                                            )}
                                            <div className="flex gap-1.5 items-center shrink-0 w-full justify-center">
                                                {/* Row Label */}
                                                <div className="w-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500 mr-2 shrink-0">
                                                    {rowLabel}
                                                </div>

                                                {/* Standard Left-to-Right Mapping */}
                                                {row.map((seat, colIndex) => {
                                                    if (!seat || seat.type === 'path' || seat.originalType === 'path' || seat.originalType === 'empty' || seat.originalType === 'aisle') {
                                                        return <div key={`path-${seat?.id || colIndex}`} className="w-8 h-8 md:w-10 md:h-10 shrink-0 opacity-0" />;
                                                    }

                                                    // Determine Styles (copied from former rendering block)
                                                    let seatStyle = "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 shadow-sm";

                                                    if (seat.status === 'booked' || seat.status === 'reserved') {
                                                        seatStyle = "bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed border-transparent shadow-none";
                                                    } else if (seat.status === 'selected') {
                                                        seatStyle = "bg-indigo-600 dark:bg-indigo-500 border-indigo-500 dark:border-indigo-400 text-white shadow-lg shadow-indigo-500/50 transform scale-110 z-10 font-black";
                                                    } else if (isPremiumCategory) {
                                                        seatStyle = "border-amber-400 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20";
                                                    }

                                                    return (
                                                        <button
                                                            key={seat.id}
                                                            onClick={() => handleSeatClick(rowIndex, colIndex)}
                                                            disabled={seat.status === 'booked' || seat.status === 'reserved'}
                                                            title={`${seat.code || seat.row + seat.number} - ₹${firstCell?.basePrice}`}
                                                            className={`
                                                                        relative w-8 h-8 md:w-10 md:h-10 rounded-lg shrink-0 flex items-center justify-center transition-all duration-300 border shadow-sm text-[10px] md:text-xs font-black
                                                                        ${seatStyle}
                                                                    `}
                                                        >
                                                            {seat.status === 'booked' || seat.status === 'reserved' ? '×' : seat.number}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>

            {/* Floating Bottom UI */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-6 md:pb-8 pointer-events-none">
                {/* Curved Screen Element */}
                <div className="w-full max-w-[600px] px-8 perspective-1000 mb-6 opacity-90">
                    <div className="h-10 md:h-12 w-full border-b-[3px] md:border-b-4 border-indigo-500/80 rounded-[50%/0_0_100%_100%] shadow-[0_10px_30px_rgba(99,102,241,0.2)] flex items-start justify-center pt-2">
                        <span className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Screen</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 px-5 py-3 md:py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 pointer-events-auto transform transition-transform hover:-translate-y-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border-amber-300/50 bg-amber-50 dark:bg-amber-500/10 shadow-sm"></div>
                        <span className="text-amber-600 dark:text-amber-500">Premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]"></div>
                        <span className="text-indigo-600 dark:text-indigo-400">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center">×</div>
                        <span>Booked</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatLayout;
