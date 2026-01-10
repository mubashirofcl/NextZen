import React, { useState } from "react";
import { Ban, X, AlertCircle } from "lucide-react";

const BlockModal = ({ user, onClose, onConfirm }) => {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        if (reason.trim().length < 5) return alert("Please specify a reason (min 5 characters)");
        onConfirm(reason);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-[400px] rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-100">

                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                            <Ban size={18} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">Restrict User</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-[#0F172A]">
                            {user.name?.charAt(0) || "U"}
                        </div>
                        <div className="leading-tight">
                            <p className="text-xs font-bold text-[#0F172A] uppercase tracking-tight mb-1">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 ml-1">
                            <AlertCircle size={10} className="text-slate-400" />
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Reason for Restriction
                            </label>
                        </div>
                        <textarea
                            autoFocus
                            placeholder="Specify why you are blocking this account..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-[#0F172A] outline-none transition-all focus:bg-white focus:border-[#0F172A] h-32 resize-none placeholder:text-slate-300"
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-[#0F172A] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-black active:scale-95 transition-all"
                    >
                        Confirm Block
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlockModal;