import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useClearCart } from '../../hooks/user/useCart';
import {
    Trash2, Minus, Plus, ShoppingBag, ShieldX, Info,
    ArrowRight, Loader2, ShieldCheck, RefreshCw, Truck, AlertTriangle
} from 'lucide-react';
import { nxToast } from '../../utils/userToast';
import userAxios from '../../api/user/userAxios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CartList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { cart, updateQty, remove, isLoading } = useCart();
    const { mutate: clearCart } = useClearCart();

    const items = cart?.items || [];

    // --- STOCK LOGIC ---
    // An item is "Active" only if it exists and has stock >= quantity
    const activeItems = items.filter(i => i.variantId && i.isCheckoutReady !== false);
    const brokenItems = items.filter(i => !i.variantId || i.isCheckoutReady === false);

    // --- CALCULATIONS (Only on Active Items) ---
    const totalMarketPrice = activeItems.reduce((acc, item) => {
        const mrp = Number(item.marketPrice) || Number(item.currentPrice) || 0;
        return acc + (mrp * item.quantity);
    }, 0);

    const subtotal = activeItems.reduce((acc, item) => acc + (item.currentPrice * item.quantity), 0);
    const totalSavings = totalMarketPrice - subtotal;

    const deliveryCharge = (subtotal > 0 && subtotal < 1999) ? 99 : 0;
    const finalTotalAmount = subtotal + deliveryCharge;

    const glassStyle = "bg-gradient-to-br from-white/[0.10] to-transparent backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl";

    const validateAndProceed = useMutation({
        mutationFn: async () => {
            const { data } = await userAxios.get("/user/cart/validate-checkout");
            return data;
        },
        onSuccess: () => navigate('/checkout'),
        onError: (error) => {
            queryClient.invalidateQueries(["cart"]);
            nxToast.security("Inventory Conflict", error.response?.data?.message || "Validation failed.");
        }
    });

    const handleProceed = () => {
        if (brokenItems.length > 0) {
            return nxToast.security(
                "Conflict Detected",
                "Please remove out-of-stock assets before deployment."
            );
        }
        if (activeItems.length === 0) return nxToast.error("Empty Archive", "Add items first.");
        validateAndProceed.mutate();
    };

    if (isLoading) return <div className="py-20 text-center animate-pulse text-[#7a6af6] font-black uppercase tracking-[0.5em]">Syncing...</div>;

    if (items.length === 0) return (
        <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-6">
            <ShoppingBag className="mx-auto text-white/5" size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Your archive is empty</p>
            <button
                onClick={() => navigate('/shop')}
                className="bg-white text-black px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#7a6af6] hover:text-white transition-all active:scale-95"
            >
                Explore Drops
            </button>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start max-w-[1200px] mx-auto pb-20">
            {/* LEFT: ITEMS */}
            <div className="w-full lg:flex-1 space-y-4">
                <div className="flex justify-between items-center px-2 pb-2 border-b border-white/5">
                    <h2 className="text-[9px] font-black uppercase text-[#7a6af6] italic tracking-[0.3em]">01 // Assets ({items.length})</h2>
                    <button onClick={() => nxToast.confirm("Purge All?", "Clear archive?", () => clearCart())} className="text-[8px] font-black uppercase text-red-500/40 hover:text-red-500 transition-colors">Clear Cart</button>
                </div>

                {items.map((item) => {
                    const isOutOfStock = !item.variantId || item.isCheckoutReady === false;
                    const hasDiscount = item.marketPrice > item.currentPrice;

                    return (
                        <div key={item._id} className={`${glassStyle} p-5 flex flex-col sm:flex-row items-center gap-6 group hover:border-white/20 transition-all relative overflow-hidden`}>

                            {/* --- STOCK OVERLAY --- */}
                            {isOutOfStock && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center border border-red-500/20 rounded-3xl">
                                    <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full shadow-xl">
                                        <ShieldX size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Decommissioned // Out of Stock</span>
                                    </div>
                                </div>
                            )}

                            <div className={`w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-black ${isOutOfStock ? 'opacity-30' : ''}`}>
                                <img src={item.variantId?.images?.[0]} className="w-full h-full object-cover" alt="" />
                            </div>

                            <div className={`flex-1 space-y-3 ${isOutOfStock ? 'opacity-30' : ''}`}>
                                <div>
                                    <h3 className="text-xs font-black text-white italic uppercase">{item.productId?.name || "Unknown Asset"}</h3>
                                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Size: {item.size} | SKU: {item.variantId?._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
                                        <button
                                            onClick={() => updateQty.mutate({ itemId: item._id, action: 'dec' })}
                                            disabled={item.quantity <= 1 || isOutOfStock}
                                            className="p-1.5 text-white/30 hover:text-white disabled:opacity-0"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-[10px] font-black w-6 text-center text-white">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQty.mutate({ itemId: item._id, action: 'inc' })}
                                            disabled={item.quantity >= 5 || isOutOfStock}
                                            className="p-1.5 text-white/30 hover:text-white disabled:opacity-0"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* --- REMOVE BUTTON (Always Active) --- */}
                            <button
                                onClick={() => remove.mutate(item._id)}
                                className="absolute top-4 right-4 z-30 p-2 text-white/10 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>

                            <div className={`text-right sm:border-l border-white/5 sm:pl-8 min-w-[100px] ${isOutOfStock ? 'opacity-30' : ''}`}>
                                {hasDiscount && <p className="text-[9px] font-bold text-white/20 line-through mb-0.5 italic">₹{(item.marketPrice * item.quantity).toLocaleString()}</p>}
                                <span className="text-lg font-black text-white italic">₹{(item.currentPrice * item.quantity).toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* RIGHT: PRICE DETAILS */}
            <div className="w-full lg:w-[320px] lg:sticky lg:top-32">
                <div className="bg-white text-[#0F172A] p-6 rounded-2xl shadow-xl border border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-5 border-b border-slate-50 pb-3 italic">
                        Settlement manifest
                    </h3>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-[12px] font-bold uppercase tracking-tight text-slate-500">
                            <span>Active items ({activeItems.length})</span>
                            <span className="text-black">₹{totalMarketPrice.toLocaleString()}</span>
                        </div>

                        {totalSavings > 0 && (
                            <div className="flex justify-between text-[12px] font-bold uppercase tracking-tight text-green-600">
                                <span>Applied rebate</span>
                                <span>- ₹{totalSavings.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-[12px] font-bold uppercase tracking-tight text-slate-500 border-b border-dashed border-slate-100 pb-4">
                            <span>Logistics</span>
                            <span className="font-black text-black">{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span>
                        </div>

                        <div className="pt-1 flex justify-between items-center text-lg font-black uppercase tracking-tighter text-black leading-none">
                            <span>Total deployment</span>
                            <span className="text-2xl italic tracking-tighter">₹{finalTotalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleProceed}
                        disabled={validateAndProceed.isPending || brokenItems.length > 0}
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all duration-300 shadow-lg active:scale-95 ${brokenItems.length > 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-[#0F172A] text-white hover:bg-[#7a6af6]'
                            }`}
                    >
                        {validateAndProceed.isPending ? <Loader2 className="animate-spin" size={14} /> : <>Checkout <ArrowRight size={14} /></>}
                    </button>

                    {brokenItems.length > 0 && (
                        <p className="text-[8px] font-black text-red-500 uppercase mt-4 text-center leading-tight tracking-widest">
                            Archive contains inventory conflicts.<br />Remove out-of-stock items to proceed.
                        </p>
                    )}

                    <div className="mt-6 space-y-2 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-green-600">
                            <ShieldCheck size={12} />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Security Protocol Verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartList;