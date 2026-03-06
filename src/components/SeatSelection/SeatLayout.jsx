import React, { useState, useEffect } from 'react';
import { getShowSeats } from '../../services/bookingService';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const SeatLayout = ({ showId, onSeatChange, maxSeatCount = 10, showToast }) => {
    const [seats, setSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch real seat layout for the specific show
    useEffect(() => {
        const fetchLayout = async () => {
            if (!showId) return;

            setIsLoading(true);
            setError(null);
            try {
                // getShowSeats returns a ShowLayoutResponse with .show and .seats
                const layoutData = await getShowSeats(showId);

                if (layoutData?.seats && layoutData.seats.length > 0) {
                    const seatList = layoutData.seats;

                    // Group the flat array into a 2D matrix
                    let maxRow = 0;
                    let maxCol = 0;

                    seatList.forEach(s => {
                        const r = s.position?.row ?? 0;
                        const c = s.position?.column ?? 0;
                        if (r > maxRow) maxRow = r;
                        if (c > maxCol) maxCol = c;
                    });

                    // Build 2D matrix
                    const matrix = Array.from({ length: maxRow + 1 }, () => Array(maxCol + 1).fill(null));

                    seatList.forEach(s => {
                        const r = s.position?.row ?? 0;
                        const c = s.position?.column ?? 0;

                        // s.type is mapped from seatType by the Seat model
                        let uiType = s.type || 'normal';
                        const seatName = (s.seatClass?.name || '').toLowerCase();
                        if (seatName === 'platinum' || seatName === 'gold' || seatName === 'sofa') {
                            uiType = 'premium';
                        }

                        const showData = layoutData.show;
                        const basePrice = s.basePrice || showData?.pricing?.[0]?.basePrice || 150;

                        matrix[r][c] = {
                            id: s.id || s.seatNumber,
                            row: s.row,
                            number: s.seatNumber,
                            status: s.isBooked ? 'booked' : (!s.isAvailable || s.isLocked ? 'reserved' : 'available'),
                            type: uiType,
                            categoryName: s.seatClass?.name || uiType.toUpperCase(),
                            originalType: s.type, // preserve 'path'
                            priceModifier: 0,
                            basePrice: basePrice,
                            position: s.position
                        };
                    });

                    // Filter out empty rows
                    const cleanedMatrix = matrix.filter(row => row.some(cell => cell !== null));
                    setSeats(cleanedMatrix);
                } else {
                    setError("No seat layout data available.");
                }
            } catch (err) {
                console.error('[SeatLayout] Fetch error:', err);
                setError("Failed to load seat layout.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLayout();
    }, [showId]);

    const handleSeatClick = (rowIndex, colIndex) => {
        const seat = seats[rowIndex][colIndex];
        if (!seat) return;
        if (seat.type === 'path' || seat.originalType === 'path' || seat.status === 'booked' || seat.status === 'reserved' || seat.status === 'disabled') return;

        const currentlySelected = seats.flat().filter(s => s && s.status === 'selected');
        const isSelected = seat.status === 'selected';

        if (!isSelected && currentlySelected.length >= maxSeatCount) {
            if (showToast) {
                showToast(`You can only select up to ${maxSeatCount} seats`, 'warning');
            }
            return;
        }

        const newSeats = seats.map((row, ri) =>
            row.map((cell, ci) => {
                if (ri === rowIndex && ci === colIndex) {
                    return { ...cell, status: cell.status === 'selected' ? 'available' : 'selected' };
                }
                return cell;
            })
        );
        setSeats(newSeats);

        // Notify Parent
        if (onSeatChange) {
            const selected = newSeats.flat().filter(s => s && s.status === 'selected');
            onSeatChange(selected);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Fetching live seat layout...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
                <p className="text-sm font-semibold text-slate-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[calc(100vh-220px)] md:h-[calc(100vh-190px)] min-h-[500px] overflow-hidden bg-slate-50/50 rounded-3xl border border-slate-200/60 shadow-sm group">

            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm shadow-lg rounded-xl flex items-center p-1.5 gap-1 border border-slate-200/50">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 pointer-events-none">Scroll to Zoom • Drag to Pan</div>
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
                                // Identify unique categories in order
                                const categoriesOrdered = [];
                                [...seats].reverse().forEach(row => {
                                    const firstCell = row.find(c => c !== null && c.originalType !== 'path' && c.originalType !== 'empty' && c.originalType !== 'aisle');
                                    if (firstCell?.categoryName && !categoriesOrdered.includes(firstCell.categoryName)) {
                                        categoriesOrdered.push(firstCell.categoryName);
                                    }
                                });

                                return seats.map((row, rowIndex) => {
                                    const firstCell = row.find(c => c !== null && c.originalType !== 'path' && c.originalType !== 'empty' && c.originalType !== 'aisle');
                                    const rowLabel = firstCell?.row || '';

                                    // Determine if we need a category header
                                    const currentCategory = firstCell?.categoryName;
                                    const showHeader = currentCategory && currentCategory !== lastCategoryName;

                                    if (showHeader) {
                                        lastCategoryName = currentCategory;
                                    }

                                    // Premium styling for Platinum/Gold/Sofa
                                    const categoryIndex = categoriesOrdered.indexOf(currentCategory);
                                    const isPremiumCategory = categoryIndex >= 2 || currentCategory?.toLowerCase() === 'platinum' || currentCategory?.toLowerCase() === 'gold' || currentCategory?.toLowerCase() === 'sofa';

                                    return (
                                        <React.Fragment key={rowIndex}>
                                            {showHeader && (
                                                <div className="w-full flex items-center gap-4 my-6 opacity-60">
                                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                                                    <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
                                                        <span>₹{firstCell.basePrice}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span>{currentCategory}</span>
                                                    </div>
                                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                                                </div>
                                            )}
                                            <div className="flex gap-1.5 items-center shrink-0 w-full justify-center">
                                                {/* Row Label */}
                                                <div className="w-6 text-center text-xs font-bold text-slate-400 mr-2 shrink-0">
                                                    {rowLabel}
                                                </div>

                                                {/* Seats */}
                                                {row.map((seat, colIndex) => {
                                                    if (!seat || seat.type === 'path' || seat.originalType === 'path' || seat.originalType === 'empty' || seat.originalType === 'aisle') {
                                                        return <div key={`path-${seat?.id || colIndex}`} className="w-8 h-8 md:w-10 md:h-10 shrink-0 opacity-0" />;
                                                    }

                                                    // Styles — exact TMS logic
                                                    let seatStyle = "border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50 text-slate-600 shadow-sm";

                                                    if (seat.status === 'booked' || seat.status === 'reserved') {
                                                        seatStyle = "bg-slate-100 text-slate-300 cursor-not-allowed border-transparent shadow-none";
                                                    } else if (seat.status === 'selected') {
                                                        seatStyle = "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/50 transform scale-110 z-10 font-black";
                                                    } else if (isPremiumCategory) {
                                                        seatStyle = "border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100";
                                                    }

                                                    return (
                                                        <button
                                                            key={seat.id}
                                                            onClick={() => handleSeatClick(rowIndex, colIndex)}
                                                            disabled={seat.status === 'booked' || seat.status === 'reserved'}
                                                            title={`${seat.row}${seat.number} - ₹${seat.basePrice}`}
                                                            className={`relative w-8 h-8 md:w-10 md:h-10 rounded-lg shrink-0 flex items-center justify-center transition-all duration-300 border shadow-sm text-[10px] md:text-xs font-black ${seatStyle}`}
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
                        <span className="text-slate-400 text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Screen</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 px-5 py-3 md:py-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 pointer-events-auto transform transition-transform hover:-translate-y-1 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border border-slate-300 bg-white shadow-sm"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border-amber-300/50 bg-amber-50 shadow-sm"></div>
                        <span className="text-amber-600">Premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]"></div>
                        <span className="text-indigo-600">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded bg-slate-100 text-slate-300 border border-slate-200 font-bold flex items-center justify-center">×</div>
                        <span>Booked</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatLayout;
