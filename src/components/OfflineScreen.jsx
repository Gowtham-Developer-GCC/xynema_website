import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * OfflineScreen – fullscreen overlay shown when the app detects no internet connection.
 * Uses the branded 'no internet.webm' clip.
 */
const OfflineScreen = ({ onRetry }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-white px-6 text-center">
            {/* Video Container */}
            <div className="w-64 h-64 mb-8 bg-white-900/20 rounded-full flex items-center justify-center overflow-hidden">
                <video
                    src="/assets/no internet.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Content */}
            <div className="max-w-md animate-fade-in">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <WifiOff className="w-6 h-6 text-xynemaRose" />
                    <h1 className="text-2xl text-black font-bold tracking-tight">You're Offline</h1>
                </div>

                <p className="text-gray-400 mb-8 leading-relaxed">
                    It looks like your connection has been interrupted. Please check your internet settings and try again.
                </p>

                {/* Actions */}
                <button
                    onClick={() => onRetry ? onRetry() : window.location.reload()}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-xynemaRose text-white rounded-full font-bold text-sm shadow-lg shadow-xynemaRose/25 hover:bg-rose-600 active:scale-95 transition-all group"
                >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Try Refreshing
                </button>
            </div>

            {/* Subtle Brand Watermark */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-20 select-none pointer-events-none">
                <p className="text-xs font-black uppercase tracking-[0.3em]">XYNEMA</p>
            </div>
        </div>
    );
};

export default OfflineScreen;
