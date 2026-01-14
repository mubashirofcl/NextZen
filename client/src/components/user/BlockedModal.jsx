import React from "react";
import { ShieldAlert, X } from "lucide-react";

const BlockedModal = ({ open, reason, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-[340px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="pt-12 pb-8 px-8 flex flex-col items-center">

          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-red-50/50">
            <ShieldAlert size={28} strokeWidth={2.5} />
          </div>

          <div className="text-center space-y-1 mb-8">
            <h2 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">
              Account Paused
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
              Security Restriction
            </p>
          </div>

          <div className="w-full bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
            <p className="text-[11px] font-bold text-slate-600 leading-relaxed text-center italic opacity-80">
              "{reason || "System has identified activity that requires a manual review of your account."}"
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#0F172A] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] shadow-lg shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all"
          >
            Acknowledge
          </button>

          <div className="mt-8 flex flex-col items-center gap-1">
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">
              Issue ID: NX-RES-0042
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest hover:text-[#7a6af6] cursor-pointer transition-colors">
              Request Appeal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedModal;