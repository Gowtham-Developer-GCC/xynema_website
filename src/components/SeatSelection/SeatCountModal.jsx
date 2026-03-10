import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';

const SeatCountModal = ({ isOpen, onClose, onSelect, pricing }) => {
    const [selectedCount, setSelectedCount] = useState(2);
    const [animateTickets, setAnimateTickets] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimateTickets(false);
            const timer = setTimeout(() => setAnimateTickets(true), 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, selectedCount]);

    if (!isOpen) return null;

    const handleSelect = () => {
        onSelect(selectedCount);
        onClose();
    };

    // Match the exact categories from the latest screenshot
    const categories = pricing || [
        { label: 'NORMAL SEAT', price: 100, status: 'AVAILABLE' },
        { label: 'WHEELCHAIR / ACCESSIBLE', price: 100, status: 'AVAILABLE' },
        { label: 'RECLINER SEAT', price: 200, status: 'AVAILABLE' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-500">
            <style>
                {`
                @keyframes ticketFall {
                    0% { transform: translateY(-120px) rotate(-10deg); opacity: 0; }
                    100% { transform: translateY(0) rotate(var(--rotation)) translate(var(--x), var(--y)); opacity: 1; }
                }
                .ticket-fall {
                    animation: ticketFall 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    opacity: 0;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
            </style>

            <div className="relative w-full max-w-[480px] bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_45px_110px_-25px_rgba(0,0,0,0.18)] dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-200 dark:text-gray-700 transition-colors z-40"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 md:p-8 flex flex-col items-center">
                    {/* Ticket Stack Illustration */}
                    <div className="relative w-full max-w-[280px] aspect-[16/9] mb-6 flex items-center justify-center">
                        <div className="relative w-[180px] h-[110px]">
                            {animateTickets && [...Array(selectedCount)].map((_, i) => {
                                const reverseIndex = selectedCount - 1 - i;
                                const rotation = - (reverseIndex * 3);
                                const xOffset = reverseIndex * 1;
                                const yOffset = reverseIndex * 2.5;
                                const delay = i * 120;

                                return (
                                    <div
                                        key={`${selectedCount}-${i}`}
                                        className="absolute inset-0 bg-white dark:bg-gray-800 border border-slate-100/70 dark:border-gray-700 rounded-[22px] shadow-[0_8px_25px_rgba(0,0,0,0.06)] ticket-fall overflow-hidden"
                                        style={{
                                            '--rotation': `${rotation}deg`,
                                            '--x': `${xOffset}px`,
                                            '--y': `${yOffset}px`,
                                            zIndex: 30 - reverseIndex,
                                            animationDelay: `${delay}ms`,
                                        }}
                                    >
                                        <div className={`absolute top-0 right-0 w-8 h-8 bg-indigo-600 dark:bg-indigo-500/20 rounded-bl-[32px] transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-30'}`} />
                                        <div className={`absolute bottom-0 left-0 w-8 h-8 bg-indigo-600 dark:bg-indigo-500/20 rounded-tr-[32px] transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-30'}`} />

                                        <div className="w-full h-full p-4 flex flex-col justify-between relative">
                                            <div className={`flex justify-between items-start transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-20'}`}>
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-bold text-slate-300 dark:text-gray-500 uppercase tracking-[0.18em]">Ticket</p>
                                                    <h2 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-none">#{i + 1}</h2>
                                                </div>

                                                <div className="w-12 h-12 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-xl mt-0.5">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                            </div>

                                            <div className={`w-full flex justify-center items-center py-3 border-t border-slate-50/50 dark:border-gray-800 mt-3 transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-10'}`}>
                                                <span className="text-[8px] font-black text-slate-350 dark:text-gray-600 uppercase tracking-[0.45em] whitespace-nowrap">
                                                    Admit One
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Number Selector */}
                    <div className="w-full relative mb-8 px-2 group/track">
                        <div className="flex justify-center items-center gap-1.5 py-2 relative z-10 px-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setSelectedCount(num)}
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 shrink-0
                                        ${selectedCount === num
                                            ? 'bg-indigo-600 text-white shadow-[0_12px_25px_rgba(79,70,229,0.3)] dark:shadow-indigo-500/20 scale-110 ring-4 ring-indigo-50 dark:ring-indigo-900/30'
                                            : 'bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 text-slate-300 dark:text-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400'}
                                    `}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="absolute bottom-[-10px] left-[15%] right-[15%] h-[3px] bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                                style={{ width: `${(selectedCount / 10) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Category Pricing Summary - Single line, no borders/hover */}
                    <div className="w-full flex items-center justify-center gap-6 mb-10 overflow-x-auto no-scrollbar pb-2">
                        {categories.map((cat, i) => (
                            <div key={i} className="flex flex-col items-center min-w-fit px-2 transition-colors">
                                <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 text-center leading-tight whitespace-nowrap">
                                    {cat.label}
                                </span>
                                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">₹{cat.price}</span>
                                <div className="mt-2.5 flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${cat.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-[9px] font-bold text-slate-350 dark:text-gray-600 uppercase tracking-widest leading-none">
                                        {cat.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Primary CTA */}
                    <button
                        onClick={handleSelect}
                        className="w-full py-5 rounded-[28px] bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] dark:shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-[0.98] active:translate-y-0"
                    >
                        SELECT {selectedCount} {selectedCount === 1 ? 'SEAT' : 'SEATS'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeatCountModal;
