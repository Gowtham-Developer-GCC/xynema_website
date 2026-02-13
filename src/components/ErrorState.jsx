import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorState = ({ error, onRetry, title = "Something went wrong", buttonText = "Retry Connection" }) => {
    // Extract message if error is an object
    const errorMessage = typeof error === 'object' && error !== null ? (error.message || error.userMessage || "An unexpected error occurred.") : error;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-xs space-y-2">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-gray-500 text-sm">{errorMessage}</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-8 py-3 rounded-xl bg-xynemaRose text-white font-bold text-sm transition-colors shadow-lg shadow-gray-200"
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
};

export default ErrorState;
