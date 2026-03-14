import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { createPortal } from 'react-dom';

const baseToast = (render, options = {}) => {
    toast.custom(render, { duration: 4000, ...options });
};

const ConfirmToastContent = ({ id, title, message, onConfirm }) => {
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

            <div
                className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => !isPending && toast.dismiss(id)}
            />

            <div
                className="relative bg-white w-[85%] max-w-[320px] rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 duration-300 border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-6">

                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={24} strokeWidth={2.5} />
                    </div>

                    <h3 className="text-base font-black text-[#0F172A] uppercase tracking-tighter leading-none">
                        {title}
                    </h3>

                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-3 px-2 leading-relaxed">
                        {message}
                    </p>
                </div>


                <div className="space-y-2">
                    <button
                        onClick={handleExecute}
                        disabled={isPending}
                        className="w-full py-3.5 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Confirm Delete"}
                    </button>

                    <button
                        onClick={() => toast.dismiss(id)}
                        disabled={isPending}
                        className="w-full py-3.5 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
                    >
                        Abort
                    </button>
                </div>


                <button
                    onClick={() => toast.dismiss(id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-black transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
    );
};

export const nxToast = {
    success(title = "Success", message = "") {
        baseToast((id) => (
            <div className="bg-white/60 backdrop-blur-xl border-2 border-[#7a6af6]/20 p-3 mb-4 rounded-[1rem] shadow-2xl flex items-center gap-4 pointer-events-auto">
                <div className="bg-[#7a6af6] p-2 rounded-xl text-white">
                    <CheckCircle2 size={20} />
                </div>

                <div className="flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">
                        {title}
                    </h4>
                    {message && (
                        <p className="text-[9px] font-bold text-slate-500 mt-1">
                            {message}
                        </p>
                    )}
                </div>

                <button onClick={() => toast.dismiss(id)}>
                    <X size={16} />
                </button>
            </div>
        ));
    },

    security(title = "Action Blocked", message = "") {
        baseToast((id) => (
            <div className="bg-[#0F172A]/90 backdrop-blur-xl border-2 border-[#7a6af6]/20 p-3 mb-4 rounded-[1rem] shadow-2xl flex items-center gap-4 pointer-events-auto">
                <div className="bg-[#7a6af6]/20 p-2 rounded-xl text-[#7a6af6]">
                    <ShieldCheck size={20} />
                </div>

                <div className="flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        {title}
                    </h4>
                    {message && (
                        <p className="text-[9px] font-bold text-slate-400 mt-1">
                            {message}
                        </p>
                    )}
                </div>

                <button onClick={() => toast.dismiss(id)}>
                    <X size={16} />
                </button>
            </div>
        ));
    },

    confirm(title, message, onConfirm) {
        toast.custom(
            (id) => (
                <ConfirmToastContent
                    id={id}
                    title={title}
                    message={message}
                    onConfirm={onConfirm}
                />
            ),
            { duration: Infinity }
        );
    }
};
