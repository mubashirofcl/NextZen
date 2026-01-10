import React from "react";
import { ShieldAlert, XCircle } from "lucide-react";

const BlockedModal = ({ open, reason, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0F172A]/20 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-[360px] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        <div className="pt-10 pb-4 px-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert size={32} strokeWidth={2.5} />
          </div>
          
          <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter mb-2">
            Access Restricted
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Account Security Protocol
          </p>
        </div>

        <div className="px-10 pb-8 text-center">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8">
            <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
              "{reason || "Your account has been flagged for a violation of our terms of service."}"
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#0F172A] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black active:scale-95 transition-all"
          >
            Acknowledge
          </button>
          
          <p className="mt-6 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Contact support@nextzen.com for appeals
          </p>
        </div>

        <div className="h-1.5 w-full bg-red-500" />
      </div>
    </div>
  );
};

export default BlockedModal;