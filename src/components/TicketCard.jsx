import React from 'react';
import BookingQr from './BookingQr';
import { Calendar, Monitor, Armchair, MapPin } from 'lucide-react';
import { optimizeImage } from '../utils/helpers';

const TicketCard = ({ ticket, onClick }) => {
    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div
            onClick={onClick}
            className={`relative w-full max-w-sm mx-auto cursor-pointer group`}
        >
            {/* Main Ticket Container */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">

                {/* Header Section (Gradient) */}
                <div className="bg-gradient-to-br from-xynemaRose via-charcoalSlate to-charcoalSlate p-6 text-white relative">
                    <div className="flex gap-4">
                        {/* Poster */}
                        <div className="w-20 h-28 rounded-xl overflow-hidden shadow-lg flex-shrink-0 border border-white/20">
                            <img
                                src={optimizeImage(ticket.portraitPosterUrl || ticket.landscapePosterUrl || ticket.posterUrl, { width: 200, quality: 80 }) || 'https://placehold.co/400x600/666/FFFFFF.png?text=No%20Image'}
                                alt={ticket.movieTitle}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Movie Info */}
                        <div className="flex flex-col justify-center">
                            <h3 className="text-xl font-display font-black tracking-tighter uppercase leading-tight ">
                                {ticket.movieTitle}
                            </h3>
                            <p className="text-black/70 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                <MapPin size={10} className="text-black" /> {ticket.theaterName}
                            </p>
                            <p className="text-black/60 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={10} className="text-black" /> {formatDate(ticket.date)} | {ticket.time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Perforated Divider (Premium Style) */}
                <div className="relative h-6 bg-white flex items-center justify-between">
                    {/* Left Cutout */}
                    <div className="absolute -left-3 w-6 h-6 bg-[#F5F5FA] rounded-full z-10" />

                    {/* Perforation Line */}
                    <div className="w-full mx-6 border-t-2 border-dashed border-gray-100" />

                    {/* Right Cutout */}
                    <div className="absolute -right-3 w-6 h-6 bg-[#F5F5FA] rounded-full z-10" />
                </div>

                {/* Bottom Section */}
                <div className="bg-white p-6 pt-0 flex justify-between items-center">
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Monitor size={10} /> Screen
                            </p>
                            <p className="text-base font-black tracking-tighter text-charcoalSlate uppercase">
                                {typeof ticket.screen === 'object' ? (ticket.screen.name || ticket.screen.screenName || '1') : ticket.screen}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Armchair size={10} /> Seats
                            </p>
                            <p className="text-base font-black tracking-tighter text-xynemaRose uppercase truncate max-w-[150px]">
                                {Array.isArray(ticket.seats)
                                    ? ticket.seats.map(s => typeof s === 'object' ? (s.seatLabel || s.seatNumber) : s).join(', ')
                                    : String(ticket.seats)}
                            </p>
                        </div>
                    </div>

                    {/* Mini QR */}
                    <div className="scale-90 origin-right">
                        <BookingQr booking={ticket} size={80} />
                    </div>
                </div>
            </div>

            {/* Decorative Shadows for "Floating" effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-xynemaRose to-premiumGold rounded-3xl blur opacity-10 group-hover:opacity-20 transition-opacity -z-10" />
        </div>
    );
};

export default TicketCard;
