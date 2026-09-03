import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Phone, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup } from 'firebase/auth';

const LoginModal = () => {
    const { loginUser, isLoginModalOpen, isAuthenticated, closeLogin, loginCallback, initiatePhoneLogin, verifyOtp } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [loginStep, setLoginStep] = useState('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

    // If user becomes authenticated while modal is open, close it
    useEffect(() => {
        if (isAuthenticated && isLoginModalOpen) {
            closeLogin();
        }
    }, [isAuthenticated, isLoginModalOpen, closeLogin]);

    // Don't render if modal is closed OR user is authenticated
    if (!isLoginModalOpen || isAuthenticated) return null;

    const handleGoogleSignIn = async () => {
        setIsGoogleSigningIn(true);
        try {
            console.log('[Google Auth] Starting signInWithPopup...');
            const result = await signInWithPopup(auth, googleProvider);
            console.log('[Google Auth] Popup resolved successfully. User email:', result?.user?.email);
            const idToken = await result.user.getIdToken();
            console.log('[Google Auth] Got ID token. Sending to backend /user/google...');
            const loggedUser = await loginUser(idToken);
            console.log('[Google Auth] Login response:', loggedUser);
            if (loggedUser) {
                closeLogin();
                window.history.replaceState({}, document.title);
                const from = location.state?.from?.pathname;
                if (loginCallback) loginCallback(loggedUser);
                else if (from) navigate(from, { replace: true });
            }
        } catch (err) {
            console.error('[Google Auth] Sign-in error:', err);
            if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                toast.error(err.message || 'Google login failed. Please try again.');
            }
        } finally {
            setIsGoogleSigningIn(false);
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
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleSigningIn || isSubmitting}
                            className="w-full h-[60px] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed group px-4"
                        >
                            {isGoogleSigningIn ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Connecting to Google...</span>
                                </div>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-200" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-wide">
                                        Continue with Google
                                    </span>
                                </>
                            )}
                        </button>
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
