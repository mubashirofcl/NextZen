import React from "react";
import { ShieldAlert, X, Lock, AlertTriangle, Fingerprint } from "lucide-react";

const BlockedModal = ({ open, reason, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      {/* 1. BACKDROP (Dark Blur) */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose} 
      />

      {/* 2. MODAL CARD */}
      <div className="relative w-full max-w-[380px] bg-[#050505] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/5">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-white/20 hover:text-white transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="pt-10 pb-8 px-8 flex flex-col items-center relative z-10">

          {/* ICON STAGE */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20" />
            <div className="w-20 h-20 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-full flex items-center justify-center relative shadow-lg">
              <ShieldAlert size={32} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </div>
            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-red-500">
                    Restricted
                </div>
            </div>
          </div>

          {/* HEADINGS */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
              Access Paused
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">
              Security Protocol: NX-99
            </p>
          </div>

          {/* REASON BOX (The "Reason" Display) */}
          <div className="w-full bg-white/[0.02] rounded-xl p-5 mb-8 border border-red-500/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
            
            {/* Label */}
            <div className="flex items-center gap-2 mb-2 opacity-50">
                <AlertTriangle size={10} className="text-red-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-red-400">System Message</span>
            </div>

            {/* The Actual Reason */}
            <p className="text-[11px] font-medium text-white/80 leading-relaxed font-mono">
              "{reason || "Suspicious activity detected. Your account requires manual verification before proceeding."}"
            </p>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={onClose}
            className="w-full bg-white text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#7a6af6] hover:text-white active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(122,106,246,0.3)]"
          >
            Acknowledge
          </button>

          {/* FOOTER */}
          <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/5 pt-6 w-full">
            <div className="flex items-center gap-2 text-white/20">
                <Fingerprint size={12} />
                <p className="text-[8px] font-bold uppercase tracking-widest">
                  ID: <span className="text-white/40 font-mono">USER-BLOCK-{Math.floor(Math.random() * 9999)}</span>
                </p>
            </div>
            <button className="text-[9px] text-red-500/60 font-bold uppercase tracking-widest hover:text-red-400 hover:underline decoration-red-500/30 underline-offset-4 transition-all">
              Contact Support
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BlockedModal;