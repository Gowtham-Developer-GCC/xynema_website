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

            <div className="relative w-full max-w-[720px] bg-white rounded-[44px] shadow-[0_45px_110px_-25px_rgba(0,0,0,0.18)] overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-10 right-10 p-2.5 rounded-full hover:bg-slate-50 text-slate-200 transition-colors z-40"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-10 md:p-14 flex flex-col items-center">
                    {/* Ticket Stack Illustration */}
                    <div className="relative w-full max-w-[440px] aspect-[16/10] mb-12 flex items-center justify-center">
                        <div className="relative w-[300px] h-[185px]">
                            {animateTickets && [...Array(selectedCount)].map((_, i) => {
                                const reverseIndex = selectedCount - 1 - i;
                                const rotation = - (reverseIndex * 3.5);
                                const xOffset = reverseIndex * 1.5;
                                const yOffset = reverseIndex * 3.5;
                                const delay = i * 140;

                                return (
                                    <div
                                        key={`${selectedCount}-${i}`}
                                        className="absolute inset-0 bg-white border border-slate-100/70 rounded-[28px] shadow-[0_12px_35px_rgba(0,0,0,0.06)] ticket-fall overflow-hidden"
                                        style={{
                                            '--rotation': `${rotation}deg`,
                                            '--x': `${xOffset}px`,
                                            '--y': `${yOffset}px`,
                                            zIndex: 30 - reverseIndex,
                                            animationDelay: `${delay}ms`,
                                        }}
                                    >
                                        {/* Corner Accents on ALL tickets */}
                                        <div className={`absolute top-0 right-0 w-11 h-11 bg-[#2e4c73] rounded-bl-[44px] transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-30'}`} />
                                        <div className={`absolute bottom-0 left-0 w-11 h-11 bg-[#2e4c73] rounded-tr-[44px] transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-30'}`} />

                                        {/* Branding elements for all tickets (simplified for background ones) */}
                                        <div className="w-full h-full p-7 flex flex-col justify-between relative">
                                            <div className={`flex justify-between items-start transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-20'}`}>
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.18em]">Ticket</p>
                                                    <h2 className="text-7xl font-black text-[#2e4c73] leading-none">#{selectedCount}</h2>
                                                </div>

                                                <div className="w-16 h-16 rounded-full bg-[#2e4c73] flex items-center justify-center text-white shadow-xl mt-1">
                                                    <Users className="w-8 h-8" />
                                                </div>
                                            </div>

                                            {/* Dotted Divider & Admit One for all tickets */}
                                            <div className={`absolute left-[45%] top-0 bottom-0 flex flex-col items-center justify-center gap-1.5 py-4 transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-20'}`}>
                                                {[...Array(11)].map((_, dotIdx) => (
                                                    <div key={dotIdx} className="w-2 h-2 rounded-full bg-slate-50" />
                                                ))}
                                            </div>

                                            <div className={`w-full flex justify-center items-center py-4 border-t border-slate-50/50 mt-4 transition-opacity duration-1000 ${reverseIndex === 0 ? 'opacity-100' : 'opacity-10'}`}>
                                                <span className="text-[10px] font-black text-slate-350 uppercase tracking-[0.45em] whitespace-nowrap">
                                                    Admit One
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Number Selector - Increased Width & No Scroll */}
                    <div className="w-full relative mb-12 px-2">
                        <div className="flex justify-center items-center gap-4 py-2 relative z-10">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setSelectedCount(num)}
                                    className={`
                                        w-12 h-12 rounded-full flex items-center justify-center text-lg font-black transition-all duration-500 shrink-0
                                        ${selectedCount === num
                                            ? 'bg-[#1e293b] text-white shadow-[0_12px_25px_rgba(30,41,59,0.25)] scale-110 ring-8 ring-slate-50'
                                            : 'bg-white border border-slate-100 text-slate-300 hover:border-[#1e293b] hover:text-[#1e293b]'}
                                    `}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        {/* Grey track under numbers */}
                        <div className="absolute bottom-[-6px] left-[5%] right-[5%] h-[6px] bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-300 transition-all duration-500 rounded-full"
                                style={{ width: `${(selectedCount / 10) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Category Pricing Summary */}
                    <div className="w-full grid grid-cols-3 gap-6 mb-12">
                        {categories.map((cat, i) => (
                            <div key={i} className="flex flex-col items-center p-6 rounded-[32px] bg-slate-50/10 border border-slate-100/50 hover:bg-white hover:border-slate-200 transition-all duration-500 group">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center leading-tight group-hover:text-slate-500 transition-colors">
                                    {cat.label}
                                </span>
                                <span className="text-xl font-black text-[#1e293b]">₹{cat.price}</span>
                                <div className="mt-4 px-3 py-1 rounded-full bg-white border border-slate-100 flex items-center gap-2 shadow-sm">
                                    <div className={`w-1.5 h-1.5 rounded-full ${cat.status === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                        {cat.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Primary CTA */}
                    <button
                        onClick={handleSelect}
                        className="w-full py-7 rounded-[32px] bg-[#1a2b4b] text-white font-black text-sm uppercase tracking-[0.5em] shadow-[0_25px_50px_-10px_rgba(26,43,75,0.4)] hover:bg-[#111c32] hover:-translate-y-1.5 transition-all active:scale-[0.98] active:translate-y-0"
                    >
                        SELECT {selectedCount} {selectedCount === 1 ? 'SEAT' : 'SEATS'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeatCountModal;
