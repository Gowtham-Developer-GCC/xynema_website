// src/components/CancellationModal.jsx
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { 
    getCancellationPolicy, 
    cancelBooking, 
    getTurfCancellationPolicy, 
    cancelTurfBooking,
    getEventCancellationPolicy,
    cancelEventBooking
} from '../services/cancellationService';

const CancellationModal = ({ 
    isOpen, 
    onClose, 
    bookingId, 
    turfId,
    eventId, // <-- Added eventId support
    bookingType = 'movie', 
    totalAmount = 0, 
    paymentMethod = 'account' 
}) => {
    const [policyData, setPolicyData] = useState(null);
    const [isPolicyLoading, setIsPolicyLoading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);
    const [refundData, setRefundData] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state upon closing
            setPolicyData(null);
            setCancelSuccess(false);
            setRefundData(null);
            return;
        }

        const fetchPolicy = async () => {
            setIsPolicyLoading(true);
            try {
                // Dynamically call the correct API based on the category
                const response = bookingType === 'turf' 
                    ? await getTurfCancellationPolicy(turfId) 
                    : bookingType === 'event'
                    ? await getEventCancellationPolicy(eventId)
                    : await getCancellationPolicy(bookingId);

                if (response.success) {
                    setPolicyData(response.data);
                } else {
                    alert('Failed to load cancellation policy.');
                    onClose();
                }
            } catch (error) {
                console.error("Policy fetch error:", error);
                alert('Error loading cancellation policy.');
                onClose();
            } finally {
                setIsPolicyLoading(false);
            }
        };

        fetchPolicy();
    }, [isOpen, bookingId, bookingType, onClose]);

    const handleConfirmCancellation = async () => {
        setIsCancelling(true);
        try {
            // Dynamically call the correct cancel API
            const response = bookingType === 'turf' 
                ? await cancelTurfBooking(bookingId) 
                : bookingType === 'event'
                ? await cancelEventBooking(bookingId)
                : await cancelBooking(bookingId);

            if (response.success) {
                setRefundData(response.data?.refund || response.data);
                setCancelSuccess(true);
            } else {
                alert(response.message || "Failed to cancel booking.");
            }
        } catch (error) {
            console.error("Cancellation error:", error);
            alert(error.message || "Failed to cancel booking.");
        } finally {
            setIsCancelling(false);
        }
    };

    if (!isOpen) return null;
    
    // Determine values to display to support all API responses safely
    const displayStatus = refundData?.status?.toUpperCase() || 'REFUND INITIATED'; 
    const finalRefundAmount = refundData?.totalRefundAmount ?? refundData?.refundAmount ?? totalAmount ?? 0;

    // Helper to calculate hours safely from different API payload variations
    const getTimeLabel = (slab) => {
        if (slab.hoursBeforeShow !== undefined) return `${slab.hoursBeforeShow} hrs before`;
        if (slab.hoursBeforeSlot !== undefined) return `${slab.hoursBeforeSlot} hrs before`;
        if (slab.daysBeforeEvent !== undefined) {
            const hours = slab.daysBeforeEvent * 24;
            return `${Math.round(hours)} hrs before`;
        }
        return 'Cancellation Window';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                
                {cancelSuccess ? (
                    <div className="p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-5 ring-1 ring-green-100 dark:ring-green-500/20">
                            <CheckCircle2 size={40} className="text-green-500 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Booking Cancelled</h3>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8">
                            {bookingId}
                        </p>

                        <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-8 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[10px]">Refund Status</span>
                                <span className="font-black text-green-600 dark:text-green-400 uppercase tracking-widest text-[10px] bg-green-100 dark:bg-green-500/20 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-500/30">
                                    {displayStatus}
                                </span>
                            </div>
                            <div className="h-px w-full bg-gray-200 dark:bg-gray-700/50" />
                            <div className="flex justify-between items-center">
                                <span className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[10px]">Refund Amount</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                                    ₹{finalRefundAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 text-left leading-relaxed mt-2">
                                * Amount will be credited to your original payment method ({paymentMethod.toUpperCase()}) within 5-7 business days. {refundData?.note}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest text-white bg-primary hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            Continue
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Cancel Booking</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{bookingId}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {isPolicyLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading Policy...</p>
                                </div>
                            ) : policyData ? (
                                <div className="space-y-6">
                                    {/* Policy Notes */}
                                    <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                        <p className="text-xs font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
                                            {policyData.policyNote}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${policyData.convenienceFeeRefundable ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                                Fee/GST: {policyData.convenienceFeeRefundable ? 'Refundable' : 'Non-Refundable'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Standard Slabs */}
                                    {policyData.slabs && policyData.slabs.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Cancellation Charges</h4>
                                            <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                                {policyData.slabs.map((slab, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 text-sm border-b border-gray-50 dark:border-gray-800/50 last:border-0 bg-white dark:bg-gray-900">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            {getTimeLabel(slab)}
                                                        </span>
                                                        <span className="font-bold text-gray-900 dark:text-white">{slab.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Advance Slabs (Turf Specific) */}
                                    {policyData.advanceSlabs && policyData.advanceSlabs.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Advance Payment Charges</h4>
                                            <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                                {policyData.advanceSlabs.map((slab, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 text-sm border-b border-gray-50 dark:border-gray-800/50 last:border-0 bg-white dark:bg-gray-900">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{slab.hoursBeforeSlot} hrs before</span>
                                                        <span className="font-bold text-gray-900 dark:text-white">{slab.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-4">Failed to load policy. Please try again.</p>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
                            >
                                Keep Ticket
                            </button>
                            <button
                                onClick={handleConfirmCancellation}
                                disabled={isCancelling || !policyData?.isCancellationEnabled}
                                className="flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isCancelling ? (
                                    <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Cancelling</>
                                ) : (
                                    "Confirm Cancel"
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CancellationModal;