import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

const LoginModal = () => {
    const { loginUser, isLoginModalOpen, closeLogin } = useAuth();
    const onClose = closeLogin;

    if (!isLoginModalOpen) return null;

    const handleGoogleSuccess = async (credentialResponse) => {
        console.log('Google login success response:', credentialResponse);
        const success = await loginUser(credentialResponse.credential);
        console.log('Application login result:', success);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden border border-gray-100">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-xynemaRose/5 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-charcoalSlate/5 rounded-full blur-3xl" />

                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-3 rounded-full hover:bg-gray-50 text-gray-300 hover:text-xynemaRose transition-all z-20 group"
                >
                    <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="relative z-10 text-center mb-10">
                    <div className="mx-auto w-24 h-24 mb-6 relative">
                        <div className="absolute inset-0 bg-xynemaRose/10 rounded-[32px] blur-xl animate-pulse" />
                        <div className="relative w-full h-full bg-white rounded-[32px] p-5 shadow-xynemaRose border border-gray-50 flex items-center justify-center">
                            <img src="/logo.png" alt="Xynema Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-display font-bold text-gray-900 uppercase tracking-tight leading-none mb-3">
                        Entrance <br /> <span className="text-xynemaRose">Required</span>
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-4 bg-gray-100" />
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Identify Yourself</p>
                        <div className="h-px w-4 bg-gray-100" />
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex justify-center flex-col items-center">
                        <div className="w-full h-[50px] overflow-hidden rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => console.error('Google OAuth Error: Login Failed')}
                                useOneTap
                                theme="outline"
                                size="large"
                                width="300"
                            />
                        </div>
                        <p className="mt-8 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed max-w-[200px]">
                            By proceeding, you unlock the <span className="text-xynemaRose">Premium Content</span> & Universal Booking Engine
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
