import React, { useState } from 'react';

const NoticePage = ({ onAccept }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleContinue = () => {
        if (isChecked) {
            localStorage.setItem('xynema_notice_accepted', 'true');
            onAccept();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md overflow-y-auto py-10">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="relative w-full max-w-lg mx-4">
                <div className="bg-white/10 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 md:p-12 shadow-2xl transform transition-all duration-500 hover:scale-[1.01]">
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Icon */}
                        <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-2">
                            <svg
                                className="w-10 h-10 text-amber-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            System Notice
                        </h1>

                        <p className="text-slate-300 text-lg leading-relaxed">
                            This website is currently not being used for regular operations.
                            If you wish to proceed for demonstration purposes, please confirm your awareness.
                            This notice will be active for a few days during this maintenance phase.
                        </p>

                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 w-full">
                            <label className="flex items-start space-x-4 cursor-pointer group">
                                <div className="relative flex items-center mt-1">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={isChecked}
                                        onChange={() => setIsChecked(!isChecked)}
                                    />
                                    <div className={`w-6 h-6 border-2 rounded-lg transition-colors ${isChecked
                                            ? 'bg-indigo-500 border-indigo-500'
                                            : 'border-slate-500 group-hover:border-indigo-400'
                                        }`}></div>
                                    <svg
                                        className={`absolute w-4 h-4 text-white transition-opacity left-1 ${isChecked ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-slate-400 text-left select-none group-hover:text-slate-300 transition-colors">
                                    I understand and acknowledge that this website is not for public use at this time and I wish to proceed anyway.
                                </span>
                            </label>
                        </div>

                        <button
                            onClick={handleContinue}
                            disabled={!isChecked}
                            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform ${isChecked
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-100'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed scale-95'
                                }`}
                        >
                            Continue to Website
                        </button>

                        <div className="pt-2">
                            <p className="text-slate-500 text-xs">
                                &copy; {new Date().getFullYear()} Xynema. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticePage;
