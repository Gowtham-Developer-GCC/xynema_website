import React from 'react';

const LoadingSpinner = ({ message = "Syncing Library", fullScreen = true }) => {
    const containerClasses = fullScreen
        ? "min-h-screen bg-[#F5F5FA] flex flex-col items-center justify-center p-8 z-[100]"
        : "flex flex-col items-center justify-center p-8";

    return (
        <div className={containerClasses}>
            <div className="relative group">
                {/* Rotating Outer Ring */}
                <div className="absolute -inset-4 rounded-full border-2 border-dashed border-xynemaRose/20 animate-spin-slow group-hover:border-xynemaRose/40 transition-colors" />

                {/* Pulse Glow */}
                <div className="absolute inset-0 rounded-2xl bg-xynemaRose/10 animate-ping opacity-20" />

                {/* Logo Container */}
                <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-5 border border-white overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <img
                        src="/logo.png"
                        alt="Xynema Logo"
                        className="w-full h-full object-contain animate-pulse-gentle"
                    />
                </div>
            </div>

            <div className="mt-12 text-center space-y-2">
                <p className="text-xynemaRose font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">
                    {message}
                </p>
                <h2 className="text-2xl font-display font-black tracking-tighter text-gray-900/10">
                    XYNEMA
                </h2>
            </div>

            <style jsx="true tracking-tight">{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-gentle {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                .animate-pulse-gentle {
                    animation: pulse-gentle 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
