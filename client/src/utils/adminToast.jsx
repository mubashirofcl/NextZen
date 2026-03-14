import { toast } from "sonner";
import { Check, ShieldAlert, Trash2, X, Loader2, Info } from "lucide-react";
import React, { useState } from "react";
import { createPortal } from 'react-dom';

const baseAdminToast = (render, options = {}) => {
    toast.custom(render, { duration: 4000, ...options });
};

const AdminConfirmContent = ({ id, title, message, onConfirm }) => {
    const [isPending, setIsPending] = useState(false);

    const handleExecute = async () => {
        setIsPending(true);
        try {
            await onConfirm();
            toast.dismiss(id);
        } catch (err) {
            setIsPending(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center z-[1000000] pointer-events-auto">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isPending && toast.dismiss(id)} />

            <div className="relative bg-white w-[90%] max-w-[340px] rounded-[24px] shadow-2xl p-7 border border-slate-100 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        <Trash2 size={20} />
                    </div>
                    <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">{title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 leading-relaxed tracking-tight">{message}</p>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleExecute}
                        disabled={isPending}
                        className="w-full py-3 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-70"
                    >
                        {isPending ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Execute Action"}
                    </button>
                    <button
                        onClick={() => toast.dismiss(id)}
                        disabled={isPending}
                        className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const adminToast = {
    // Success: High-contrast Slate/Green
    success(title = "Task Completed", message = "") {
        baseAdminToast((id) => (
            <div className="bg-white border border-slate-100 p-4 mb-4 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex items-center gap-4 pointer-events-auto min-w-[320px]">
                <div className="bg-green-50 p-2 rounded-xl text-green-600">
                    <Check size={18} strokeWidth={3} />
                </div>
                <div className="flex-1">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#0F172A] leading-none mb-1">{title}</h4>
                    {message && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{message}</p>}
                </div>
                <button onClick={() => toast.dismiss(id)} className="text-slate-300 hover:text-slate-600">
                    <X size={14} />
                </button>
            </div>
        ));
    },

    warn(title = "Attention Required", message = "") {
        baseAdminToast((id) => (
            <div className="bg-[#0F172A] border border-white/10 p-4 mb-4 rounded-[20px] shadow-2xl flex items-center gap-4 pointer-events-auto min-w-[320px]">
                <div className="bg-orange-500/20 p-2 rounded-xl text-orange-500">
                    <ShieldAlert size={18} />
                </div>
                <div className="flex-1">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white leading-none mb-1">{title}</h4>
                    {message && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{message}</p>}
                </div>
                <button onClick={() => toast.dismiss(id)} className="text-white/20 hover:text-white">
                    <X size={14} />
                </button>
            </div>
        ));
    },

    // Confirm: System Modal
    confirm(title, message, onConfirm) {
        toast.custom((id) => (
            <AdminConfirmContent id={id} title={title} message={message} onConfirm={onConfirm} />
        ), { duration: Infinity });
    }
};