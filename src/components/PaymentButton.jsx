import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ENDPOINTS } from "../services/endpoints";

/**
 * Dynamically loads the Razorpay checkout script.
 * @returns {Promise<boolean>}
 */
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Reusable PaymentButton component for Razorpay integration.
 * @param {Object} props
 * @param {number} props.amount - Amount in INR
 * @param {Object} props.bookingData - Data to send for verification
 * @param {Function} props.onSuccess - Callback on successful booking
 * @param {Function} props.onFailure - Callback on failure
 * @param {string} props.className - Custom classes for styling
 * @param {boolean} props.disabled - Disable state
 * @returns {JSX.Element}
 */
const PaymentButton = ({ 
    amount, 
    bookingData, 
    onSuccess, 
    onFailure, 
    className = "", 
    disabled = false,
    children
}) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState("idle"); // idle | loading | success | failed | cancelled

    const handlePayment = async () => {
        if (disabled || status === "loading") return;
        
        setStatus("loading");
        console.log("[Payment] Initializing payment for amount:", amount);

        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                alert("Razorpay SDK failed to load. Please check your connection.");
                setStatus("idle");
                return;
            }

            let response;
            if (bookingData?.showId) {
                // Use the specific show booking order creation API
                const { showId, seatIds, sessionId } = bookingData;
                response = await api.post(ENDPOINTS.BOOKING.SHOWS.CREATE_ORDER(showId), { 
                    seatIds, 
                    sessionId 
                });
            } else {
                // Use generic payment initiation
                response = await api.post(ENDPOINTS.PAYMENT.INITIATE, { 
                    amount, 
                    ...bookingData 
                });
            }
            
            const result = response.data;
            const order = result.success ? result.data : result;
            
            // Support both orderId (new backend) and id (standard)
            const razorpayOrderId = order.orderId || order.id;
            const razorpayKey = order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
            
            if (!order || !razorpayOrderId) throw new Error(result.message || "Invalid order data from server");

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency || "INR",
                name: "Xynema",
                description: "Booking Payment",
                image: "/logo.png",
                order_id: razorpayOrderId,

                handler: async function (response) {
                    try {
                        let verifyResult;
                        
                        if (bookingData?.showId) {
                            // Use show-specific confirmation API with custom body
                            const { showId, seatIds, sessionId, selectedMethod } = bookingData;
                            const confirmResponse = await api.post(ENDPOINTS.BOOKING.SHOWS.CONFIRM(showId), {
                                seatIds,
                                sessionId,
                                paymentDetails: {
                                    method: selectedMethod || 'upi',
                                    transactionId: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature
                                }
                            });
                            verifyResult = confirmResponse.data;
                        } else {
                            // Generic payment verification
                            const result = await api.post(ENDPOINTS.PAYMENT.VERIFY, {
                                ...response,
                                bookingData,
                            });
                            verifyResult = result.data;
                        }

                        if (verifyResult.success) {
                            setStatus("success");
                            if (onSuccess) onSuccess(verifyResult);

                            navigate("/booking-success", {
                                state: { 
                                    bookingData: {
                                        ...bookingData,
                                        bookingId: verifyResult.data?.bookingId || verifyResult.bookingId || "BK" + Date.now()
                                    } 
                                }
                            });
                        } else {
                            throw new Error(verifyResult.message || "Verification failed");
                        }

                    } catch (err) {
                        console.error("Verification failed:", err);
                        setStatus("failed");
                        if (onFailure) onFailure(err);
                    }
                },

                modal: {
                    ondismiss: function () {
                        console.log("Payment cancelled by user");
                        setStatus("cancelled");
                    },
                },

                prefill: {
                    name: bookingData?.userName || "Guest",
                    email: bookingData?.userEmail || "guest@example.com",
                    contact: bookingData?.phone || ""
                },

                theme: { color: "#e50914" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Payment error:", error);
            setStatus("failed");
            if (onFailure) onFailure(error);
        }
    };

    return (
        <div className="w-full space-y-2">
            <button
                onClick={handlePayment}
                disabled={disabled || status === "loading"}
                className={`transition-all active:scale-95 disabled:opacity-70 ${className} flex items-center justify-center gap-2`}
            >
                {status === "loading" ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                    </>
                ) : (
                    children || `Pay ₹${amount}`
                )}
            </button>
            
            {status === "failed" && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">
                    Payment Failed. Please try again.
                </p>
            )}
            {status === "cancelled" && (
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">
                    Payment Cancelled
                </p>
            )}
        </div>
    );
};

export default PaymentButton;
