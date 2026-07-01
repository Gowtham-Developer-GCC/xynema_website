import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LoginModal = () => {
    const { loginUser, isLoginModalOpen, isAuthenticated, closeLogin, loginCallback, initiatePhoneLogin, verifyOtp } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [loginStep, setLoginStep] = useState('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If user becomes authenticated while modal is open, close it
    useEffect(() => {
        if (isAuthenticated && isLoginModalOpen) {
            closeLogin();
        }
    }, [isAuthenticated, isLoginModalOpen, closeLogin]);

    // Don't render if modal is closed OR user is authenticated
    if (!isLoginModalOpen || isAuthenticated) return null;

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsSubmitting(true);
        try {
            const loggedUser = await loginUser(credentialResponse.credential);
            if (loggedUser) {
                closeLogin();
                window.history.replaceState({}, document.title);
                const from = location.state?.from?.pathname;
                if (loginCallback) loginCallback(loggedUser);
                else if (from) navigate(from, { replace: true });
            }
        } catch (err) {
            toast.error('Google login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        if (phoneNumber.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await initiatePhoneLogin(phoneNumber);
            if (result.success) {
                setLoginStep('otp');
                toast.success('OTP sent to your phone!');
            } else {
                toast.error(result.message || 'Failed to send OTP');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to send OTP');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (otp.length < 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }
        setIsSubmitting(true);
        try {
            const loggedUser = await verifyOtp(phoneNumber, otp);
            if (loggedUser) {
                // closeLogin() will be auto-triggered via the isLoggedIn useEffect above
                // since storeUser() was called inside verifyOtp
                window.history.replaceState({}, document.title);
                const from = location.state?.from?.pathname;
                if (loginCallback) loginCallback(loggedUser);
                else if (from) navigate(from, { replace: true });
                closeLogin();
            } else {
                toast.error('Invalid OTP. Please try again.');
            }
        } catch (err) {
            toast.error(err.message || 'OTP verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-500"
                onClick={closeLogin}
            />

            <div className="relative w-full max-w-[420px] bg-white dark:bg-gray-900 rounded-[50px] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-xynemaRose/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full -ml-20 -mb-20 blur-3xl" />

                <button
                    onClick={closeLogin}
                    className="absolute top-8 right-8 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-300 transition-all z-20 group"
                >
                    <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                {/* Header */}
                <div className="relative z-10 text-center mb-10">
                    <div className="mx-auto w-20 h-20 mb-6">
                        <div className="relative w-full h-full bg-white dark:bg-gray-800 rounded-[28px] p-4 shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-center">
                            <img src="/logo.png" alt="Xynema Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-gray-950 dark:text-white uppercase tracking-tighter leading-none mb-3">
                        Entrance <br /> <span className="text-xynemaRose">Required</span>
                    </h2>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[2px] w-6 bg-xynemaRose/20" />
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Identify Yourself</p>
                        <div className="h-[2px] w-6 bg-xynemaRose/20" />
                    </div>
                </div>

                {/* Login Options */}
                <div className="relative z-10 space-y-6">
                    {/* Google Login */}
                    <div>
                        <div className="w-full h-[60px] overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all duration-300">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error('Google login failed')}
                                theme="outline"
                                size="large"
                                width="340"
                            />
                        </div>
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
                        <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">OR</span>
                        <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
                    </div>

                    {/* Phone / OTP Login */}
                    <div>
                        {loginStep === 'phone' ? (
                            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-xynemaRose transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Enter Phone Number"
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-5 py-5 text-sm font-black tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-xynemaRose/20 focus:border-xynemaRose/30 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || phoneNumber.length < 10}
                                    className="w-full bg-xynemaRose text-white font-black text-[11px] uppercase tracking-[0.3em] py-5 rounded-2xl shadow-xl shadow-xynemaRose/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                                >
                                    {isSubmitting ? 'Sending OTP...' : 'Continue with Phone'} <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter 6-Digit OTP"
                                        autoFocus
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-5 py-5 text-sm font-black tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setLoginStep('phone'); setOtp(''); }}
                                        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black text-[9px] uppercase tracking-widest py-5 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || otp.length < 6}
                                        className="flex-[2] bg-emerald-500 text-white font-black text-[11px] uppercase tracking-[0.3em] py-5 rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                                    >
                                        {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <p className="mt-8 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center leading-relaxed">
                        By proceeding, you unlock the <span className="text-xynemaRose">Premium Content</span> <br /> &amp; Universal Booking Engine
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
