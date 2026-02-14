import React, { useState } from 'react';
import { X, AlertCircle, Loader2, AlertTriangle, Box, Check } from 'lucide-react';
import { useCancelItem, useReturnItem, useCancelFullOrder } from '../../hooks/user/useOrder';

const OrderActionModal = ({ config, onClose, orderId }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    
    const { mutate: cancelItem, isPending: isCancelling } = useCancelItem();
    const { mutate: returnItem, isPending: isReturning } = useReturnItem();
    const { mutate: cancelFullOrder, isPending: isCancellingAll } = useCancelFullOrder();

    if (!config.isOpen) return null;

    const isReturn = config.type === 'return';
    const isCancelAll = config.type === 'cancel_all';
    const isPending = isCancelling || isReturning || isCancellingAll;

    // --- PRESET REASONS CONFIG ---
    const cancelPresets = ["Changed my mind", "Found better price", "Ordered by mistake", "Delayed delivery"];
    const returnPresets = ["Damaged product", "Wrong size received", "Quality not as expected", "Missing items"];
    const presets = isReturn ? returnPresets : cancelPresets;

    const validateAndSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isReturn && !reason.trim()) {
            setError('A valid reason is mandatory for return processing.');
            return;
        }
        if (reason.trim().length < 5) {
            setError('Min. 5 characters required for the manifest log.');
            return;
        }

        const handleSuccess = () => {
            setReason('');
            onClose();
        };

        if (isCancelAll) {
            cancelFullOrder({ orderId, reason }, { onSuccess: handleSuccess });
        } else if (isReturn) {
            returnItem({ orderId, itemId: config.itemId, reason }, { onSuccess: handleSuccess });
        } else {
            cancelItem({ orderId, itemId: config.itemId, reason }, { onSuccess: handleSuccess });
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <form 
                onSubmit={validateAndSubmit}
                className="bg-white text-[#0F172A] p-10 rounded-[2.5rem] w-full max-w-[480px] relative animate-in zoom-in duration-300 shadow-2xl"
            >
                <button type="button" onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-black transition-colors">
                    <X size={24} />
                </button>

                <header className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a6af6] mb-2 italic">
                        {isCancelAll ? 'Global Protocol' : 'Item Protocol'}
                    </p>
                    <h2 className={`text-3xl font-black uppercase italic tracking-tighter ${isCancelAll || config.type === 'cancel' ? 'text-red-600' : 'text-amber-600'}`}>
                        {isCancelAll ? 'Void Entire Order' : isReturn ? 'Return Item' : 'Cancel Item'}
                    </h2>
                </header>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex items-start gap-3">
                    {isCancelAll ? <AlertTriangle className="text-red-500 mt-1" size={18} /> : <Box className="text-slate-400 mt-1" size={18} />}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Targeting:</p>
                        <p className="text-sm font-black uppercase italic text-slate-800">{config.itemName}</p>
                    </div>
                </div>

                {/* --- PRESET PILLS --- */}
                <div className="mb-6">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest">Select a Reason:</p>
                    <div className="flex flex-wrap gap-2">
                        {presets.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => { setReason(p); setError(''); }}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all border ${
                                    reason === p 
                                    ? 'bg-[#7a6af6] border-[#7a6af6] text-white shadow-md' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#7a6af6]'
                                }`}
                            >
                                {reason === p && <Check size={10} className="inline mr-1" />} {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Detailed explanation
                        </label>
                        <span className={`text-[9px] font-bold ${reason.length > 200 ? 'text-red-500' : 'text-slate-300'}`}>
                            {reason.length}/250
                        </span>
                    </div>
                    
                    <textarea
                        value={reason}
                        onChange={(e) => { setReason(e.target.value); if(error) setError(''); }}
                        maxLength={250}
                        placeholder="Or type your specific reason here..."
                        className={`w-full bg-slate-50 border rounded-2xl p-4 text-xs font-medium transition-all outline-none h-28 resize-none focus:ring-2 ${
                            error ? 'border-red-500 ring-red-100' : 'border-slate-200 focus:ring-[#7a6af6]'
                        }`}
                    />
                    
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 animate-pulse">
                            <AlertCircle size={12} />
                            <p className="text-[9px] font-bold uppercase tracking-wider">{error}</p>
                        </div>
                    )}
                </div>

                <footer className="grid grid-cols-2 gap-4 mt-8">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all"
                    >
                        Discard
                    </button>
                    
                    <button
                        type="submit"
                        disabled={isPending}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                            isReturn ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                        }`}
                    >
                        {isPending ? (
                            <Loader2 className="animate-spin mx-auto" size={16} />
                        ) : (
                            `Process ${isCancelAll ? 'Void' : config.type}`
                        )}
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default OrderActionModal;