import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Lock, Eye, EyeOff, ShieldAlert, Loader2, CheckCircle2, Info } from 'lucide-react';
import { nxToast } from '../../utils/userToast';
import TOAST_MESSAGES from '../../utils/toastMessages';

const ChangePasswordModal = ({ isOpen, onClose, onUpdate }) => {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [backendError, setBackendError] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        mode: "onBlur"
    });

    const newPassword = watch("newPassword");

    useEffect(() => {
        if (isOpen) {
            reset();
            setBackendError("");
        }
    }, [isOpen, reset]);

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        setBackendError("");
        try {
            await onUpdate({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            nxToast.success(TOAST_MESSAGES.PROFILE.PASSWORD_UPDATED.title, TOAST_MESSAGES.PROFILE.PASSWORD_UPDATED.message);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || "Verification failed. Please check your current password.";
            nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, msg);
            setBackendError(msg);
        }
    };

    const inputClasses = (error) => `
        w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold border-2 outline-none transition-all pr-12
        ${error ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#7a6af6]/20 focus:bg-white'}
    `;

    const labelClasses = "text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";
    const errorClasses = "text-[9px] text-red-500 font-bold mt-1 uppercase ml-1 tracking-tighter flex items-center gap-1";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0F172A]/60 backdrop-blur-sm transition-all text-black">
            <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in duration-300">

                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black transition-colors">
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Access Security</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Update your NEXTZEN security credentials
                    </p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center shadow-xl shadow-[#0F172A]/10 text-white">
                        <Lock size={28} strokeWidth={2.5} />
                    </div>
                </div>

                {backendError && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
                        <ShieldAlert size={16} className="text-red-500 shrink-0" />
                        <p className="text-[9px] font-black text-red-700 uppercase leading-tight">{backendError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <div>
                        <label className={labelClasses}>Current Credentials</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                {...register("currentPassword", { 
                                    required: "Current password is required" 
                                })}
                                className={inputClasses(errors.currentPassword)} 
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.currentPassword && <p className={errorClasses}><Info size={10} /> {errors.currentPassword.message}</p>}
                    </div>

                    <hr className="border-slate-100 my-2" />

                    <div>
                        <label className={labelClasses}>New Security Key</label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                {...register("newPassword", {
                                    required: "A new password is required",
                                    minLength: { value: 6, message: "Security key must be at least 6 characters" },
                                    maxLength: { value: 30, message: "Security key cannot exceed 30 characters" },
                                    validate: {
                                        noLeadingSpace: (val) => !/^\s/.test(val) || "Cannot start with a space"
                                    }
                                })}
                                className={inputClasses(errors.newPassword)}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.newPassword && <p className={errorClasses}><Info size={10} /> {errors.newPassword.message}</p>}
                    </div>

                    <div>
                        <label className={labelClasses}>Verify New Key</label>
                        <div className="relative text-black">
                            <input
                                type={showConfirm ? "text" : "password"}
                                {...register("confirmPassword", {
                                    required: "Please confirm your new key",
                                    validate: value => value === newPassword || "Security keys do not match"
                                })}
                                className={inputClasses(errors.confirmPassword)}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className={errorClasses}><Info size={10} /> {errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-slate-200 mt-6 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={16} className="animate-spin" /> Authorizing...</>
                        ) : (
                            <><CheckCircle2 size={16} /> Update Security Key</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;