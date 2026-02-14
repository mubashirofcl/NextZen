import React from 'react';
import { X, Info, ShieldCheck, ArrowRight, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderConfirmModal = ({ isOpen, onClose, onConfirm, totals, isPending, inventoryConflict }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    const glassStyle = "bg-white text-[#0F172A] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden w-full max-w-[500px] animate-in fade-in zoom-in duration-300";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
            <div className={glassStyle}>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1px)', backgroundSize: '24px 24px' }} />

                {/* Header */}
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="space-y-1">
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${inventoryConflict ? 'text-red-500' : 'text-[#7a6af6]'}`}>
                            {inventoryConflict ? 'Inventory Conflict' : 'Final Step'}
                        </p>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                            {inventoryConflict ? 'Items Unavailable' : 'Final Review'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-black">
                        <X size={24} />
                    </button>
                </div>

                {/* --- ERROR MESSAGE: Shown when items are blocked --- */}
                {inventoryConflict ? (
                    <div className="relative z-10 space-y-8 py-4">
                        <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                <AlertCircle size={32} className="text-red-500 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-black uppercase text-red-600">Stock Levels Changed</h4>
                                <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed px-4">
                                    One or more items in your bag are no longer available. We cannot process your order until these are removed.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => { onClose(); navigate('/cart'); }}
                            className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                        >
                            <ShoppingBag size={18} /> Update Your Bag
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Standard View: Only shown when items are available */}
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-start gap-4 mb-8 relative z-10">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Info size={18} className="text-[#7a6af6]" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-wide">
                                Please confirm your order total. You will pay for these items at the time of delivery.
                            </p>
                        </div>

                        <div className="space-y-5 mb-10 relative z-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic mb-2">Order Summary</h3>
                            <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                                <span>Items Total</span>
                                <span className="text-slate-900 font-black">₹{totals.subtotal?.toLocaleString()}</span>
                            </div>
                            {totals.totalDiscount > 0 && (
                                <div className="flex justify-between text-xs font-bold uppercase text-green-600">
                                    <span>Savings</span>
                                    <span className="font-black">- ₹{totals.totalDiscount?.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-bold uppercase text-slate-400 border-b border-dashed border-slate-200 pb-5">
                                <span>Delivery</span>
                                <span className="text-slate-900 font-black">{totals.deliveryCharge > 0 ? `₹${totals.deliveryCharge}` : 'FREE'}</span>
                            </div>
                            <div className="pt-2 flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-[#7a6af6] italic tracking-widest block">Payable</span>
                                    <span className="text-xs font-black uppercase text-slate-900 leading-none">Total Amount</span>
                                </div>
                                <span className="text-5xl font-black italic tracking-tighter leading-none text-[#0F172A]">
                                    ₹{totals.totalAmount?.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <button onClick={onClose} className="py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:bg-slate-50">Cancel</button>
                            <button onClick={onConfirm} disabled={isPending} className="py-4 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#7a6af6] transition-all shadow-xl active:scale-[0.95]">
                                {isPending ? <Loader2 className="animate-spin" size={16} /> : <>Place Order <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderConfirmModal;