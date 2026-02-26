import React from 'react';
import { X, ArrowRight, Loader2, AlertCircle, ShoppingBag, Wallet as WalletIcon, Truck, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    totals, 
    isPending, 
    inventoryConflict, 
    paymentMethod,
    couponCode 
}) => {
    const navigate = useNavigate();

    if (!isOpen || !totals) return null;

    const glassStyle = "bg-white text-[#0F172A] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden w-full max-w-[500px] animate-in fade-in zoom-in duration-300";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
            <div className={glassStyle}>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1px)', backgroundSize: '24px 24px' }} />


                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="space-y-1">
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${inventoryConflict ? 'text-red-500' : 'text-[#7a6af6]'}`}>
                            {inventoryConflict ? 'Inventory Conflict' : 'Protocol Check'}
                        </p>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                            {inventoryConflict ? 'Stock Mismatch' : 'Finalize Order'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-black">
                        <X size={24} />
                    </button>
                </div>

                {inventoryConflict ? (
                    <div className="relative z-10 space-y-8 py-4">
                        <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] flex flex-col items-center text-center gap-4">
                            <AlertCircle size={48} className="text-red-500 animate-pulse" />
                            <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed px-4 tracking-tighter">
                                Items in your bag are no longer available. Please update your bag to proceed.
                            </p>
                        </div>
                        <button onClick={() => { onClose(); navigate('/cart'); }} className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-lg shadow-red-200">
                            <ShoppingBag size={18} /> Re-sync bag
                        </button>
                    </div>
                ) : (
                    <>
     
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 mb-8 relative z-10">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                {paymentMethod === 'wallet' ? <WalletIcon size={18} className="text-green-500" /> : <Truck size={18} className="text-[#7a6af6]" />}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wide">
                                {paymentMethod === 'wallet'
                                    ? "Amount will be deducted from your Digital Wallet instantly."
                                    : "Authorization requested for standard logistics fulfillment."}
                            </p>
                        </div>

                        <div className="space-y-4 mb-10 relative z-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <div className="flex justify-between text-[11px] font-bold uppercase text-slate-400 tracking-tighter">
                                <span>Order Base</span>
                                <span className="text-zinc-900 font-black">₹{(totals.subtotal || 0).toLocaleString()}</span>
                            </div>

                            {totals.couponDiscount > 0 && (
                                <div className="flex justify-between text-[11px] font-bold uppercase text-indigo-600 tracking-tighter italic">
                                    <span className="flex items-center gap-1">
                                        <Tag size={10} /> 
                                        <span>Coupon {couponCode ? `(${couponCode})` : ''}</span>
                                    </span>

                                    <span className="font-black">- ₹{(totals.couponDiscount).toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-[11px] font-bold uppercase text-slate-400 tracking-tighter border-b border-dashed border-slate-200 pb-4">
                                <span>Logistics Fee</span>
                                <span className="text-zinc-900 font-black">
                                    {totals.deliveryCharge > 0 ? `₹${totals.deliveryCharge}` : 'FREE'}
                                </span>
                            </div>

                            <div className="pt-2 flex justify-between items-end">
                                <span className="text-xs font-black uppercase text-slate-900 italic">Settlement</span>
                                <span className="text-4xl font-black italic tracking-tighter text-[#0F172A] leading-none">
                                    ₹{(totals.finalTotal || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 relative z-10">
                            <button onClick={onConfirm} disabled={isPending} className="w-full py-5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#7a6af6] transition-all shadow-xl active:scale-[0.98]">
                                {isPending ? <Loader2 className="animate-spin" size={18} /> : <>Confirm & Transact <ArrowRight size={18} /></>}
                            </button>
                            <button onClick={onClose} className="w-full py-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-slate-500 transition-colors">Abort Procedure</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderConfirmModal;