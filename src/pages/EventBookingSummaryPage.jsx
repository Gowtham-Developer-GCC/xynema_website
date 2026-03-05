import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, Phone, Plus, X, CreditCard, CheckCircle } from 'lucide-react';
import { confirmEventBooking } from '../services/eventService';
import LoadingScreen from '../components/LoadingScreen';

const EventBookingSummaryPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { event, reservationId, selectedTickets, totalAmount, selectedDate, selectedTime } = location.state || {};

    const [attendees, setAttendees] = useState([{
        name: '',
        email: '',
        phone: '',
        ticketClassId: selectedTickets?.[0]?.ticketClassId || '',
        className: selectedTickets?.[0]?.className || ''
    }]);
    const [isConfirming, setIsConfirming] = useState(false);
    const [booked, setBooked] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [errors, setErrors] = useState({});

    // Calculate total tickets for max attendee limit
    const totalTickets = selectedTickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;

    // Build available ticket classes for adding attendees
    const availableTicketClasses = [];
    selectedTickets?.forEach(ticket => {
        for (let i = 0; i < ticket.quantity; i++) {
            availableTicketClasses.push({
                ticketClassId: ticket.ticketClassId,
                className: ticket.className
            });
        }
    });

    useEffect(() => {
        if (!event || !reservationId) {
            navigate('/events');
        }
    }, [event, reservationId, navigate]);

    const addAttendee = () => {
        if (attendees.length < totalTickets) {
            const nextTicket = availableTicketClasses[attendees.length];
            setAttendees([...attendees, {
                name: '',
                email: '',
                phone: '',
                ticketClassId: nextTicket.ticketClassId,
                className: nextTicket.className
            }]);
        }
    };

    const removeAttendee = (index) => {
        if (index > 0) { // Can't remove first attendee
            setAttendees(attendees.filter((_, i) => i !== index));
        }
    };

    const updateAttendee = (index, field, value) => {
        const updated = [...attendees];
        updated[index][field] = value;
        setAttendees(updated);

        // Clear error for this field
        if (errors[`${index}-${field}`]) {
            const newErrors = { ...errors };
            delete newErrors[`${index}-${field}`];
            setErrors(newErrors);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        attendees.forEach((attendee, index) => {
            if (!attendee.name.trim()) {
                newErrors[`${index}-name`] = 'Name is required';
            }

            if (!attendee.email.trim()) {
                newErrors[`${index}-email`] = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)) {
                newErrors[`${index}-email`] = 'Invalid email format';
            }

            if (!attendee.phone.trim()) {
                newErrors[`${index}-phone`] = 'Phone is required';
            } else if (!/^[6-9]\d{9}$/.test(attendee.phone)) {
                newErrors[`${index}-phone`] = 'Invalid phone number';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = async () => {
        if (!validateForm()) return;

        setIsConfirming(true);
        try {
            const bookingData = {
                paymentDetails: {
                    method: 'upi',
                    transactionId: `UPI_TXN_${Date.now()}`,
                    gateway: 'razorpay',
                    details: {
                        upiId: 'user@paytm',
                        razorpayOrderId: `order_${Date.now()}`,
                        razorpayPaymentId: `pay_${Date.now()}`
                    }
                },
                attendees: attendees.map(a => ({
                    name: a.name.trim(),
                    email: a.email.trim(),
                    phone: a.phone.trim(),
                    ticketClassId: a.ticketClassId
                })),
                source: 'web'
            };

            const result = await confirmEventBooking(reservationId, bookingData);

            if (result.success) {
                setBookingResult(result.data);
                setBooked(true);
            } else {
                alert('Failed to confirm booking. Please try again.');
            }
        } catch (error) {
            console.error('Booking confirmation error:', error);
            alert('Error: ' + (error.message || 'Failed to confirm booking'));
        } finally {
            setIsConfirming(false);
        }
    };

    if (!event) return null;

    // Success State - Ultra Minimal & Premium
    if (booked) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto border-2 border-green-100">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                            Booking Successful!
                        </h1>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                            Your reservation for <span className="text-xynemaRose font-black">{event.name}</span> has been confirmed.
                            A confirmation email is on its way.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/events-bookings', { replace: true })}
                            className="w-full bg-xynemaRose text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-xl shadow-black/10"
                        >
                            View All Bookings
                        </button>
                        <button
                            onClick={() => navigate('/', { replace: true })}
                            className="w-full bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-gray-100 transition-all"
                        >
                            BACK TO HOME
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header (Matching mobile AppBar) */}
            <div className="sticky top-0 z-50 bg-xynemaRose text-white shadow-xl">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-sm font-black tracking-[0.2em] uppercase">BOOKING SUMMARY</h1>
                    <div className="w-9" /> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Event Header Card */}
                <div className="bg-white border-2 border-black/5 rounded-2xl p-6 mb-8 transform transition-all">
                    <div className="flex gap-6 items-center">
                        <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-20 h-28 object-cover rounded-xl shadow-xl shadow-black/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tighter uppercase truncate">
                                {event.name}
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                                    <Calendar size={14} className="text-xynemaRose" />
                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                                        {new Date(selectedDate || event.startDate).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                                    <Clock size={14} className="text-xynemaRose" />
                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{selectedTime || event.startTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ticket Summary */}
                <div className="bg-white border-2 border-black/5 rounded-2xl p-6 mb-8">
                    <h3 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-6">Your Selection</h3>
                    <div className="space-y-4">
                        {selectedTickets?.map((ticket, index) => (
                            <div key={index} className="flex justify-between items-center group">
                                <span className="text-sm font-black text-gray-800 uppercase tracking-tight">
                                    {ticket.className} <span className="text-gray-400 mx-2">×</span> {ticket.quantity}
                                </span>
                                <span className="text-sm font-black text-xynemaRose">
                                    ₹{ticket.totalPrice}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 mt-6 pt-6">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Amount</span>
                            <span className="text-2xl font-black text-xynemaRose tracking-tighter">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Attendee Forms */}
                <div className="bg-white border-2 border-black/5 rounded-2xl p-6">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-2">Attendee Details</h3>
                            <p className="text-[10px] font-black text-xynemaRose uppercase tracking-widest">
                                {attendees.length} / {totalTickets} slots filled
                            </p>
                        </div>
                        {attendees.length < totalTickets && (
                            <button
                                onClick={addAttendee}
                                className="flex items-center gap-2 bg-gray-50 text-gray-900 font-black text-[10px] px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all uppercase tracking-widest shadow-sm"
                            >
                                <Plus size={14} />
                                Add Attendee
                            </button>
                        )}
                    </div>

                    <div className="space-y-8">
                        {attendees.map((attendee, index) => (
                            <div key={index} className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                {/* Attendee Header */}
                                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-xynemaRose/10 flex items-center justify-center text-xynemaRose border border-rose-100">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-gray-900 uppercase">
                                                    {index === 0 ? 'Primary Attendee' : `Attendee ${index + 1}`}
                                                </span>
                                                {index === 0 && (
                                                    <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest">
                                                        MANDATORY
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {index > 0 && (
                                        <button
                                            onClick={() => removeAttendee(index)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Enter full name"
                                                value={attendee.name}
                                                onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl text-sm font-bold transition-all ${errors[`${index}-name`] ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:bg-white focus:border-xynemaRose'
                                                    } outline-none`}
                                            />
                                        </div>
                                        {errors[`${index}-name`] && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">{errors[`${index}-name`]}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                value={attendee.email}
                                                onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl text-sm font-bold transition-all ${errors[`${index}-email`] ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:bg-white focus:border-xynemaRose'
                                                    } outline-none`}
                                            />
                                        </div>
                                        {errors[`${index}-email`] && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">{errors[`${index}-email`]}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder="10-digit mobile"
                                                value={attendee.phone}
                                                onChange={(e) => updateAttendee(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                maxLength={10}
                                                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl text-sm font-bold transition-all ${errors[`${index}-phone`] ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:bg-white focus:border-xynemaRose'
                                                    } outline-none`}
                                            />
                                        </div>
                                        {errors[`${index}-phone`] && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">{errors[`${index}-phone`]}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Confirm Button */}
                    <div className="mt-12 pb-20">
                        <button
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="w-full bg-xynemaRose text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-2xl hover:bg-xynemaRose/90 transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
                        >
                            {isConfirming ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    PROCESSING...
                                </div>
                            ) : (
                                'CONTINUE TO PAYMENT'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventBookingSummaryPage;
