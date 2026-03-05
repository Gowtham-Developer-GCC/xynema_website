import React from 'react';

/**
 * LoadingScreen – fullscreen animated loading overlay using the branded webm clip.
 * Props:
 *   message  – optional subtitle shown below the video (default: none)
 *   overlay  – if true, renders as a fixed overlay on top of content (default: false = full page)
 */
const LoadingScreen = ({ message, overlay = false }) => {
    const wrapClass = overlay
        ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm'
        : 'min-h-screen flex flex-col items-center justify-center bg-white';

    return (
        <div className={wrapClass}>
            <video
                src="/assets/Loading_Screen.webm"
                autoPlay
                loop
                muted
                playsInline
                className="w-64 h-64 object-contain"
            />
            {message && (
                <p className="mt-4 text-white/70 text-sm font-medium tracking-wide animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
};

export default LoadingScreen;
