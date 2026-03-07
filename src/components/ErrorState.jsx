import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorState = ({ error, onRetry, title = "Something went wrong", buttonText = "Retry Connection" }) => {
    // Extract message if error is an object
    const errorMessage = typeof error === 'object' && error !== null ? (error.message || error.userMessage || "An unexpected error occurred.") : error;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-950 transition-colors duration-300">
            {/* Animated Icon Container */}
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-red-400/20 dark:bg-red-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative w-24 h-24 rounded-[2.5rem] bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/50 shadow-xl shadow-red-100/20 dark:shadow-none animate-in zoom-in-50 duration-500">
                    <AlertCircle className="w-10 h-10 animate-pulse" />
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-md space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                    {title}
                </h2>
                <div className="h-1 w-12 bg-red-500 mx-auto rounded-full mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium max-w-xs mx-auto leading-relaxed">
                    {errorMessage}
                </p>
            </div>

            {/* Action Section */}
            {onRetry && (
                <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <button
                        onClick={onRetry}
                        className="group relative px-10 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-black text-xs md:text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gray-200 dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {buttonText}
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </button>
                </div>
            )}

            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-red-500/5 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>
        </div>
    );
};

export default ErrorState;
