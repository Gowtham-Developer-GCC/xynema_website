/**
 * Centralized pricing constants and utility functions for the booking flow.
 * Use this file to manage convenience fees, GST rates, and final total calculations
 * to ensure consistency across the application.
 */

export const PRICING_CONFIG = {
    CONVENIENCE_FEE_PERCENT: 0.10, // 10% of tickets subtotal
    GST_RATE: 0.18,               // 18% GST applied to convenience fee only
};

/**
 * Calculates the full price breakdown for a booking.
 * 
 * @param {number} ticketsTotal - Subtotal of all selected movie/event tickets
 * @param {number} snackTotal - Subtotal of all added food and beverage items
 * @returns {Object} breakdown - Detailed price components
 */
export const calculateBookingTotal = (ticketsTotal = 0, snackTotal = 0) => {
    const convenienceFee = ticketsTotal * PRICING_CONFIG.CONVENIENCE_FEE_PERCENT;
    const gstAmount = convenienceFee * PRICING_CONFIG.GST_RATE;
    const finalTotal = ticketsTotal + snackTotal + convenienceFee + gstAmount;

    return {
        ticketsTotal,
        snackTotal,
        convenienceFee,
        gstAmount,
        finalTotal,
        // Helper to format currency values consistently
        format: (val) => val.toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })
    };
};
