import React, { useState, useEffect } from 'react';
import { getShowSeats } from '../../services/bookingService';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const SeatLayout = ({ showId, selectedSeats = [], onSeatChange, maxSeatCount = 10, showToast }) => {
    const [seats, setSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Synchronize internal matrix state with external selectedSeats prop
    useEffect(() => {
        if (seats.length === 0) return;

        // Check if any sync is actually needed to avoid loops or redundant renders
        const needsSync = seats.some(row =>
            row.some(seat => {
                if (!seat || seat.type === 'path' || seat.status === 'booked' || seat.status === 'reserved') return false;
                const isSelectedInProp = selectedSeats.some(s => s.id === seat.id);
                return (isSelectedInProp && seat.status !== 'selected') || (!isSelectedInProp && seat.status === 'selected');
            })
        );

        if (!needsSync) return;

        setSeats(prevSeats =>
            prevSeats.map(row =>
                row.map(seat => {
                    if (!seat || seat.type === 'path' || seat.status === 'booked' || seat.status === 'reserved') return seat;

                    const isSelectedInProp = selectedSeats.some(s => s.id === seat.id);
                    if (isSelectedInProp && seat.status !== 'selected') {
                        return { ...seat, status: 'selected' };
                    }
                    if (!isSelectedInProp && seat.status === 'selected') {
                        return { ...seat, status: 'available' };
                    }
                    return seat;
                })
            )
        );
    }, [selectedSeats, seats.length]);

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

    const [isAnimating, setIsAnimating] = React.useState(false);

    const handleSeatClick = (rowIndex, colIndex) => {
        if (isAnimating) return;
        const seat = seats[rowIndex][colIndex];
        if (!seat) return;
        if (seat.type === 'path' || seat.originalType === 'path' || seat.status === 'booked' || seat.status === 'reserved' || seat.status === 'disabled') return;

        const currentlySelected = seats.flat().filter(s => s && s.status === 'selected');
        const isSelected = seat.status === 'selected';

        // DESELECTION: Just flip the status of the clicked seat
        if (isSelected) {
            const newSeats = seats.map((row, ri) =>
                row.map((cell, ci) => {
                    if (ri === rowIndex && ci === colIndex) {
                        return { ...cell, status: 'available' };
                    }
                    return cell;
                })
            );
            setSeats(newSeats);
            if (onSeatChange) {
                onSeatChange(newSeats.flat().filter(s => s && s.status === 'selected'));
            }
            return;
        }

        // SELECTION: Try to fill remaining seats needed starting from this seat
        const remainingNeeded = maxSeatCount - currentlySelected.length;

        if (remainingNeeded > 0) {
            const row = seats[rowIndex];
            const seatsToSelect = [];
            seatsToSelect.push({ r: rowIndex, c: colIndex });

            // Only auto-select more if we need more than 1
            if (remainingNeeded > 1) {
                // 1. Try scanning Right
                let nextCol = colIndex + 1;
                while (nextCol < row.length && seatsToSelect.length < remainingNeeded) {
                    const s = row[nextCol];
                    if (s && s.status === 'available' && s.type !== 'path' && s.originalType !== 'path') {
                        seatsToSelect.push({ r: rowIndex, c: nextCol });
                    } else {
                        break; // Gap or blocked
                    }
                    nextCol++;
                }

                // 2. If not enough, try scanning Left from the original seat
                if (seatsToSelect.length < remainingNeeded) {
                    let prevCol = colIndex - 1;
                    while (prevCol >= 0 && seatsToSelect.length < remainingNeeded) {
                        const s = row[prevCol];
                        if (s && s.status === 'available' && s.type !== 'path' && s.originalType !== 'path') {
                            seatsToSelect.push({ r: rowIndex, c: prevCol });
                        } else {
                            break;
                        }
                        prevCol--;
                    }
                }
            }

            // STAGGERED ANIMATION SELECTION
            setIsAnimating(true);

            // We'll update the seats one by one
            let currentSelectionIdx = 0;
            const animateSelection = () => {
                if (currentSelectionIdx >= seatsToSelect.length) {
                    setIsAnimating(false);
                    return;
                }

                const target = seatsToSelect[currentSelectionIdx];
                setSeats(prev => prev.map((row, ri) =>
                    row.map((cell, ci) => {
                        if (ri === target.r && ci === target.c) {
                            return { ...cell, status: 'selected' };
                        }
                        return cell;
                    })
                ));

                // Notify parent immediately for smooth summary update
                const currentlyApplied = seatsToSelect.slice(0, currentSelectionIdx + 1);
                const allSelected = [...currentlySelected, ...currentlyApplied.map(t => seats[t.r][t.c])];
                if (onSeatChange) onSeatChange(allSelected);

                currentSelectionIdx++;
                setTimeout(animateSelection, 40); // 40ms stagger
            };

            animateSelection();

        } else {
            // Standard single selection (if already started or max is 1)
            if (currentlySelected.length >= maxSeatCount) {
                if (showToast) {
                    showToast(`You can only select up to ${maxSeatCount} seats`, 'warning');
                }
                return;
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-slate-400 tracking-widest uppercase font-display">Fetching live seat layout...</p>
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
        <div className="relative w-full h-[calc(100vh-220px)] md:h-[calc(100vh-190px)] min-h-[500px] overflow-hidden bg-slate-50/50 dark:bg-gray-900/50 rounded-3xl border border-slate-200/60 dark:border-gray-800 shadow-sm group font-sans">

            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg rounded-xl flex items-center p-1.5 gap-1 border border-slate-200/50 dark:border-gray-700/50">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 tracking-wider px-2 pointer-events-none">Scroll to Zoom • Drag to Pan</div>
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
                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
                        <div className="flex flex-col gap-1.5 items-center justify-center p-16 md:p-32 pb-48 w-fit mx-auto">
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
                                                <div className="w-full flex flex-col items-center my-4">
                                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 tracking-wide font-display">
                                                        <span>{currentCategory}</span>
                                                        <span className="font-medium text-gray-800 dark:text-gray-200 tracking-normal">₹{firstCell.basePrice}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-2 min-w-max items-center justify-center p-1">
                                                {/* Left Row Label */}
                                                <div className="w-6 flex items-center justify-center text-[10px] font-medium text-gray-900 dark:text-gray-300 mr-2 shrink-0">
                                                    {rowLabel}
                                                </div>

                                                {/* Seats */}
                                                {row.map((seat, colIndex) => {
                                                    if (!seat || seat.type === 'path' || seat.originalType === 'path' || seat.originalType === 'empty' || seat.originalType === 'aisle') {
                                                        return <div key={`path-${seat?.id || colIndex}`} className="w-8 h-8 md:w-[34px] md:h-[34px] shrink-0 opacity-0" />;
                                                    }

                                                    // Styles based on Figma
                                                    let seatStyle = "border-[#cbd5e1] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#475569] dark:text-gray-400 hover:border-[#64748b] dark:hover:border-gray-500 transition-colors";

                                                    if (seat.status === 'booked' || seat.status === 'reserved') {
                                                        seatStyle = "bg-[#94a3b8] dark:bg-gray-700 border-[#94a3b8] dark:border-gray-700 text-white/40 dark:text-white/20 cursor-not-allowed pointer-events-none"; // Solid gray booked state with visible text
                                                    } else if (seat.status === 'selected') {
                                                        seatStyle = "bg-primary border-primary text-white font-bold scale-105 shadow-md z-10 animate-in zoom-in-95 duration-200"; // Solid primary color selected state with pop effect
                                                    }

                                                    return (
                                                        <button
                                                            key={seat.id}
                                                            onClick={() => handleSeatClick(rowIndex, colIndex)}
                                                            disabled={seat.status === 'booked' || seat.status === 'reserved'}
                                                            title={`${seat.row}${seat.number} - ₹${seat.basePrice}`}
                                                            className={`relative w-8 h-8 md:w-[34px] md:h-[34px] rounded-[6px] shrink-0 flex items-center justify-center border text-[10px] font-medium leading-none transition-all duration-300 transform active:scale-90 ${seatStyle}`}
                                                        >
                                                            {seat.number}
                                                        </button>
                                                    );
                                                })}

                                                {/* Right Row Label */}
                                                <div className="w-6 flex items-center justify-center text-[10px] font-medium text-gray-900 dark:text-gray-300 ml-2 shrink-0">
                                                    {rowLabel}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                });
                            })()}

                            {/* Repositioned Screen Element (Figma Style) */}
                            <div className="w-full max-w-[800px] mt-24 mb-16 opacity-90 relative flex flex-col items-center">
                                <span className="text-gray-400 dark:text-gray-500 text-[10px] font-semibold tracking-widest uppercase mb-4">Screen This Way</span>
                                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
                                <div className="h-2 w-full bg-gradient-to-b from-gray-100 dark:from-gray-800 to-transparent opacity-50"></div>
                            </div>
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>
        </div>
    );
};

export default SeatLayout;
