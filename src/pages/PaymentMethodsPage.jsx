import React, { useState } from 'react';
import { ArrowLeft, Plus, CreditCard, Trash2, ShieldCheck, MoreVertical, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeContext';

const PaymentMethodsPage = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();

    const [cards, setCards] = useState([
        {
            id: 1,
            type: 'visa',
            last4: '4242',
            expiry: '12/26',
            holder: 'GOWTHAM MAYA LABS',
            isDefault: true,
            color: 'from-blue-600 to-blue-800'
        },
        {
            id: 2,
            type: 'mastercard',
            last4: '8812',
            expiry: '08/25',
            holder: 'GOWTHAM MAYA LABS',
            isDefault: false,
            color: 'from-orange-500 to-red-600'
        }
    ]);

    const [showAddCard, setShowAddCard] = useState(false);
    const [newCard, setNewCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

    const handleRemoveCard = (id) => {
        setCards(cards.filter(c => c.id !== id));
    };

    const handleSetDefault = (id) => {
        setCards(cards.map(c => ({
            ...c,
            isDefault: c.id === id
        })));
    };

    const CardIcon = ({ type }) => {
        if (type === 'visa') return <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4 md:h-5 invert dark:invert-0 brightness-0 dark:brightness-200" alt="Visa" />;
        return <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6 md:h-8" alt="Mastercard" />;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1115] transition-colors duration-300">
            <SEO 
                title="Payment Methods - XYNEMA" 
                description="Manage your saved cards and payment preferences for faster bookings."
            />

            {/* Header */}
            <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-[64px] md:top-[80px] z-[50]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                                Payment <span className="text-primary">Methods</span>
                            </h1>
                        </div>
                        <button 
                            onClick={() => setShowAddCard(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add Card
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Saved Cards List */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">
                            Your Saved Cards
                        </h2>
                        
                        {cards.map((card) => (
                            <div key={card.id} className="relative group">
                                {/* The Visual Card */}
                                <div className={`relative aspect-[1.58/1] w-full max-w-[400px] mx-auto bg-gradient-to-br ${card.color} rounded-[28px] p-6 md:p-8 text-white shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-1`}>
                                    <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[1px] rounded-[28px] pointer-events-none" />
                                    
                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <CardIcon type={card.type} />
                                            <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg opacity-80" />
                                        </div>

                                        <div className="mt-8">
                                            <div className="text-xl md:text-2xl font-black tracking-[0.2em] mb-4">
                                                ••••  ••••  •••• {card.last4}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <div className="text-[9px] font-black text-white/60 uppercase tracking-widest">Card Holder</div>
                                                    <div className="text-xs md:text-sm font-black tracking-widest uppercase truncate max-w-[150px]">{card.holder}</div>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <div className="text-[9px] font-black text-white/60 uppercase tracking-widest">Expires</div>
                                                    <div className="text-xs md:text-sm font-black tracking-widest uppercase">{card.expiry}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions Overlay */}
                                <div className="mt-4 flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        {card.isDefault ? (
                                            <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Primary Card
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleSetDefault(card.id)}
                                                className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-primary uppercase tracking-widest transition-colors"
                                            >
                                                Set as Default
                                            </button>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveCard(card.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {cards.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800/50 rounded-[40px] border border-dashed border-gray-100 dark:border-white/10">
                                <CreditCard className="w-12 h-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Cards Saved</h3>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">Add a card for seamless checkout</p>
                            </div>
                        )}
                    </div>

                    {/* Security & Info */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 pl-1">
                                Security Information
                            </h2>
                            <div className="bg-white dark:bg-gray-800/50 rounded-[40px] border border-gray-100 dark:border-white/5 p-8 backdrop-blur-md shadow-sm space-y-8">
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-2">PCI-DSS Compliant</h4>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
                                            Your card details are encrypted and stored securely according to industry standards.
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-white/5" />

                                <div className="flex gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-2">Safe CVV Policy</h4>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">
                                            We never store your CVV code. You'll need to enter it for every transaction for security.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Help */}
                        <div className="bg-primary pb-safe rounded-[32px] md:rounded-[40px] p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4 relative z-10">Lost your Card?</h3>
                            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-6 leading-relaxed relative z-10">
                                If your card is lost or stolen, remove it immediately from your profile and contact your bank.
                            </p>
                            <button className="px-6 py-3 bg-white text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all relative z-10">
                                Support Center
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Add Card Modal Mock */}
            {showAddCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddCard(false)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl border border-white/20 p-8 md:p-10 animate-scale-up">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">New Card</h3>
                            <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">Enter your payment details</div>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Card Holder Name</label>
                                <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold tracking-widest uppercase outline-none focus:ring-2 focus:ring-primary/20" placeholder="NAME ON CARD" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Card Number</label>
                                <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold tracking-[0.2em] outline-none focus:ring-2 focus:ring-primary/20" placeholder="••••  ••••  ••••  ••••" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Expiry</label>
                                    <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold tracking-widest outline-none focus:ring-2 focus:ring-primary/20" placeholder="MM/YY" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">CVC</label>
                                    <input type="password" size="3" className="w-full bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold tracking-widest outline-none focus:ring-2 focus:ring-primary/20" placeholder="•••" />
                                </div>
                            </div>
                            <button className="w-full py-5 bg-primary text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20 mt-4 active:scale-95 transition-all">
                                Save Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodsPage;
