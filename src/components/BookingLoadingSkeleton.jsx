import React from 'react';

/**
 * Professional loading skeleton for booking flow pages
 * Used in: SeatSelection, FoodSelection, BookingSummary, Payment
 */
const BookingLoadingSkeleton = ({ variant = 'default' }) => {
    return (
        <div className="min-h-screen bg-[#F5F5FA] dark:bg-gray-950 animate-pulse transition-colors duration-300">
            {/* Header Skeleton */}
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="flex-1 mx-8">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 mx-auto mb-2"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-24 mx-auto"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {variant === 'seats' && (
                    <>
                        {/* Screen Skeleton */}
                        <div className="mb-8">
                            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-t-2xl w-full"></div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-b w-full"></div>
                        </div>

                        {/* Seat Grid Skeleton */}
                        <div className="space-y-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex gap-2 justify-center">
                                    {[...Array(12)].map((_, j) => (
                                        <div key={j} className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {variant === 'food' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 transition-colors">
                                <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 rounded-xl mb-3"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                )}

                {variant === 'summary' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 transition-colors">
                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
                            <div className="space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-1/4"></div>
                                        <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-1/6"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {variant === 'payment' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 transition-colors">
                            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
                            <div className="space-y-4">
                                <div className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl"></div>
                                <div className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl"></div>
                                <div className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                )}

                {variant === 'default' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 h-64 transition-colors"></div>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 h-48 transition-colors"></div>
                    </div>
                )}
            </main>

            {/* Footer Skeleton */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 transition-colors">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="w-24 h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="w-32 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
};

export default BookingLoadingSkeleton;
