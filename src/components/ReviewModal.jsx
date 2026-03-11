import React, { useState } from 'react';
import { Star, X, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { addMovieReview } from '../services/movieService';

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !booking) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setLoading(true);
        setError(null);

        // Prepare review data
        const reviewData = {
            rating: (rating * 2).toString(),
            review: review || 'Nice movie'
        };

        try {
            // Attempt to post to backend
            await addMovieReview(booking.id || booking.bookingId, reviewData);
            console.log('Review submitted successfully to backend');

            // Store reviewed booking in localStorage
            const reviewedBookings = JSON.parse(localStorage.getItem('reviewedBookings') || '[]');
            const bookingId = booking.id || booking.bookingId;
            if (!reviewedBookings.includes(bookingId)) {
                reviewedBookings.push(bookingId);
                localStorage.setItem('reviewedBookings', JSON.stringify(reviewedBookings));
            }
        } catch (err) {
            // Log for debug mode as requested
            console.error('DEBUG: Review submission failed but proceeding as success:', err);
            console.error('Failed review data:', { bookingId: booking.id, ...reviewData });

            // Store reviewed booking in localStorage even if backend fails
            const reviewedBookings = JSON.parse(localStorage.getItem('reviewedBookings') || '[]');
            const bookingId = booking.id || booking.bookingId;
            if (!reviewedBookings.includes(bookingId)) {
                reviewedBookings.push(bookingId);
                localStorage.setItem('reviewedBookings', JSON.stringify(reviewedBookings));
            }
        } finally {
            // Even if it fails, we show success to the user as requested
            setSubmitted(true);
            setLoading(false);

            // Wait then trigger success callback
            setTimeout(() => {
                if (onSuccess) onSuccess(booking.id || booking.bookingId);
                onClose();
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {!submitted ? (
                    <div className="p-8">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">How was the movie?</h2>
                            <p className="text-sm text-gray-500 font-medium mb-4">
                                Share your thoughts on <span className="text-xynemaRose font-bold">{booking.movieTitle}</span>
                            </p>

                            {/* Show Details Card */}
                            <div className="mx-auto w-fit px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>{new Date(booking.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{booking.time}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-gray-600">{booking.theaterName}</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2 mb-10">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="transition-all active:scale-90"
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`w-6 h-6 transition-colors ${star <= (hover || rating)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-200'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Review</label>
                            <div className="relative">
                                <MessageSquare className="absolute top-4 left-4 w-5 h-5 text-gray-300" />
                                <textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="Tell us what you liked (or didn't)..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-xynemaRose/20 focus:border-xynemaRose transition-all min-h-[120px] resize-none"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 font-medium text-center mb-6 animate-shake">
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${loading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-xynemaRose text-white shadow-xl shadow-xynemaRose/30 hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Submit Feedback
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                ) : (
                    <div className="p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                        <p className="text-gray-500 font-medium">Your feedback helps us make XYNEMA better for everyone.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewModal;
