import React from 'react';
import { ShieldCheck, Loader2, X } from 'lucide-react';

const PaymentModal = ({ isOpen, amount, onVerify, onClose, isProcessing }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#7a6af6] animate-pulse" />

                <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-black transition-colors">
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-[#7a6af6] shadow-inner">
                        <ShieldCheck size={40} />
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Secure Settlement</p>
                        <h2 className="text-4xl font-black italic tracking-tighter text-[#0F172A]">₹{amount.toLocaleString()}</h2>
                    </div>

                    <div className="w-full space-y-3">
                        <button
                            onClick={onVerify}
                            disabled={isProcessing}
                            className="w-full py-5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#7a6af6] transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Authorize Transaction'}
                        </button>
                        <p className="text-[9px] text-slate-400 font-bold uppercase italic">Protected by Industrial Grade Encryption</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;