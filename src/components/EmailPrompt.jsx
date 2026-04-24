import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addEmail } from '../services/userService';
import { toast } from 'react-hot-toast';

const EmailPrompt = ({ force = false, onComplete = () => {} }) => {
    const auth = useAuth();
    // Safety check for context
    if (!auth) {
        console.warn('[EmailPrompt] AuthContext not found');
        return null;
    }
    
    const { user, updateUser, showEmailPrompt, setShowEmailPrompt, emailCallback, setEmailCallback } = auth;
    const [email, setEmail] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    // Sync visibility with global context
    useEffect(() => {
        if (showEmailPrompt) {
            setIsVisible(true);
            setIsDismissed(false);
        } else {
            setIsVisible(false);
        }
    }, [showEmailPrompt]);

    const handleSkip = () => {
        sessionStorage.setItem('skip_email_prompt', 'true');
        setIsVisible(false);
        setShowEmailPrompt(false);
        setTimeout(() => {
            setIsDismissed(true);
            if (emailCallback) {
                emailCallback();
                setEmailCallback(null);
            }
        }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('[EmailPrompt] Submitting email link request:', email);
            const result = await addEmail(email);
            if (result && result.success) {
                toast.success('Email linked successfully!');
                
                // Construct the updated model data
                const backendUser = result.data || result.user || {};
                const mergedData = { 
                    ...user, 
                    ...backendUser, 
                    email: email,
                    loginMethod: user?.loginMethod || 'phone'
                };
                
                // Save and close
                updateUser(mergedData);
                setIsVisible(false);
                setShowEmailPrompt(false);

                setTimeout(() => {
                    try {
                        setIsDismissed(true);
                        if (typeof onComplete === 'function') onComplete(mergedData);
                        if (emailCallback) {
                            console.log('[EmailPrompt] Resuming original action...');
                            emailCallback(mergedData);
                            setEmailCallback(null);
                        }
                    } catch (callbackErr) {
                        console.error('[EmailPrompt] Error in resume callback:', callbackErr);
                    }
                }, 300);
            } else {
                toast.error(result?.message || 'Failed to add email');
            }
        } catch (err) {
            console.error('[EmailPrompt] Link error:', err);
            toast.error('Error linking email. You can skip for now.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!showEmailPrompt && !isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500 ${
            isVisible ? 'visible' : 'invisible'
        }`}>
            {/* Ultra-Premium Glass Backdrop */}
            <div 
                className={`absolute inset-0 bg-gray-900/40 backdrop-blur-xl transition-opacity duration-700 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`} 
                onClick={handleSkip}
            />

            <div className={`relative w-full max-w-lg transition-all duration-700 transform ${
                isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-12'
            }`}>
                <div className="bg-white dark:bg-gray-950 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-gray-100 dark:border-white/5 overflow-hidden">
                    {/* Header Banner - Like Profile Screen */}
                    <div className="h-32 bg-gradient-to-br from-primary via-xynemaRose to-indigo-600 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 pattern-dots" />
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    </div>

                    <div className="p-10 md:p-14 relative pt-16">
                        {/* Profile Avatar Placeholder - Centered overlap */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-[40px] bg-white dark:bg-gray-900 p-2 shadow-2xl">
                            <div className="w-full h-full rounded-[32px] bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10">
                                <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </div>
                        </div>

                        <div className="text-center mb-10">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
                                Complete Your Profile
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">Personal Information Update</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-blue-50/50 dark:bg-primary/5 rounded-3xl p-6 border border-blue-100/50 dark:border-primary/10">
                                <p className="text-xs font-semibold text-blue-600 dark:text-primary leading-relaxed text-center">
                                    Link your email to your current phone number <span className="font-bold">({user?.phoneNumber})</span> to receive e-tickets and confirmation details.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-4">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-[24px] px-8 py-5 text-sm font-bold tracking-wide outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-6 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <span>Save Profile Changes</span>
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSkip}
                                        className="w-full py-4 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        I'll complete this later
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailPrompt;

