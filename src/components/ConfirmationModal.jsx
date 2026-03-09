import React from 'react';
import { AlertCircle, X, CheckCircle2, Info } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "Do you really want to proceed with this action?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info" // warning, danger, success, info
}) => {
    if (!isOpen) return null;

    const styles = {
        warning: {
            icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
            bg: "bg-amber-50 dark:bg-amber-900/20",
            button: "bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-none"
        },
        danger: {
            icon: <AlertCircle className="w-6 h-6 text-rose-500" />,
            bg: "bg-rose-50 dark:bg-rose-900/20",
            button: "bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none"
        },
        success: {
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none"
        },
        info: {
            icon: <Info className="w-6 h-6 text-indigo-500" />,
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
            button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
        }
    };

    const currentStyle = styles[type] || styles.info;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="relative w-full max-w-[340px] bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-transparent dark:border-gray-800">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-300 dark:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-7 pt-9 flex flex-col items-center text-center">
                    {/* Icon Header */}
                    <div className={`w-14 h-14 ${currentStyle.bg} rounded-2xl flex items-center justify-center mb-5`}>
                        {currentStyle.icon}
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 mb-7">
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {title}
                        </h3>
                        <p className="text-[13px] text-slate-500 dark:text-gray-400 font-medium leading-relaxed px-4">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="w-full space-y-2.5">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all ${currentStyle.button}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
