import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Clock, Info, ChevronDown, 
    CreditCard, Wallet, Landmark, ShieldCheck 
} from 'lucide-react';
import { cancelParkReservation } from '../services/parkService';
import PaymentButton from '../components/PaymentButton';
import SEO from '../components/SEO';

const ParkPaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { 
        park, selectedDate, counts, totalPrice: subtotalPrice, 
        ticketTypes, reservationId, bookingDayId, pricing 
    } = location.state || {};

    const finalAmount = pricing?.totalAmount || pricing?.total || subtotalPrice || 0;
    
    // Safety check for navigation
    useEffect(() => {
        if (!location.state) {
            navigate('/activities');
        }
    }, [location.state, navigate]);

    useEffect(() => {
        console.log("PAYMENT PAGE STATE:", location.state);
    }, [location.state]);

    const [isCancelling, setIsCancelling] = useState(false);
    const hasCancelled = useRef(false);
    const isPaymentComplete = useRef(false);

    // Timer
    const [timeLeft, setTimeLeft] = useState(459); // 07:39 in seconds as in mockup
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // Handle browser back button
    useEffect(() => {
        window.history.pushState(null, null, window.location.pathname);
        const handleBrowserBack = (e) => {
            e.preventDefault();
            handleBack();
        };

        window.addEventListener('popstate', handleBrowserBack);
        return () => window.removeEventListener('popstate', handleBrowserBack);
    }, [reservationId, bookingDayId, ticketTypes, counts]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleBack = async () => {
        if (isCancelling || hasCancelled.current) {
            navigate(-1);
            return;
        }
        
        setIsCancelling(true);
        hasCancelled.current = true;
        try {
            if (reservationId && typeof reservationId === 'string' && !reservationId.includes('[object')) {
                const ticketsPayload = ticketTypes
                    .filter(t => (counts[t.id] || 0) > 0)
                    .map(t => ({
                        ticketId: t.id,
                        quantity: counts[t.id]
                    }));
                
                await cancelParkReservation({
                    reservationId,
                    bookingDayId,
                    tickets: ticketsPayload
                });
            }
        } catch (err) {
            console.error("Cancellation failed:", err);
        } finally {
            navigate(-1);
        }
    };

    // User Info
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Coupons
    const [coupon, setCoupon] = useState('');
    const [isCouponOpen, setIsCouponOpen] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState('upi');

    if (!location.state) return null;

    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-[#0f1115] transition-colors duration-300 pb-24">
            <SEO title={`Secure Checkout - ${park?.shortName || park?.name}`} />
            
            {/* Custom Header with Back Button */}
            <div className="bg-white dark:bg-[#16181d] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-6">
                    <button 
                        onClick={handleBack} 
                        disabled={isCancelling}
                        className="p-2 -ml-2 text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                         <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">Confirm & Pay</h1>
                         <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{park?.name}</p>
                    </div>
                </div>
            </div>
            
            {/* Timer Header */}
            <div className="bg-amber-50/80 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 py-3 flex items-center justify-center gap-3 animate-pulse">
                <Clock className="w-5 h-5 text-amber-500" />
                <p className="text-sm font-black text-amber-700 dark:text-amber-400">Seats reserved for <span className="font-mono text-base">{formatTime(timeLeft)}</span></p>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Contact Details */}
                        <section className="bg-white dark:bg-[#16181d] rounded-[40px] p-10 border border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8">Contact Details</h2>
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest block mb-3">Mobile Number *</label>
                                    <input 
                                        type="tel" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter 10 digit mobile number"
                                        className="w-full bg-[#F5F5FA] dark:bg-gray-800/50 border border-transparent focus:border-primary/30 rounded-2xl px-6 py-4 outline-none text-sm font-medium dark:text-white transition-all"
                                    />
                                    <p className="text-[9px] font-bold text-gray-400 mt-3">* Optional for non-Indian numbers (+91)</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest block mb-3">Email Address (Optional)</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email for ticket confirmation"
                                        className="w-full bg-[#F5F5FA] dark:bg-gray-800/50 border border-transparent focus:border-primary/30 rounded-2xl px-6 py-4 outline-none text-sm font-medium dark:text-white transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Coupons Section */}
                        <section className="bg-white dark:bg-[#16181d] rounded-[40px] p-10 border border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8">Apply coupons</h2>
                            <div className="flex gap-4 mb-8">
                                <input 
                                    type="text" 
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value)}
                                    placeholder="Enter coupon code"
                                    className="flex-1 bg-[#F5F5FA] dark:bg-gray-800/50 border border-transparent focus:border-primary/30 rounded-2xl px-6 py-4 outline-none text-sm font-medium dark:text-white transition-all"
                                />
                                <button className="px-8 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all">Apply</button>
                            </div>
                            
                            <div className="border-t border-gray-50 dark:border-gray-800 pt-6">
                                <button 
                                    onClick={() => setIsCouponOpen(!isCouponOpen)}
                                    className="w-full flex items-center justify-between group"
                                >
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Available coupons</p>
                                    <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform ${isCouponOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isCouponOpen && (
                                    <div className="mt-6">
                                        <div className="p-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between group hover:border-primary/20 transition-all cursor-pointer">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-gray-700 dark:text-gray-300">WELCOME50</p>
                                                <p className="text-xs font-bold text-gray-400">Save ₹50 on your first booking</p>
                                            </div>
                                            <button className="text-[10px] font-black text-primary uppercase tracking-widest">Apply</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Payment Methods */}
                        <section className="bg-white dark:bg-[#16181d] rounded-[40px] p-10 border border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8">Choose Payment Method</h2>
                            
                            {/* UPI Section */}
                            <div className="bg-[#F5F5FA] dark:bg-gray-800/20 rounded-[32px] p-8 mb-8 border border-gray-50 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                         <CreditCard className="w-5 h-5 text-primary" />
                                         <p className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Quick Pay with UPI</p>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5 px-3 py-1 rounded-full">Recommended</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Google Pay', 'PhonePe', 'Paytm'].map(app => (
                                        <div 
                                            key={app} 
                                            onClick={() => setSelectedMethod('upi')}
                                            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group ${
                                                selectedMethod === 'upi' ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                                            }`}
                                        >
                                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center transition-colors group-hover:bg-primary/10">
                                                <Wallet className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{app}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative flex items-center justify-center mb-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800"></div></div>
                                <span className="relative bg-white dark:bg-[#16181d] px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Or pay with</span>
                            </div>

                            {/* Other Methods */}
                            <div className="space-y-4">
                                {[
                                    { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, subtitle: 'Visa, Mastercard, Amex, Rupay' },
                                    { id: 'wallet', name: 'Wallets', icon: Wallet, subtitle: 'Amazon Pay, Mobikwik, Freecharge' },
                                    { id: 'netbanking', name: 'Net Banking', icon: Landmark, subtitle: 'All major banks supported' }
                                ].map((method) => (
                                    <div 
                                        key={method.id} 
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`bg-white dark:bg-transparent rounded-3xl p-6 border flex items-center justify-between cursor-pointer transition-all group ${
                                            selectedMethod === method.id ? 'border-primary bg-primary/5 dark:bg-primary/5 shadow-md ring-1 ring-primary/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-2xl transition-colors ${selectedMethod === method.id ? 'bg-primary/20' : 'bg-gray-50 dark:bg-gray-800 group-hover:bg-primary/10'}`}>
                                                <method.icon className={`w-6 h-6 transition-colors ${selectedMethod === method.id ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-1">{method.name}</h4>
                                                <p className="text-xs font-bold text-gray-400">{method.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedMethod === method.id ? 'bg-primary' : 'bg-gray-50 dark:bg-gray-800 group-hover:bg-primary group-hover:translate-x-1'}`}>
                                            <ChevronLeft className={`w-5 h-5 rotate-180 transition-colors ${selectedMethod === method.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="hidden lg:block">
                        <div className="sticky top-[110px] space-y-6">
                            <div className="bg-white dark:bg-[#16181d] rounded-[40px] p-10 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8">Booking Summary</h2>
                                
                                <div className="space-y-4 mb-8">
                                    {ticketTypes.map(t => counts[t.id] > 0 && (
                                        <div key={t.id} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-black text-gray-800 dark:text-gray-200">{t.label}</p>
                                                <p className="text-xs text-gray-400 font-bold">{counts[t.id]} Tickets</p>
                                            </div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">₹{(counts[t.id] * t.price).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>

                                {pricing && (
                                    <div className="space-y-3 mb-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                            <span>Subtotal</span>
                                            <span>₹{(pricing.subtotal || subtotalPrice).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                            <span>Convenience Fee</span>
                                            <span>₹{pricing.convenienceFee?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                            <span>Tax</span>
                                            <span>₹{pricing.tax?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mb-10">
                                    <div className="flex justify-between items-center mb-6">
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Total payable</p>
                                        <p className="text-2xl font-black text-primary">₹{finalAmount.toLocaleString()}</p>
                                    </div>
                                    <PaymentButton 
                                        amount={finalAmount}
                                        bookingData={{
                                            isPark: true,
                                            parkId: park.id || park._id,
                                            parkName: park.name || park.parkName,
                                            parkImage: park.images?.[0]?.url,
                                            parkCity: park.city,
                                            date: selectedDate.full,
                                            bookingDayId: bookingDayId,
                                            reservationId: reservationId,
                                            tickets: ticketTypes
                                                .filter(t => (counts[t.id] || 0) > 0)
                                                .map(t => ({
                                                    ticketId: t.id,
                                                    quantity: counts[t.id]
                                                })),
                                            phone: phone,
                                            email: email,
                                            selectedMethod
                                        }}
                                        onSuccess={() => {
                                            isPaymentComplete.current = true;
                                        }}
                                        disabled={isCancelling || !phone}
                                        className={`w-full py-5 text-white font-black tracking-widest uppercase rounded-2xl transition-all ${
                                            !phone || isCancelling
                                            ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                                            : 'bg-primary hover:bg-primary/90 active:scale-95 shadow-xl shadow-primary/20'
                                        }`}
                                    >
                                        Pay ₹{finalAmount.toLocaleString()}
                                    </PaymentButton>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-gray-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Secure checkout</span>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-[#16181d] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:text-primary transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <Info className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Cancellation Policy</span>
                                </div>
                                <ChevronDown className="w-5 h-5 text-gray-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-40">
                <div className="flex items-center justify-between gap-6 max-w-md mx-auto">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Payable</p>
                        <p className="text-xl font-black text-primary leading-none">₹{finalAmount.toLocaleString()}</p>
                    </div>
                    <PaymentButton 
                        amount={finalAmount}
                        bookingData={{
                            isPark: true,
                            parkId: park.id || park._id,
                            date: selectedDate.full,
                            bookingDayId: bookingDayId,
                            reservationId: reservationId,
                            tickets: ticketTypes
                                .filter(t => (counts[t.id] || 0) > 0)
                                .map(t => ({
                                    ticketId: t.id,
                                    quantity: counts[t.id]
                                })),
                            phone: phone,
                            email: email,
                            selectedMethod
                        }}
                        onSuccess={() => {
                            isPaymentComplete.current = true;
                        }}
                        disabled={isCancelling || !phone}
                        className={`flex-1 h-14 text-white font-black tracking-widest uppercase rounded-2xl transition-all flex items-center justify-center ${
                            !phone || isCancelling
                            ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                            : 'bg-primary shadow-xl shadow-primary/20'
                        }`}
                    >
                         Pay now
                    </PaymentButton>
                </div>
            </div>
        </div>
    );
};

export default ParkPaymentPage;
