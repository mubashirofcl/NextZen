import React from "react";
import { Loader2 } from "lucide-react";

const GlobalLoader = ({ message = "Synchronizing with Cloud Systems..." }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md">
            <div className=" p-10 rounded-[40px] shadow-2xl flex flex-col items-center border border-white/20 animate-in fade-in zoom-in duration-300">
                
                <div className="relative flex items-center justify-center mb-8">

                    <div className="absolute w-20 h-20 border-4 border-[#7a6af6]/10 rounded-full animate-ping"></div>

                    <div className="absolute w-16 h-16 border-t-4 border-l-4 border-[#7a6af6] rounded-full animate-spin"></div>

                    <div className="w-12 h-12 bg-[#7a6af6] rounded-2xl flex items-center justify-center shadow-lg shadow-[#7a6af6]/40">
                        <Loader2 className="text-white animate-spin-slow" size={24} />
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#0F172A] mb-2">
                        Processing
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                        {message}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-10 flex items-center gap-2 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7a6af6] animate-bounce" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">
                    NextZen Architecture
                </span>
            </div>
        </div>
    );
};

export default GlobalLoader;