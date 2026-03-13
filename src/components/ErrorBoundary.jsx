import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center bg-whiteSmoke p-12 text-center rounded-[40px] my-12 border border-dashed border-gray-200 min-h-[50vh]">
                    <div className="max-w-md">
                        <div className="w-24 h-24 bg-xynemaRose/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <svg className="w-12 h-12 text-xynemaRose animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-display font-black tracking-tighter uppercase text-gray-900 leading-none mb-4">Transmission <br /> <span className="text-xynemaRose">Interrupted</span></h1>
                        <p className="text-gray-500 font-medium mb-10 text-sm">Our theater systems encountered a momentary glitch. Our technicians are on it.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-12 py-4 bg-primary text-white font-display font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-xynemaRose transition-all shadow-xl shadow-blue-100 active:scale-95"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
